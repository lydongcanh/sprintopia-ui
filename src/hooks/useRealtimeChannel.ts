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
        const newPresenceState = channel.presenceState() as PresenceState
        setPresenceState(newPresenceState)
        onPresenceUpdate?.(newPresenceState)
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences)
        const newPresenceState = channel.presenceState() as PresenceState
        setPresenceState(newPresenceState)
        onPresenceUpdate?.(newPresenceState)
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences)
        const newPresenceState = channel.presenceState() as PresenceState
        setPresenceState(newPresenceState)
        onPresenceUpdate?.(newPresenceState)
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
    if (channelRef.current && connectionStatus === "connected") {
      const tabId = generateTabId()
      const presenceData = {
        ...userInfo,
        joined_at: new Date().toISOString(),
        tab_id: tabId
      }
      
      // Use tab_id as the presence key to handle multiple tabs per user
      channelRef.current.track(presenceData)
      return true
    }
    return false
  }, [connectionStatus])

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
          // User already exists, increment tab count and use earliest join time
          existingParticipant.tab_count += 1
          if (presence.joined_at < existingParticipant.joined_at) {
            existingParticipant.joined_at = presence.joined_at
          }
        } else {
          // New user, add to map
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
    
    return Array.from(participantsMap.values())
  }, [presenceState])

  return {
    connectionStatus,
    messages,
    sendMessage,
    clearMessages,
    trackPresence,
    untrackPresence,
    getParticipants,
    presenceState,
    isConnected: connectionStatus === "connected",
  }
}