export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  
  // New Relic configuration
  newRelicAccountId: import.meta.env.VITE_NEWRELIC_ACCOUNT_ID || "",
  newRelicApplicationId: import.meta.env.VITE_NEWRELIC_APPLICATION_ID || "",
  newRelicLicenseKey: import.meta.env.VITE_NEWRELIC_LICENSE_KEY || "",
  newRelicAgentId: import.meta.env.VITE_NEWRELIC_AGENT_ID || "",
  newRelicTrustKey: import.meta.env.VITE_NEWRELIC_TRUST_KEY || "",
  
  get isSupabaseConfigured() {
    return this.supabaseUrl && 
           this.supabaseUrl !== "your-supabase-url" && 
           this.supabaseAnonKey && 
           this.supabaseAnonKey !== "your-supabase-anon-key"
  },
  
  get isNewRelicConfigured() {
    return this.newRelicAccountId && 
           this.newRelicApplicationId && 
           this.newRelicLicenseKey
  },
  
  get isDevelopment() {
    return import.meta.env.DEV
  }
}

export default env