import { useState, useEffect } from 'react';
import { AppProps } from 'next/app';
import Modal from 'react-modal';
import { createSupabaseClient } from '../lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import '../styles/globals.css'; // Adjust path if different

Modal.setAppElement('#__next');

function MyApp({ Component, pageProps }: AppProps) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initializeApp() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          console.log('Not authenticated, redirecting to /');
          setLoading(false);
          return;
        }

        const data = await res.json();
        const email = data.email;
        if (!email) {
          console.log('No email found in auth response');
          setLoading(false);
          return;
        }

        setUserEmail(email);
        const supabaseClient = createSupabaseClient(email);
        setSupabase(supabaseClient);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    }

    initializeApp();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return <Component {...pageProps} supabase={supabase} userEmail={userEmail} />;
}

export default MyApp;
