import { createClient } from '@supabase/supabase-js';

// These should be properly set in your environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Add validation to prevent runtime errors
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Check your .env file.");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');