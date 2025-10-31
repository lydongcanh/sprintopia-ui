import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const { user, isAnonymous, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
  }

  if (isAnonymous) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Anonymous User</span>
        <Link to="/auth/signin">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/auth/signin">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
      >
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
          {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="text-sm font-medium">
          {user.user_metadata?.full_name || user.email}
        </span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-10">
          <div className="p-2">
            <div className="px-2 py-1 text-xs text-muted-foreground border-b border-border mb-2">
              {user.email}
            </div>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}