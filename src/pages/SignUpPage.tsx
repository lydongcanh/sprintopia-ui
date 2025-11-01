import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthForm } from '@/components/auth/AuthForm'
import { useAuth } from '@/hooks/useAuth'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  // Redirect authenticated users to home
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/', { replace: true })
    }
  }, [isLoading, user, navigate])

  const handleSuccess = () => {
    navigate('/', { replace: true })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-background/80 backdrop-blur-sm border-2 border-border rounded-2xl shadow-2xl p-8">
          <AuthForm mode="signup" onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  )
}