import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardNavbar from '../components/DashboardNavbar';
import Footer from '../components/Footer';
import { createSupabaseClient } from '../lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  uniqueKey: string;
  company?: string;
  city?: string;
}

interface User {
  email: string;
}

interface SheetData {
  properties: any[];
  inquiries: any[];
  clients: Client[];
}

const Dashboard = () => {
  console.log('Dashboard component rendering');
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sheetData, setSheetData] = useState<SheetData>({
    properties: [],
    inquiries: [],
    clients: []
  });
  const [uniqueClientsCount, setUniqueClientsCount] = useState<number>(0);
  const [activeDealsCount, setActiveDealsCount] = useState<number>(0);
  const [revenueActive, setRevenueActive] = useState<number>(0);
  const [revenueClosed, setRevenueClosed] = useState<number>(0);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  const getFinancialYearRange = () => {
    const today = new Date();
    const year = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
    return {
      startDate: `${year}-04-01`,
      endDate: `${year + 1}-03-31`
    };
  };

  const removeDuplicateClients = (clients: Client[]): Client[] => {
    const seen = new Map<string, Client>();
    
    clients.forEach(client => {
      const key = client.email?.toLowerCase().trim() || 
                  `${client.name?.toLowerCase().trim() || 'unknown'}|${client.phone?.replace(/\D/g, '') || 'nophone'}`;
      
      if (!seen.has(key)) {
        seen.set(key, client);
      } else {
        const existing = seen.get(key)!;
        const currentScore = getClientCompleteness(client);
        const existingScore = getClientCompleteness(existing);
        
        if (currentScore >= existingScore) {
          seen.set(key, client);
        }
      }
    });
    
    const uniqueClients = Array.from(seen.values());
    console.log('Dashboard: Unique clients after deduplication:', uniqueClients.length, uniqueClients);
    return uniqueClients;
  };

  const getClientCompleteness = (client: Client): number => {
    let score = 0;
    if (client.email) score += 1;
    if (client.phone) score += 1;
    if (client.company && client.company !== 'Not provided') score += 1;
    if (client.city) score += 1;
    if (client.name && client.name !== 'Unknown') score += 1;
    return score;
  };

  const fetchSheetData = async (): Promise<void> => {
    try {
      const response = await fetch('/api/sheets-data');
      const result = await response.json();

      if (result.success) {
        console.log('Dashboard: Raw API response:', result.data);
        
        const clientSource = result.data.clients?.length ? result.data.clients : result.data.properties || [];
        console.log('Dashboard: Using data source:', result.data.clients?.length ? 'clients' : 'properties', clientSource.length);
        if (clientSource.length > 0) {
          console.log('Dashboard: Raw client keys:', Object.keys(clientSource[0]));
          console.log('Dashboard: Sheets raw row sample:', clientSource[0]);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[\d\s-]{6,}$/;

        const mappedClients: Client[] = clientSource.map((c: any, index: number) => {
          const rawEmail = c.Email || c.email || '';
          const rawPhone = c.Phone || c.phone || '';
          const rawCity = c['Client City'] || c.city || ''; // Fixed key without leading space

          let email = emailRegex.test(rawEmail) ? rawEmail : '';
          let phone = phoneRegex.test(rawPhone) ? rawPhone : phoneRegex.test(rawEmail) ? rawEmail : '';
          let city = rawCity || '';

          const client = {
            id: c.id || index + 1,
            name: c.Client || c.clientName || c.name || 'Unknown',
            email,
            phone,
            company: c.Company || c.company || '',
            city,
            uniqueKey: `client-${index}-${c.id || index}`,
          };
          console.log(`Dashboard: Mapped client ${index + 1}:`, client);
          return client;
        });

        const uniqueClients = removeDuplicateClients(mappedClients);
        
        setSheetData({
          ...result.data,
          clients: uniqueClients
        });
        
        setUniqueClientsCount(uniqueClients.length);
        console.log('Dashboard: Set unique clients count:', uniqueClients.length);
      } else {
        console.error('Dashboard: API response unsuccessful:', result.error);
      }
    } catch (error) {
      console.error('Error fetching sheet data:', error);
    }
  };

  const fetchDeals = async (supabaseClient: SupabaseClient, userEmail: string): Promise<void> => {
    try {
      const { count, error } = await supabaseClient
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active')
        .eq('created_by', userEmail);

      if (error) {
        throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
      }

      setActiveDealsCount(count || 0);
    } catch (error) {
      console.error('Error fetching deals count:', error);
      setActiveDealsCount(0);
    }
  };

  const fetchRevenue = async (supabaseClient: SupabaseClient, userEmail: string): Promise<void> => {
    try {
      const { startDate, endDate } = getFinancialYearRange();

      const { data: closedDeals, error: closedError } = await supabaseClient
        .from('deals')
        .select('total_revenue')
        .eq('status', 'Closed')
        .gte('closed_date', startDate)
        .lte('closed_date', endDate)
        .eq('created_by', userEmail);

      if (closedError) {
        throw new Error(`Supabase error: ${closedError.message} (Code: ${closedError.code})`);
      }

      const closedRevenue = closedDeals.reduce((sum, deal) => sum + (deal.total_revenue || 0), 0);

      const { data: activeDeals, error: activeError } = await supabaseClient
        .from('deals')
        .select('total_revenue')
        .eq('status', 'Active')
        .eq('created_by', userEmail);

      if (activeError) {
        throw new Error(`Supabase error: ${activeError.message} (Code: ${activeError.code})`);
      }

      const activeRevenue = activeDeals.reduce((sum, deal) => sum + (deal.total_revenue || 0), 0);

      setRevenueActive(activeRevenue);
      setRevenueClosed(closedRevenue);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      setRevenueActive(0);
      setRevenueClosed(0);
    }
  };

  useEffect(() => {
    async function checkAuth(): Promise<void> {
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

  const handleSignOut = async (): Promise<void> => {
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
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 hover:from-gray-700 hover:to-gray-800 transition-colors cursor-pointer shadow-lg"
              onClick={() => router.push('/deals')}
            >
              <div className="flex items-center mb-2">
                <svg className="w-6 h-6 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-xl font-semibold text-white">Active Deals</h3>
              </div>
              <p className="text-gray-400 mb-4">Number of active deals</p>
              <div className="text-3xl font-bold text-red-400">
                {dataLoading ? '...' : activeDealsCount}
              </div>
              <p className="text-sm text-yellow-400 mt-2">Click to view →</p>
            </div>
            <div
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 hover:from-gray-700 hover:to-gray-800 transition-colors shadow-lg"
            >
              <div className="flex items-center mb-2">
                <svg className="w-6 h-6 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-white">Revenue</h3>
              </div>
              <p className="text-gray-400 mb-4">Revenue from deals (FY {getFinancialYearRange().startDate.split('-')[0]}-{getFinancialYearRange().endDate.split('-')[0]})</p>
              <div className="text-lg font-semibold text-white">
                <div className="flex justify-between mb-2">
                  <span>Active:</span>
                  <span className="text-blue-400">{dataLoading ? '...' : `₹${revenueActive.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closed:</span>
                  <span className="text-purple-400">{dataLoading ? '...' : `₹${revenueClosed.toLocaleString()}`}</span>
                </div>
              </div>
            </div>
            <div
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 hover:from-gray-700 hover:to-gray-800 transition-colors cursor-pointer shadow-lg"
              onClick={() => router.push('/clients')}
            >
              <div className="flex items-center mb-2">
                <svg className="w-6 h-6 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-white">Clients</h3>
              </div>
              <p className="text-gray-400 mb-4">Total unique clients</p>
              <div className="text-3xl font-bold text-yellow-400">
                {dataLoading ? '...' : uniqueClientsCount}
              </div>
              <p className="text-sm text-yellow-400 mt-2">Click to view →</p>
            </div>
            <div
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 hover:from-gray-700 hover:to-gray-800 transition-colors cursor-pointer shadow-lg"
              onClick={() => router.push('/properties')}
            >
              <div className="flex items-center mb-2">
                <svg className="w-6 h-6 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-xl font-semibold text-white">Properties</h3>
              </div>
              <p className="text-gray-400 mb-4">Properties looking for tenants</p>
              <div className="text-3xl font-bold text-blue-400">
                {dataLoading ? '...' : sheetData.properties.length}
              </div>
              <p className="text-sm text-blue-400 mt-2">Click to view →</p>
            </div>
            <div
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 hover:from-gray-700 hover:to-gray-800 transition-colors cursor-pointer shadow-lg"
              onClick={() => router.push('/inquiries')}
            >
              <div className="flex items-center mb-2">
                <svg className="w-6 h-6 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h3 className="text-xl font-semibold text-white">Inquiries</h3>
              </div>
              <p className="text-gray-400 mb-4">Clients looking for space</p>
              <div className="text-3xl font-bold text-green-400">
                {dataLoading ? '...' : sheetData.inquiries.length}
              </div>
              <p className="text-sm text-green-400 mt-2">Click to view →</p>
            </div>
            <div
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 hover:from-gray-700 hover:to-gray-800 transition-colors shadow-lg"
            >
              <div className="flex items-center mb-2">
                <svg className="w-6 h-6 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m0-2v-2m0-2V7m6 10v-2m0-2v-2m0-2V7M3 21v-2m0-2v-2m0-2v-2m0-2V7m18 14v-2m0-2v-2m0-2v-2m0-2V7" />
                </svg>
                <h3 className="text-xl font-semibold text-white">Reports</h3>
              </div>
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
