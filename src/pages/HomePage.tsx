import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, APIError } from "@/services/api"

export default function HomePage() {
  const [sessionName, setSessionName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionName.trim()) return

    setIsCreating(true)
    setError(null)

    try {
      const session = await api.createGroomingSession({ name: sessionName.trim() })
      
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-primary">Sprintopia</h1>
          <p className="text-muted-foreground mt-2">
            A joyful home for agile discussions and estimation
          </p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Create Grooming Session</h2>
            <p className="text-muted-foreground">
              Start a new planning poker session for your team
            </p>
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
              Planning poker sessions with real-time collaboration
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}