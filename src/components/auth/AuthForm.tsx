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
          toast.success("Welcome back! 🎉", {
            description: "You have successfully signed in to your account.",
            duration: 4000,
          })
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
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">
          {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {mode === 'signup' 
            ? 'Get started with your planning poker sessions' 
            : 'Sign in to your account'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your password"
            required
            minLength={6}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {getButtonText()}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <Link to="/auth/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}