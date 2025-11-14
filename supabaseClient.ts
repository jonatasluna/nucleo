import { createClient, SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your project's URL and Anon Key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// This variable will hold the Supabase client instance
let supabase: SupabaseClient | null = null;

// Only initialize the client if the URL and Key are not placeholders
if (supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseUrl && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    // Log a prominent warning for the developer in the console
    console.warn(`****************************************************************\nATENÇÃO: Credenciais do Supabase não configuradas.\nEdite o arquivo 'supabaseClient.ts' com os dados do seu projeto.\n****************************************************************`);
}

// Export the client (which may be null if not configured)
export { supabase };
