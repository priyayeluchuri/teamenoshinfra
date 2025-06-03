import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createSupabaseClient = (userEmail?: string) => {
  console.log('Creating Supabase with email:', userEmail);

  // For testing - try without custom headers first
  return createClient(supabaseUrl, supabaseKey);

  // Original code commented out for testing:
  // return createClient(supabaseUrl, supabaseKey, {
  //   global: {
  //     headers: {
  //       'x-app-user-email': userEmail,
  //     },
  //   },
  // });
};
