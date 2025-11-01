import { useParams, Link, useNavigate } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import type { GroomingSession } from "@/types/api"
import type { EstimationState } from "@/types/session"
import { useRealtimeChannel, type RealtimeMessage } from "@/hooks/useRealtimeChannel"
import { useAuth } from '@/hooks/useAuth'
import { UserMenu } from '@/components/auth/UserMenu'
import { SimpleEstimationCard } from '@/components/SimpleEstimationCard'
import { EstimationResults } from '@/components/EstimationResults'
import { VotingStatus } from '@/components/VotingStatus'
import { ServerStatus } from '@/components/ServerStatus'
import { Button } from '@/components/ui/button'
import { api, APIError } from "@/services/api"
import { toast } from 'sonner'

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session: authSession, user } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState<GroomingSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth/signin')
    }
  }, [user, navigate])

  // Estimation state
  const [estimationState, setEstimationState] = useState<EstimationState>({
    isActive: false,
    currentTurnId: null,
    estimations: [],
    userHasSubmitted: false,
    showResults: false
  })
  const [isStartingNewTurn, setIsStartingNewTurn] = useState(false)
  const [isEndingTurn, setIsEndingTurn] = useState(false)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)

  // Store channel name separately to prevent unnecessary re-connections
  const [channelName, setChannelName] = useState<string | null>(null)

  // Memoize callbacks to prevent unnecessary re-renders
  const handleMessage = useCallback((message: RealtimeMessage) => {
    // Log incoming real-time messages
    console.log("Received message:", message)
    
    // Handle estimation-related events
    if (message.event === 'start_estimation_turn' && message.payload) {
      const { estimation_turn_id } = message.payload as { estimation_turn_id: string }
      setEstimationState(prev => ({
        ...prev,
        isActive: true,
        currentTurnId: estimation_turn_id,
        estimations: [],
        userHasSubmitted: false,
        showResults: false
      }))
    } else if (message.event === 'estimation_submitted' && message.payload) {
      const payload = message.payload as { 
        user_id: string; 
        full_name: string; 
        email: string; 
        estimation_value: number; 
        submitted_at: string;
      }
      
      setEstimationState(prev => ({
        ...prev,
        estimations: [
          ...prev.estimations.filter(e => e.user_id !== payload.user_id), // Remove existing estimation
          {
            user_id: payload.user_id,
            full_name: payload.full_name,
            email: payload.email,
            estimation_value: payload.estimation_value
          }
        ]
      }))
    } else if (message.event === 'end_estimation_turn' && message.payload) {
      setEstimationState(prev => ({
        ...prev,
        isActive: false,
        showResults: true
      }))
    }
  }, [])

  const handlePresenceUpdate = useCallback(() => {
    // This will be called whenever presence state changes
    // The actual participant list will be managed by the getParticipants function
    console.log("Presence state updated")
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
  const { connectionStatus, isConnected, trackPresence, untrackPresence, participants, sendMessage } = useRealtimeChannel(
    channelName,
    {
      onMessage: handleMessage,
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
      onError: handleError,
      onPresenceUpdate: handlePresenceUpdate,
    }
  )

  // Estimation functions
  const handleEstimationSubmit = async (value: number) => {
    if (!sessionId || !authSession?.user || !estimationState.currentTurnId || !sendMessage) return

    try {
      const userId = authSession.user.user_metadata?.internal_user_id || authSession.user.id
      const userName = authSession.user.user_metadata?.full_name || authSession.user.email || 'User'
      const userEmail = authSession.user.email || 'no-email@example.com'
      
      // Update local state immediately
      setEstimationState(prev => ({
        ...prev,
        userHasSubmitted: true,
        estimations: [
          ...prev.estimations.filter(e => e.user_id !== userId), // Remove existing estimation
          {
            user_id: userId,
            full_name: userName,
            email: userEmail,
            estimation_value: value
          }
        ]
      }))
      
      // Send estimation via real-time
      const success = sendMessage('estimation_submitted', {
        user_id: userId,
        full_name: userName,
        email: userEmail,
        estimation_value: value,
        submitted_at: new Date().toISOString(),
        turn_id: estimationState.currentTurnId
      })

      if (!success) {
        throw new Error("Failed to send estimation message")
      }
    } catch (err) {
      console.error("Failed to submit estimation:", err)
      toast.error("Failed to submit estimate")
    }
  }

  const handleStartNewTurn = useCallback(async () => {
    if (!sessionId || !sendMessage) return

    setIsStartingNewTurn(true)
    try {
      // Generate a new turn ID
      const turnId = `turn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      
      // Update local state immediately
      setEstimationState(prev => ({
        ...prev,
        isActive: true,
        currentTurnId: turnId,
        estimations: [],
        userHasSubmitted: false,
        showResults: false
      }))
      
      // Send start estimation turn message via real-time
      const success = sendMessage('start_estimation_turn', {
        estimation_turn_id: turnId,
        started_at: new Date().toISOString(),
        session_id: sessionId
      })

      if (!success) {
        throw new Error("Failed to send start estimation turn message")
      }
    } catch (err) {
      console.error("Failed to start new turn:", err)
      toast.error("Failed to start new round")
      // Revert local state on error
      setEstimationState(prev => ({
        ...prev,
        isActive: false,
        currentTurnId: null,
        estimations: [],
        userHasSubmitted: false,
        showResults: false
      }))
    } finally {
      setIsStartingNewTurn(false)
    }
  }, [sessionId, sendMessage])

  const handleEndEstimationTurn = async () => {
    if (!sessionId || !estimationState.currentTurnId || !sendMessage) return

    setIsEndingTurn(true)
    try {
      // Update local state immediately
      setEstimationState(prev => ({
        ...prev,
        isActive: false,
        showResults: true
      }))
      
      // Send end estimation turn message via real-time
      const success = sendMessage('end_estimation_turn', {
        estimation_turn_id: estimationState.currentTurnId,
        ended_at: new Date().toISOString(),
        session_id: sessionId,
        estimations: estimationState.estimations
      })

      if (!success) {
        throw new Error("Failed to send end estimation turn message")
      }
    } catch (err) {
      console.error("Failed to end turn:", err)
      toast.error("Failed to end round")
    } finally {
      setIsEndingTurn(false)
    }
  }

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

  // Handle joining and leaving the session using Presence
  useEffect(() => {
    if (!sessionId || !session || !authSession?.user || !isConnected || !trackPresence || !untrackPresence) return

    const userInfo = {
      user_id: authSession.user.user_metadata?.internal_user_id || authSession.user.id,
      full_name: authSession.user.user_metadata?.full_name || authSession.user.email || 'User',
      email: authSession.user.email || 'no-email@example.com'
    }

    // Track presence when connected
    const success = trackPresence(userInfo)
    if (success) {
      console.log("Successfully tracking presence for user:", userInfo.full_name)
    }

    // Untrack presence when component unmounts or connection lost
    return () => {
      untrackPresence()
      console.log("Stopped tracking presence")
    }
  }, [sessionId, session, authSession?.user, isConnected, trackPresence, untrackPresence])

  // Auto-start estimation turn when session first opens
  useEffect(() => {
    if (!sessionId || !session || !isConnected || !sendMessage) return
    
    // Only auto-start if there's no active turn and no results showing
    if (!estimationState.isActive && !estimationState.showResults && estimationState.currentTurnId === null && !hasAutoStarted) {
      // Mark as auto-started immediately to prevent UI flash
      setHasAutoStarted(true)
      
      // Start immediately without delay
      handleStartNewTurn()
    }
  }, [sessionId, session, isConnected, sendMessage, estimationState.isActive, estimationState.showResults, estimationState.currentTurnId, handleStartNewTurn, hasAutoStarted])

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
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          {/* Loading state while auto-starting */}
          {!estimationState.isActive && !estimationState.showResults && hasAutoStarted && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-6"></div>
              <p className="text-xl text-muted-foreground">Starting estimation round...</p>
            </div>
          )}

          {/* Active Estimation - Show poker table and voting */}
          {(estimationState.isActive || estimationState.showResults) && (
            <div className="space-y-6">
              {/* Poker Table - Shows all participants and their voting status */}
              <VotingStatus 
                participants={participants}
                estimations={estimationState.estimations}
                isActive={estimationState.isActive}
                showResults={estimationState.showResults}
              />

              {/* Voting Interface - Show when round is active */}
              {estimationState.isActive && !estimationState.showResults && (
                <>
                  <div className="w-full">
                    <SimpleEstimationCard
                      onSubmitEstimation={handleEstimationSubmit}
                      currentEstimation={estimationState.userHasSubmitted ? 
                        estimationState.estimations.find(e => 
                          e.user_id === (authSession?.user?.user_metadata?.internal_user_id || authSession?.user?.id)
                        )?.estimation_value : undefined}
                      hasActiveTurn={estimationState.isActive}
                      isRevealed={estimationState.showResults}
                    />
                  </div>
                  
                  {/* Reveal Button - Separate row */}
                  {estimationState.estimations.length > 0 && (
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleEndEstimationTurn}
                        disabled={isEndingTurn}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 h-12 px-8"
                      >
                        {isEndingTurn ? 'Revealing...' : 'Reveal Results'}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Results - Show when round is complete */}
              {estimationState.showResults && (
                <div className="max-w-2xl mx-auto">
                  <EstimationResults
                    estimations={estimationState.estimations}
                    onStartNewTurn={handleStartNewTurn}
                    isStartingNewTurn={isStartingNewTurn}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <ServerStatus />
    </div>
  )
}