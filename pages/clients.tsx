import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardNavbar from '../components/DashboardNavbar';
import Footer from '../components/Footer';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  uniqueKey: string;
  company?: string;
  city?: string;
}

const ClientsPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          console.log('Not authenticated, redirecting to /');
          if (router.pathname !== '/') {
            router.push('/');
          }
        } else {
          const data = await res.json();
          setUser({ email: data.email });
          setLoading(false);
          fetchClients(); // Call this only when logged in
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

  const removeDuplicateClients = (clients: Client[]): Client[] => {
    const seen = new Map<string, Client>();
    
    clients.forEach(client => {
      // Create a key based on name and phone combination
      // Normalize the name and phone for comparison
      const normalizedName = client.name.toLowerCase().trim();
      const normalizedPhone = client.phone.replace(/\D/g, ''); // Remove non-digits
      const key = `${normalizedName}|${normalizedPhone}`;
      
      if (!seen.has(key)) {
        seen.set(key, client);
      } else {
        // If duplicate found, keep the one with more complete information
        const existing = seen.get(key)!;
        const currentScore = getClientCompleteness(client);
        const existingScore = getClientCompleteness(existing);
        
        if (currentScore > existingScore) {
          seen.set(key, client);
        }
      }
    });
    
    return Array.from(seen.values());
  };

  const getClientCompleteness = (client: Client): number => {
    let score = 0;
    if (client.email && client.email.includes('@')) score += 1;
    if (client.phone && client.phone.length >= 6) score += 1;
    if (client.company && client.company !== 'Not provided') score += 1;
    if (client.city) score += 1;
    if (client.name && client.name !== 'Unknown') score += 1;
    return score;
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/sheets-data');
      const result = await response.json();

      if (result.success) {
        // Map incoming data to Client format
        const mappedClients: Client[] = result.data.properties.map((p: any, index: number) => ({
          id: p.id,
          name: p.Client || p.clientName || 'Unknown',
          email: p.Email && p.Email.includes('@') ? p.Email : '',
          phone: p.Phone && p.Phone.length >= 6 ? p.Phone : '',
          company: p.Company && p.Company !== 'Not provided' ? p.Company : '',
          city: p['Client City'] || '',
          uniqueKey: `client-${index}-${p.id}`,
        }));

        // Remove duplicates based on name and phone combination
        const uniqueClients = removeDuplicateClients(mappedClients);
        setClients(uniqueClients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('userEmail');
    document.cookie = 'userSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  const handleContact = (client: Client) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && client.phone) {
      window.location.href = `tel:${client.phone}`;
    } else if (client.email) {
      window.location.href = `mailto:${client.email}`;
    } else {
      alert('No contact method available.');
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <DashboardNavbar user={user} onSignOut={handleSignOut} />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Clients</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search clients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="text-white text-center">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">
                {searchTerm ? 'No clients found matching your search.' : 'No clients found.'}
              </p>
            </div>
          ) : (
            <>
              {/* Client Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredClients.map((client) => (
                  <div key={client.uniqueKey} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {client.name ? client.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-white">
                          {client.name || 'Unknown Client'}
                        </h3>
                        <p className="text-sm text-gray-400">ID: {client.id}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-300">
                      {client.email && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {(client.company || client.city) && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657A8 8 0 118.343 7.343 8 8 0 0117.657 16.657z" />
                          </svg>
                          <span>
                            {client.company ? `${client.company}, ` : ''}
                            {client.city}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleContact(client)}
                      className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Contact
                    </button>
                  </div>
                ))}
              </div>

              {/* Client Table */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <h2 className="text-xl font-semibold text-white p-6 border-b border-gray-700">
                  All Clients ({filteredClients.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">City</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredClients.map((client) => (
                        <tr key={client.uniqueKey} className="hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 text-sm">{client.id}</td>
                          <td className="px-6 py-4">{client.name || 'Unknown'}</td>
                          <td className="px-6 py-4">
                            {client.email ? (
                              <a href={`mailto:${client.email}`} className="text-blue-400 hover:text-blue-300">{client.email}</a>
                            ) : <span className="text-gray-500">-</span>}
                          </td>
                          <td className="px-6 py-4">
                            {client.phone ? (
                              <a href={`tel:${client.phone}`} className="text-blue-400 hover:text-blue-300">{client.phone}</a>
                            ) : <span className="text-gray-500">-</span>}
                          </td>
                          <td className="px-6 py-4">{client.city || '-'}</td>
                          <td className="px-6 py-4">{client.company || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleContact(client)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Contact
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ClientsPage;
