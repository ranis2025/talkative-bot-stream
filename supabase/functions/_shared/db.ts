
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

// Create a Supabase client with the Auth context of the function
export const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  return createClient(supabaseUrl, supabaseAnonKey);
};
