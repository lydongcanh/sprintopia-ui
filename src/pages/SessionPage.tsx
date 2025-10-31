import { useParams, Link } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import { useRealtimeChannel, type RealtimeMessage } from "@/hooks/useRealtimeChannel"
import { useAuth } from '@/hooks/useAuth'
import { UserMenu } from '@/components/auth/UserMenu'
import { ParticipantsList } from '@/components/ParticipantsList'
import { api, APIError } from "@/services/api"
import type { GroomingSession } from "@/types/api"

interface Participant {
  user_id: string
  full_name: string
  email: string
  joined_at: string
}

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session: authSession } = useAuth()
  const [session, setSession] = useState<GroomingSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])

  // Store channel name separately to prevent unnecessary re-connections
  const [channelName, setChannelName] = useState<string | null>(null)

  // Memoize callbacks to prevent unnecessary re-renders
  const handleMessage = useCallback((message: RealtimeMessage) => {
    // Log incoming real-time messages
    console.log("Received message:", message)
    
    // Handle join/leave events
    if (message.event === 'user_joined' && message.payload) {
      const userData = message.payload as { user_id: string; full_name: string; email: string }
      setParticipants(prev => {
        // Don't add if already exists
        if (prev.some(p => p.user_id === userData.user_id)) {
          return prev
        }
        return [...prev, {
          ...userData,
          joined_at: new Date().toISOString()
        }]
      })
    } else if (message.event === 'user_left' && message.payload) {
      const userData = message.payload as { user_id: string }
      setParticipants(prev => prev.filter(p => p.user_id !== userData.user_id))
    }
  }, [])

  const handleConnect = useCallback(() => {
    // Connection established
  }, [])

  const handleDisconnect = useCallback(() => {
    // Connection lost
  }, [])

  const handleError = useCallback((error: string) => {
    console.error("Real-time error:", error)
  }, [])

  // Real-time channel setup
  const { connectionStatus, isConnected } = useRealtimeChannel(
    channelName,
    {
      onMessage: handleMessage,
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
      onError: handleError,
    }
  )

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500"
      case "connecting":
        return "bg-yellow-500"
      case "disconnected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  useEffect(() => {
    if (!sessionId) return

    const fetchSession = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const sessionData = await api.getGroomingSession(sessionId, authSession?.access_token)
        if (sessionData) {
          setSession(sessionData)
          // Set channel name only once when session is loaded
          setChannelName(sessionData.real_time_channel_name)
        } else {
          setError("Session not found")
        }
      } catch (err) {
        if (err instanceof APIError) {
          setError(`Failed to load session: ${err.message}`)
        } else {
          setError("An unexpected error occurred")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, authSession?.access_token])

  // Handle joining and leaving the session
  useEffect(() => {
    if (!sessionId || !session || !authSession?.access_token) return

    const joinSession = async () => {
      try {
        // Get the internal_user_id from auth session metadata
        const internalUserId = authSession.user?.user_metadata?.internal_user_id
        if (!internalUserId) {
          console.error("No internal_user_id found in user metadata")
          return
        }

        await api.joinGroomingSession(sessionId, internalUserId, authSession.access_token)
        console.log("Successfully joined session")
      } catch (err) {
        console.error("Failed to join session:", err)
      }
    }

    const leaveSession = async () => {
      try {
        const internalUserId = authSession.user?.user_metadata?.internal_user_id
        if (!internalUserId) return

        await api.leaveGroomingSession(sessionId, internalUserId, authSession.access_token)
        console.log("Successfully left session")
      } catch (err) {
        console.error("Failed to leave session:", err)
      }
    }

    // Join when component mounts and session is ready
    joinSession()

    // Leave when component unmounts
    return () => {
      leaveSession()
    }
  }, [sessionId, session, authSession])

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid Session</h1>
          <p className="text-muted-foreground mt-2">Session ID is required</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">
            Go back to home
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">
            Go back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4">
                <Link to="/" className="text-primary hover:underline">
                  ← Back to Home
                </Link>
                <h1 className="text-2xl font-bold text-primary">{session.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                <span className="text-sm text-muted-foreground capitalize">
                  {connectionStatus}
                </span>
              </div>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <ParticipantsList participants={participants} />
        </div>
      </main>
    </div>
  )
}