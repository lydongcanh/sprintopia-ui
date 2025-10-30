export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  
  get isSupabaseConfigured() {
    return this.supabaseUrl && 
           this.supabaseUrl !== "your-supabase-url" && 
           this.supabaseAnonKey && 
           this.supabaseAnonKey !== "your-supabase-anon-key"
  },
  
  get isDevelopment() {
    return import.meta.env.DEV
  }
}

export default env