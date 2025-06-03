import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Footer from '../components/Footer';

const LoginPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.status === 200) {
          console.log('User authenticated, redirecting to /dashboard...');
          if (router.pathname !== '/dashboard') {
            router.replace('/dashboard');
          }
	} else {
            setLoading(false);  // <-- allow sign-in button to show
          }
      } catch (error) {
        console.error('Error checking auth:', error);
        setLoading(false); 
      }
    }

    checkAuth();
  }, [router]);

  const handleZohoLogin = () => {
    window.location.href = '/api/auth/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <Image
                src="/fullfav.png"
                alt="Enosh Infra Logo"
                width={200}
                height={100}
                priority
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Team Portal Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Sign in with your Zoho account
            </p>
          </div>

          <div>
            <button
              onClick={handleZohoLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Zoho
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Need access? Contact{' '}
              <a
                href="mailto:admin@enoshinfra.com"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                admin@enoshinfra.com
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;

