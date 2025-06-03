import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createSupabaseClient = (userEmail: string) => {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        'x-app-user-email': userEmail, // Pass user email in headers
      },
    },
  });
};
