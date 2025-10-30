import { useParams, Link } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import { useRealtimeChannel, type RealtimeMessage } from "@/hooks/useRealtimeChannel"
import { api, APIError } from "@/services/api"
import type { GroomingSession } from "@/types/api"

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<GroomingSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Store channel name separately to prevent unnecessary re-connections
  const [channelName, setChannelName] = useState<string | null>(null)

  // Memoize callbacks to prevent unnecessary re-renders
  const handleMessage = useCallback((message: RealtimeMessage) => {
    // Handle incoming real-time messages here
    console.log("Received message:", message)
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
        const sessionData = await api.getGroomingSession(sessionId)
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
  }, [sessionId])

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
              <p className="text-sm text-muted-foreground">
                Session ID: {session.id} • Status: {session.status}
              </p>
              <p className="text-xs text-muted-foreground">
                Channel: {session.real_time_channel_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className="text-sm text-muted-foreground capitalize">
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Real-time Status</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Connection: <span className="capitalize font-medium">{connectionStatus}</span>
                </p>
                {!isConnected && connectionStatus === "disconnected" && (
                  <p className="text-xs text-muted-foreground">
                    💡 Real-time features require Supabase configuration
                  </p>
                )}
              </div>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Session Info</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Created:</span> {new Date(session.created_at).toLocaleString()}</p>
                <p><span className="text-muted-foreground">Updated:</span> {new Date(session.updated_at).toLocaleString()}</p>
                <p><span className="text-muted-foreground">Status:</span> {session.status}</p>
              </div>
            </div>
          </div>
          
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              This is the grooming session page. Real-time features are {isConnected ? "active" : "inactive"}.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}