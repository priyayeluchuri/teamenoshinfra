import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardNavbar from '../components/DashboardNavbar';
import Footer from '../components/Footer';
import { createSupabaseClient } from '../lib/supabase';

const Dashboard = () => {
  console.log('Dashboard component rendering');
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetData, setSheetData] = useState({
    properties: [],
    inquiries: [],
    clients: []
  });
  const [deals, setDeals] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchSheetData = async () => {
    try {
      const response = await fetch('/api/sheets-data');
      const result = await response.json();

      if (result.success) {
        setSheetData(result.data);
      } else {
        console.error('Failed to fetch sheet data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching sheet data:', error);
    }
  };

  const fetchDeals = async (supabaseClient, userEmail) => {
    try {
      const { error: contextError } = await supabaseClient.rpc('set_user_context', {
        p_email: userEmail,
      });
      if (contextError) {
        throw new Error(`Context error: ${contextError.message}`);
      }

      const { data, error } = await supabaseClient
        .from('deals')
        .select('*')
        .eq('status', 'Active');

      if (error) {
        throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
      }

      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const fetchRevenue = async (supabaseClient, userEmail) => {
    try {
      const { error: contextError } = await supabaseClient.rpc('set_user_context', {
        p_email: userEmail,
      });
      if (contextError) {
        throw new Error(`Context error: ${contextError.message}`);
      }

      const { data, error } = await supabaseClient
        .from('deals')
        .select('total_revenue')
        .eq('status', 'Closed')
        .gte('closed_date', '2024-04-01')
        .lte('closed_date', '2025-03-31');

      if (error) {
        throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
      }

      const totalRevenue = data.reduce((sum, deal) => sum + (deal.total_revenue || 0), 0);
      setRevenue(totalRevenue);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      setRevenue(0);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log('lets check auth');
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        console.log('auth check complete');
        if (!res.ok) {
          console.log('Not authenticated, redirecting to /');
          if (router.pathname !== '/') {
            router.push('/');
          }
        } else {
          const data = await res.json();
          const userEmail = data.email;
          setUser({ email: userEmail });

          const supabaseClient = createSupabaseClient(userEmail);
          await Promise.all([
            fetchSheetData(),
            fetchDeals(supabaseClient, userEmail),
            fetchRevenue(supabaseClient, userEmail)
          ]);
          setLoading(false);
          setDataLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (router.pathname !== '/') {
          router.push('/');
        }
      }
    }

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout');
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <DashboardNavbar user={user} onSignOut={handleSignOut} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">
            Welcome to Team Dashboard
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => router.push('/deals')}
            >
              <h3 className="text-xl font-semibold text-white mb-2">Deals</h3>
              <p className="text-gray-400 mb-4">Active Deals</p>
              <div className="text-3xl font-bold text-red-400">
                {dataLoading ? '...' : deals.length}
              </div>
              <p className="text-sm text-yellow-400 mt-2">Click to view →</p>
            </div>
            <div
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-xl font-semibold text-white mb-2">Revenue</h3>
              <p className="text-gray-400 mb-4">Current financial year revenue</p>
              <div className="text-3xl font-bold text-purple-400">
                {dataLoading ? '...' : `₹${revenue.toLocaleString()}`}
              </div>
            </div>
            <div
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => router.push('/clients')}
            >
              <h3 className="text-xl font-semibold text-white mb-2">Clients</h3>
              <p className="text-gray-400 mb-4">Total unique clients</p>
              <div className="text-3xl font-bold text-yellow-400">
                {dataLoading ? '...' : sheetData.clients.length}
              </div>
              <p className="text-sm text-yellow-400 mt-2">Click to view →</p>
            </div>
            <div
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => router.push('/properties')}
            >
              <h3 className="text-xl font-semibold text-white mb-2">Properties</h3>
              <p className="text-gray-400 mb-4">Properties looking for tenants</p>
              <div className="text-3xl font-bold text-blue-400">
                {dataLoading ? '...' : sheetData.properties.length}
              </div>
              <p className="text-sm text-blue-400 mt-2">Click to view →</p>
            </div>
            <div
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => router.push('/inquiries')}
            >
              <h3 className="text-xl font-semibold text-white mb-2">Inquiries</h3>
              <p className="text-gray-400 mb-4">Clients looking for space</p>
              <div className="text-3xl font-bold text-green-400">
                {dataLoading ? '...' : sheetData.inquiries.length}
              </div>
              <p className="text-sm text-green-400 mt-2">Click to view →</p>
            </div>
            <div
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-xl font-semibold text-white mb-2">Reports</h3>
              <p className="text-gray-400 mb-4">Generate reports</p>
              <button className="mt-2 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                View Reports
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
