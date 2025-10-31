import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from '@/hooks/useAuth'
import { UserMenu } from '@/components/auth/UserMenu'
import { api, APIError } from "@/services/api"

export default function HomePage() {
  const [sessionName, setSessionName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { user, isAnonymous, isLoading } = useAuth()

  const getStatusMessage = () => {
    if (user) {
      return `Welcome back, ${user.user_metadata?.full_name || user.email}! Your sessions will be saved.`
    }
    if (isAnonymous) {
      return 'Sessions created anonymously are temporary.'
    }
    return 'Planning poker sessions with real-time collaboration'
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionName.trim()) return

    setIsCreating(true)
    setError(null)

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
        // Navigate to the session page
        navigate(`/session/${session.id}`)
      } else {
        setError("Failed to create session")
      }
    } catch (err) {
      if (err instanceof APIError) {
        if (err.validationErrors?.detail) {
          const validationMessages = err.validationErrors.detail
            .map(detail => detail.msg)
            .join(", ")
          setError(`Validation error: ${validationMessages}`)
        } else {
          setError(`API error: ${err.message}`)
        }
      } else {
        setError("An unexpected error occurred")
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
              <p className="text-muted-foreground mt-2">
                A joyful home for agile discussions and estimation
              </p>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Create Grooming Session</h2>
            <p className="text-muted-foreground">
              Start a new planning poker session for your team
            </p>
            
            {isAnonymous && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 You're using Sprintopia anonymously. Sessions won't be saved to your account.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label htmlFor="sessionName" className="block text-sm font-medium mb-2">
                Session Name
              </label>
              <input
                id="sessionName"
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Enter session name..."
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                disabled={isCreating}
                required
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isCreating || !sessionName.trim()}
            >
              {isCreating ? "Creating..." : "Create Session"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {getStatusMessage()}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}