import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface AuthFormProps {
  readonly mode: 'signin' | 'signup'
  readonly onSuccess?: () => void
}

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  
  const { signIn, signUp, signInWithGitHub } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, { full_name: fullName })
        if (error) throw error
        
        // Show success toast and navigate to dashboard
        toast.success("Account created successfully! 📧", {
          description: `We've sent a confirmation link to ${email}. Please check your email and click the link to verify your account.`,
          duration: 8000,
        })
        
        // Call onSuccess to navigate back to dashboard
        onSuccess?.()
      } else {
        const { user, error } = await signIn(email, password)
        if (error) throw error
        
        if (user) {
          onSuccess?.()
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      
      // Show error as toast only
      toast.error("Authentication failed", {
        description: errorMessage,
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true)
    try {
      const { error } = await signInWithGitHub()
      if (error) throw error
      // OAuth redirect will happen automatically, no need to call onSuccess
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      toast.error("GitHub authentication failed", {
        description: errorMessage,
        duration: 6000,
      })
      setIsGitHubLoading(false)
    }
  }

  const getButtonText = () => {
    if (isLoading) return 'Please wait...'
    return mode === 'signup' ? 'Create Account' : 'Sign In'
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center mb-4">
          <img 
            src="/icon.png" 
            alt="Sprintopia" 
            className="w-20 h-20 object-contain"
          />
        </div>
        <p className="text-xl font-semibold text-foreground">
          {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
        </p>
        <p className="text-muted-foreground">
          {mode === 'signup' 
            ? 'Join Sprintopia to start estimating with your team' 
            : 'Sign in to continue your agile estimation sessions'
          }
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-base font-semibold"
        onClick={handleGitHubSignIn}
        disabled={isGitHubLoading || isLoading}
      >
        {isGitHubLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-2"></div>
            Connecting to GitHub...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Continue with GitHub
          </>
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'signup' && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold mb-2 text-foreground">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
              required
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-semibold mb-2 text-foreground">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-semibold mb-2 text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
            required
            minLength={6}
          />
          {mode === 'signup' && (
            <p className="text-xs text-muted-foreground mt-1.5">
              Must be at least 6 characters
            </p>
          )}
        </div>

        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading || isGitHubLoading}>
          {getButtonText()}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {mode === 'signup' ? 'Already a member?' : 'New to Sprintopia?'}
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {mode === 'signup' ? (
            <>
              Sign in to your existing account{' '}
              <Link to="/auth/signin" className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors">
                here
              </Link>
            </>
          ) : (
            <>
              Create a new account to get started{' '}
              <Link to="/auth/signup" className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors">
                here
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}