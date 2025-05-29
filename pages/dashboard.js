import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardNavbar from '../components/DashboardNavbar';
import Footer from '../components/Footer';

const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetData, setSheetData] = useState({
    properties: [],
    inquiries: [],
    clients: []
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      router.push('/');
    } else {
      setUser({ email: userEmail });
      setLoading(false);
      fetchSheetData();
    }
  }, [router]);

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
    } finally {
      setDataLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('userEmail');
    // Clear the session cookie
    document.cookie = 'userSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
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
            {/* Dashboard Cards with Google Sheets Data */}
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
            
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
              <h3 className="text-xl font-semibold text-white mb-2">Revenue</h3>
              <p className="text-gray-400 mb-4">Monthly revenue</p>
              <div className="text-3xl font-bold text-purple-400">₹2.4M</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
              <h3 className="text-xl font-semibold text-white mb-2">Tasks</h3>
              <p className="text-gray-400 mb-4">Pending tasks</p>
              <div className="text-3xl font-bold text-red-400">8</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
              <h3 className="text-xl font-semibold text-white mb-2">Reports</h3>
              <p className="text-gray-400 mb-4">Generate reports</p>
              <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
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
