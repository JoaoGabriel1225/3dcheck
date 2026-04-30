import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!rawSupabaseUrl || !rawSupabaseKey) {
  console.warn('Supabase credentials are missing. Please add them to your environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).');
}

const supabaseUrl = rawSupabaseUrl || 'https://placeholder.supabase.co';
const supabaseKey = rawSupabaseKey || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);
