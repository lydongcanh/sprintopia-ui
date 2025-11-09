import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
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
        className="flex items-center gap-3 p-3 rounded-2xl hover:opacity-80 transition-opacity neu-elevated"
      >
        {user.user_metadata?.avatar_url ? (
          <img 
            src={user.user_metadata.avatar_url} 
            alt={user.user_metadata?.full_name || user.email || 'User'} 
            className="w-10 h-10 rounded-full object-cover neu-elevated-sm"
          />
        ) : (
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold neu-elevated-sm">
            {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <span className="text-sm font-semibold">
          {user.user_metadata?.full_name || user.email}
        </span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background rounded-2xl neu-elevated z-10 overflow-hidden">
          <div className="p-3">
            <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border/50 mb-2">
              {user.email}
            </div>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 text-sm font-medium rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}