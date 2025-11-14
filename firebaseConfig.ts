import { createClient } from '@supabase/supabase-js';
import { User } from './types';

// IMPORTANT: Replace with your project's URL and Anon Key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn(`Supabase credentials are not set. Please update supabaseClient.ts with your project's URL and Anon key from your Supabase dashboard.`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
