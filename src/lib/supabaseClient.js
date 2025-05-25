// lib/supabaseClient.ts (or .js, but .ts is preferred in TypeScript projects)
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Renamed from supabaseKey for clarity

// Runtime check for environment variables
if (!supabaseUrl) {
  throw new Error("SupabaseClient: NEXT_PUBLIC_SUPABASE_URL is not defined. Check your .env file.");
}
if (!supabaseAnonKey) {
  throw new Error("SupabaseClient: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Check your .env file.");
}

// Create a single supabase client for interacting with your database on the browser
// This client is specifically designed to work with the @supabase/ssr cookie-based session management.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);