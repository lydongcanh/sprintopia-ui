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
  
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, { full_name: fullName })
        if (error) throw error
        
        // Show success toast and navigate to dashboard
        toast.success("Account created successfully! 📧", {
          description: `We've sent a confirmation link to ${email}. Please check your email and click the link to verify your account before signing in.`,
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

        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
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