import { useEffect, useRef, useState, useCallback } from "react"
import { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { env } from "@/lib/env"

export interface RealtimeMessage {
  type: string
  event: string
  payload: unknown
  ref: string | null
}

export interface UseRealtimeChannelOptions {
  onMessage?: (message: RealtimeMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}

export function useRealtimeChannel(
  channelName: string | null,
  options: UseRealtimeChannelOptions = {}
) {
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const { onMessage, onConnect, onDisconnect, onError } = options

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
  }, [channelName, onMessage, onConnect, onDisconnect, onError])

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

  return {
    connectionStatus,
    messages,
    sendMessage,
    clearMessages,
    isConnected: connectionStatus === "connected",
  }
}