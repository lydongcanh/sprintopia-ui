import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from '@/hooks/useAuth'
import { UserMenu } from '@/components/auth/UserMenu'
import { ServerStatus } from '@/components/ServerStatus'
import { api, APIError } from "@/services/api"
import { toast } from 'sonner'
import type { GroomingSession } from "@/types/api"

export default function HomePage() {
  const [sessionName, setSessionName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [existingSessions, setExistingSessions] = useState<GroomingSession[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join')
  const navigate = useNavigate()
  const { user, isAnonymous, isLoading } = useAuth()

  // Fetch existing sessions on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoadingSessions(true)
        const sessions = await api.getAllGroomingSessions()
        setExistingSessions(sessions)
        
        // If no sessions exist, default to create tab
        if (sessions.length === 0) {
          setActiveTab('create')
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
        // If API fails, default to create tab
        setActiveTab('create')
      } finally {
        setIsLoadingSessions(false)
      }
    }

    fetchSessions()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleJoinSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`)
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionName.trim()) return

    setIsCreating(true)

    try {
      const session = await api.createGroomingSession({ 
        name: sessionName.trim(),
        // Include user info if authenticated
        ...(user && { 
          created_by: user.id,
          user_metadata: {
            email: user.email,
            full_name: user.user_metadata?.full_name
          }
        })
      })
      
      if (session) {
        // Refresh sessions list
        try {
          const sessions = await api.getAllGroomingSessions()
          setExistingSessions(sessions)
        } catch (error) {
          console.error('Failed to refresh sessions:', error)
        }
        
        // Show success toast
        toast.success("Session created! 🎉", {
          description: `"${sessionName.trim()}" is ready for your team.`,
          duration: 4000,
        })
        
        // Navigate to the session page
        navigate(`/session/${session.id}`)
      } else {
        toast.error("Failed to create session", {
          description: "Please try again or contact support if the issue persists.",
          duration: 6000,
        })
      }
    } catch (err) {
      if (err instanceof APIError) {
        if (err.validationErrors?.detail) {
          const validationMessages = err.validationErrors.detail
            .map(detail => detail.msg)
            .join(", ")
          toast.error("Validation Error", {
            description: validationMessages,
            duration: 6000,
          })
        } else {
          toast.error("API Error", {
            description: err.message,
            duration: 6000,
          })
        }
      } else {
        toast.error("Unexpected Error", {
          description: "An unexpected error occurred. Please try again.",
          duration: 6000,
        })
      }
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
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
              <h1 className="text-3xl font-bold text-primary">Sprintopia</h1>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Planning Poker Sessions</h2>
            <p className="text-muted-foreground">
              Join an existing session or create a new one for your team
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center">
            <div className="bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('join')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'join'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Join Session
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create New
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'join' ? (
            /* Join Session Tab */
            <div className="space-y-6">
              {isLoadingSessions ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading sessions...</p>
                </div>
              ) : (
                <>
                  {existingSessions.length === 0 ? (
                    <div className="text-center py-12 bg-muted/50 rounded-lg">
                      <div className="mb-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-2xl">🎯</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No active sessions</h3>
                        <p className="text-muted-foreground mb-4">
                          Be the first to create a planning poker session for your team!
                        </p>
                        <Button 
                          onClick={() => setActiveTab('create')}
                          variant="outline"
                        >
                          Create First Session
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {existingSessions.map((session) => (
                        <button
                          key={session.id}
                          className="border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all duration-200 text-left group"
                          onClick={() => handleJoinSession(session.id)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-lg truncate pr-2">{session.name}</h3>
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Created {formatDate(session.created_at)}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Click to join</span>
                            <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Create Session Tab */
            <div className="max-w-md mx-auto space-y-6">
              {isAnonymous && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-500 mt-0.5">💡</span>
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Anonymous Mode
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Sessions created anonymously are temporary and won't be saved to your account.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateSession} className="space-y-6">
                <div>
                  <label htmlFor="sessionName" className="block text-sm font-medium mb-3">
                    Session Name
                  </label>
                  <input
                    id="sessionName"
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full px-4 py-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    disabled={isCreating}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-3" 
                  disabled={isCreating || !sessionName.trim()}
                >
                  {isCreating ? "Creating Session..." : "Create & Start Session"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
      
      {/* Server Status Indicator */}
      <ServerStatus />
    </div>
  )
}