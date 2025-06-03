import { createSupabaseClient } from '../lib/supabase';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import '../styles/globals.css';
import Modal from 'react-modal';
import { useEffect, useState } from 'react';

Modal.setAppElement('#__next');

function MyApp({ Component, pageProps }) {
  const [supabase, setSupabase] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          const email = data.email;
          setUserEmail(email);
          setSupabase(createSupabaseClient(email));
        } else {
          // Not authenticated, create client without email
          setSupabase(createSupabaseClient(''));
        }
      } catch (error) {
        console.error('Failed to fetch user email:', error);
        // Fallback to client without email
        setSupabase(createSupabaseClient(''));
      } finally {
        setLoading(false);
      }
    };

    fetchUserEmail();
  }, []);

  if (loading || !supabase) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <Component {...pageProps} userEmail={userEmail} />
    </SessionContextProvider>
  );
}

export default MyApp;
