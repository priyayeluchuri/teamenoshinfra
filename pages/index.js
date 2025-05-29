import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Footer from '../components/Footer';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleZohoLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // For now, we'll implement a basic email validation
      // In production, this would integrate with Zoho OAuth
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Check if email ends with allowed domain (you can customize this)
      const allowedDomains = ['enoshinfra.com', 'zoho.com'];
      const emailDomain = email.split('@')[1];
      
      if (!allowedDomains.some(domain => emailDomain.endsWith(domain))) {
        throw new Error('Please use your company email address');
      }

      // Store user session
      localStorage.setItem('userEmail', email);
      
      // Set cookie for middleware authentication
      document.cookie = `userSession=${email}; path=/; max-age=86400`; // 24 hours
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
                style={{ width: "auto", height: "auto" }}
              />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Team Portal Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Sign in with your Zoho email
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleZohoLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your Zoho email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-900 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-200">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in with Zoho'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Need access? Contact{' '}
                <a href="mailto:admin@enoshinfra.com" className="font-medium text-blue-400 hover:text-blue-300">
                  admin@enoshinfra.com
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;