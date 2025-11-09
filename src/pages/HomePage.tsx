import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { InlineEdit } from "@/components/ui/inline-edit"
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
  const { user, session, isLoading } = useAuth()

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth/signin')
    }
  }, [isLoading, user, navigate])

  // Fetch existing sessions on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoadingSessions(true)
        const sessions = await api.getAllGroomingSessions(session?.access_token)
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
  }, [session?.access_token])

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

  const handleRenameSession = async (sessionId: string, newName: string) => {
    try {
      await api.renameGroomingSession(sessionId, newName, session?.access_token)
      
      // Update local state
      setExistingSessions(prev => 
        prev.map(s => s.id === sessionId ? { ...s, name: newName } : s)
      )
      
      toast.success("Session renamed", {
        description: `Session name updated to "${newName}"`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Failed to rename session:', error)
      toast.error("Failed to rename session", {
        description: error instanceof APIError ? error.message : "Please try again.",
        duration: 4000,
      })
      throw error // Re-throw to let InlineEdit handle the error state
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionName.trim()) return

    setIsCreating(true)

    try {
      const sessionResponse = await api.createGroomingSession({ 
        name: sessionName.trim(),
        // Include user info if authenticated
        ...(user && { 
          created_by: user.id,
          user_metadata: {
            email: user.email,
            full_name: user.user_metadata?.full_name
          }
        })
      }, session?.access_token)
      
      if (sessionResponse) {
        // Refresh sessions list
        try {
          const sessions = await api.getAllGroomingSessions(session?.access_token)
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
        navigate(`/session/${sessionResponse.id}`)
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
      <header className="border-b-0 neu-elevated-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Sprintopia
              </h1>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-bold">Planning Poker Sessions</h2>
            <p className="text-muted-foreground text-lg">
              Join an existing session or create a new one for your team
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center">
            <div className="bg-background neu-pressed-sm p-2 rounded-2xl">
              <button
                onClick={() => setActiveTab('join')}
                className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'join'
                    ? 'bg-background neu-elevated text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Join Session
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'create'
                    ? 'bg-background neu-elevated text-foreground'
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
                    <div className="text-center py-16 neu-pressed rounded-3xl">
                      <div className="mb-6">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full neu-elevated flex items-center justify-center">
                          <span className="text-5xl">🎯</span>
                        </div>
                        <h3 className="text-2xl font-semibold mb-3">No active sessions</h3>
                        <p className="text-muted-foreground mb-6 text-lg">
                          Be the first to create a planning poker session for your team!
                        </p>
                        <Button 
                          onClick={() => setActiveTab('create')}
                          variant="outline"
                          size="lg"
                        >
                          Create First Session
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {existingSessions.map((sessionItem) => (
                        <div
                          key={sessionItem.id}
                          className="neu-elevated rounded-3xl p-6 hover:neu-elevated-lg transition-all duration-300 group bg-background"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <InlineEdit
                              value={sessionItem.name}
                              onSave={(newName) => handleRenameSession(sessionItem.id, newName)}
                              displayClassName="font-semibold text-lg truncate pr-2"
                              className="flex-1 min-w-0"
                              showEditIcon={true}
                            />
                            <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0 mt-2 neu-elevated-sm"></div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-6">
                            Created {formatDate(sessionItem.created_at)}
                          </p>
                          <Button
                            variant="ghost"
                            className="w-full justify-between text-sm hover:bg-transparent"
                            onClick={() => handleJoinSession(sessionItem.id)}
                          >
                            <span>Click to join</span>
                            <span className="text-primary group-hover:translate-x-2 transition-transform">→</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Create Session Tab */
            <div className="max-w-md mx-auto space-y-6">
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
                    className="w-full px-6 py-4 bg-background rounded-2xl neu-pressed focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="e.g., Sprint 23 Planning"
                    disabled={isCreating}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-4" 
                  size="lg"
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