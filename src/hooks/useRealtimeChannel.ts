import { useEffect, useRef, useState, useCallback } from "react"
import { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { env } from "@/lib/env"

// Generate a unique tab ID that persists for the session
const generateTabId = () => {
  const stored = sessionStorage.getItem('tab_id')
  if (stored) return stored
  
  const tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  sessionStorage.setItem('tab_id', tabId)
  return tabId
}

export interface RealtimeMessage {
  type: string
  event: string
  payload: unknown
  ref: string | null
}

export interface PresenceState {
  [key: string]: {
    user_id: string
    full_name: string
    email: string
    joined_at: string
    tab_id: string
  }[]
}

export interface UseRealtimeChannelOptions {
  onMessage?: (message: RealtimeMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
  onPresenceUpdate?: (presence: PresenceState) => void
}

export function useRealtimeChannel(
  channelName: string | null,
  options: UseRealtimeChannelOptions = {}
) {
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [presenceState, setPresenceState] = useState<PresenceState>({})
  // Optimistic local participant (used before server presence sync arrives)
  const [localParticipant, setLocalParticipant] = useState<null | {
    user_id: string
    full_name: string
    email: string
    joined_at: string
    tab_id: string
  }>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const { onMessage, onConnect, onDisconnect, onError, onPresenceUpdate } = options

  useEffect(() => {
    if (!channelName || !env.isSupabaseConfigured) {
      setConnectionStatus("disconnected")
      return
    }

    setConnectionStatus("connecting")

    // Create channel
    const channel = supabase.channel(channelName)

    // Set up event handlers
    // Helper to reconcile presence and refresh participants
    const reconcilePresence = () => {
      const newPresenceState = channelRef.current?.presenceState() as PresenceState
      if (!newPresenceState) return
      setPresenceState(newPresenceState)
      onPresenceUpdate?.(newPresenceState)
    }

    channel
      .on("broadcast", { event: "*" }, (payload) => {
        const message: RealtimeMessage = {
          type: "broadcast",
          event: payload.event,
          payload: payload.payload,
          ref: null,
        }
        setMessages(prev => [...prev, message])
        onMessage?.(message)
      })
      .on("presence", { event: "sync" }, () => {
        reconcilePresence()
      })
      .on("presence", { event: "join" }, () => {
        reconcilePresence()
        // Retry reconcile a few times in case join propagation is slow
        for (const ms of [60, 150, 300]) {
          setTimeout(() => reconcilePresence(), ms)
        }
      })
      .on("presence", { event: "leave" }, () => {
        reconcilePresence()
      })
      .subscribe((status) => {
        switch (status) {
          case "SUBSCRIBED":
            setConnectionStatus("connected")
            onConnect?.()
            break
          case "CHANNEL_ERROR":
            setConnectionStatus("disconnected")
            onError?.("Channel error")
            break
          case "TIMED_OUT":
            setConnectionStatus("disconnected")
            onError?.("Connection timed out")
            break
          case "CLOSED":
            setConnectionStatus("disconnected")
            onDisconnect?.()
            break
        }
      })

    channelRef.current = channel

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setConnectionStatus("disconnected")
    }
  }, [channelName, onMessage, onConnect, onDisconnect, onError, onPresenceUpdate])

  const sendMessage = useCallback((event: string, payload: unknown) => {
    if (channelRef.current && connectionStatus === "connected") {
      channelRef.current.send({
        type: "broadcast",
        event,
        payload,
      })
      return true
    } else {
      return false
    }
  }, [connectionStatus])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const trackPresence = useCallback((userInfo: {
    user_id: string
    full_name: string
    email: string
  }) => {
    if (!(channelRef.current && connectionStatus === "connected")) {
      return false
    }

    const tabId = generateTabId()
    const presenceData = {
      ...userInfo,
      joined_at: new Date().toISOString(),
      tab_id: tabId
    }

    // Optimistically add local participant so UI shows immediately
    setLocalParticipant(presenceData)

    channelRef.current.track(presenceData)

    // Poll presenceState a few times to reconcile with server
    const pollIntervals = [40, 120, 250, 500]
    for (const ms of pollIntervals) {
      setTimeout(() => {
        const newPresenceState = channelRef.current?.presenceState() as PresenceState
        if (!newPresenceState || Object.keys(newPresenceState).length === 0) return

        setPresenceState(newPresenceState)
        onPresenceUpdate?.(newPresenceState)

        // Check if server now has our user
        let userFound = false
        for (const arr of Object.values(newPresenceState)) {
          for (const p of arr) {
            if (p.user_id === userInfo.user_id) {
              userFound = true
              break
            }
          }
          if (userFound) break
        }
        if (userFound) setLocalParticipant(null)
      }, ms)
    }

    return true
  }, [connectionStatus, onPresenceUpdate])

  const untrackPresence = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.untrack()
      return true
    }
    return false
  }, [])

  const getParticipants = useCallback(() => {
    // Convert presence state to a flat array and deduplicate by user_id
    const participantsMap = new Map<string, {
      user_id: string
      full_name: string
      email: string
      joined_at: string
      tab_count: number
    }>()
    
    for (const presences of Object.values(presenceState)) {
      for (const presence of presences) {
        const existingParticipant = participantsMap.get(presence.user_id)
        if (existingParticipant) {
          existingParticipant.tab_count += 1
          if (presence.joined_at < existingParticipant.joined_at) {
            existingParticipant.joined_at = presence.joined_at
          }
        } else {
          participantsMap.set(presence.user_id, {
            user_id: presence.user_id,
            full_name: presence.full_name,
            email: presence.email,
            joined_at: presence.joined_at,
            tab_count: 1
          })
        }
      }
    }

    // If we have an optimistic localParticipant not yet in map, add it
    if (localParticipant && !participantsMap.has(localParticipant.user_id)) {
      participantsMap.set(localParticipant.user_id, {
        user_id: localParticipant.user_id,
        full_name: localParticipant.full_name,
        email: localParticipant.email,
        joined_at: localParticipant.joined_at,
        tab_count: 1
      })
    }
    
    return Array.from(participantsMap.values()).sort((a, b) => a.joined_at.localeCompare(b.joined_at))
  }, [presenceState, localParticipant])

  // Compute participants as state so components re-render when it changes
  const [participants, setParticipants] = useState<{
    user_id: string
    full_name: string
    email: string
    joined_at: string
    tab_count: number
  }[]>([])

  // Update participants whenever presenceState changes
  useEffect(() => {
    setParticipants(getParticipants())
  }, [getParticipants])

  return {
    connectionStatus,
    messages,
    sendMessage,
    clearMessages,
    trackPresence,
    untrackPresence,
    getParticipants,
    participants, // Add participants as state
    presenceState,
    isConnected: connectionStatus === "connected",
  }
}