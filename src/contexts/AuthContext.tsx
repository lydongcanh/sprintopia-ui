import { createContext, useEffect, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { api } from '@/services/api'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, userData?: { full_name?: string }) => Promise<{ user: User | null; error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, userData?: { full_name?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (error) throw error
      
      // If user was created successfully, create user in backend and update metadata
      if (data.user) {
        try {
          // Get the session to access the access token
          const { data: { session } } = await supabase.auth.getSession()
          const accessToken = session?.access_token
          
          // Create user in backend
          const backendUser = await api.createUser({
            email: data.user.email!,
            full_name: userData?.full_name || '',
            external_auth_id: data.user.id
          }, accessToken)
          
          // Update Supabase user metadata with internal user ID
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              ...userData,
              internal_user_id: backendUser.id
            }
          })
          
          if (updateError) {
            console.error('Error updating user metadata:', updateError)
            // Don't throw here as the user creation was successful
          }
        } catch (backendError) {
          console.error('Error creating user in backend:', backendError)
          // Don't throw here as the Supabase user creation was successful
          // The user can still use the app, just without backend integration
        }
      }
      
      return { user: data.user, error: null }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      return { user: data.user, error: null }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const value = useMemo(() => ({
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut
  }), [user, session, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}