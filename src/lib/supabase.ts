import { createClient } from "@supabase/supabase-js"
import { env } from "./env"

if (!env.isSupabaseConfigured && env.isDevelopment) {
  console.warn("Supabase not configured. Real-time features will not work. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.")
}

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export default supabase