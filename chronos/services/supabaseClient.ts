import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dqorzhjmfzkxcltradgk.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('SUPABASE_ANON_KEY is not set. Please add it to your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
