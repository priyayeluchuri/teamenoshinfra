import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardNavbar from '../components/DashboardNavbar';
import Footer from '../components/Footer';

interface Property {
  id: number;
  location: string;
  description: string;
  clientEmail: string;
  email: string;
  phone: string;
  clientCity: string;
  timeIST: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  uniqueKey: string;
}

const PropertiesPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalContent, setModalContent] = useState<string | null>(null);

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
          fetchProperties();
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

	  
  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/sheets-data');
      const result = await response.json();
      
      if (result.success) {
        const transformedProperties = result.data.properties.map((prop: any) => {
          // Get the raw location string
          let rawLocation = prop.details.col_D || '';
          
          // Add line breaks after each occurrence of "India"
          let location = rawLocation.replace(/(India),?\s*/g, '$1\n'); 
	  // Clean up any extra whitespace but preserve line breaks
          location = location.replace(/[ \t]+/g, ' ').trim() || 'N/A';

          return {
            id: prop.id,
            location,
            description: prop.details.col_E || '',
            clientEmail: prop.clientEmail || '',
            email: prop.Email || 'N/A',
            phone: prop.Phone || 'N/A',
            clientCity: prop['Client City'] || 'N/A',
            timeIST: prop['Time IST'] || ''
          };
        });

        // Sort by Time IST (newest to oldest)
        const sortedProperties = transformedProperties.sort((a: Property, b: Property) => {
          return new Date(b.timeIST).getTime() - new Date(a.timeIST).getTime();
        });
        setProperties(sortedProperties);
        setClients(result.data.clients);
      } else {
        console.error('API response unsuccessful:', result);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('userEmail');
    document.cookie = 'userSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  // Extract size from description
  const extractSize = (description: string): string => {
    try {
      const sizeMatch = description.match(/(\d+(?:\s*[-+]\s*\d+)?\s*(?:sq\s*ft|square\s*feet|sft|sqft|sq\s*feet|sqmtrs|acres|sat))/i);
      return sizeMatch ? sizeMatch[0] : 'N/A';
    } catch (error) {
      console.error('Error in extractSize:', error);
      return 'N/A';
    }
  };

  // Extract price from description
  const extractPrice = (description: string): string => {
    try {
      const priceMatch = description.match(/(?:₹|\$|rs|rupees)[\d,]+(?:\.\d{2})?\s*(?:per\s*(?:sq\s*ft|sft|sqft|feet))?(?:\s*(?:slightly\s*negotiable|negotiable)?)?/i);
      return priceMatch ? priceMatch[0] : 'N/A';
    } catch (error) {
      console.error('Error in extractPrice:', error);
      return 'N/A';
    }
  };

  // Show client details in modal
  const handleViewClient = (clientEmail: string, property: Property) => {
    const client = clients.find((c) => c.email === clientEmail);
    if (client) {
      setModalContent(
        `Client Details:\nName: ${client.name}\nEmail: ${property.email}\nPhone: ${property.phone}\nCity: ${property.clientCity}`
      );
    } else {
      setModalContent('No client associated with this property');
    }
  };

  // Show description in modal
  const handleViewDescription = (description: string) => {
    setModalContent(`Description:\n${description || 'No description available'}`);
  };

  // Close modal
  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <DashboardNavbar user={user} onSignOut={handleSignOut} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Properties (Looking for Tenants)</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {loading ? (
            <div className="text-white text-center">Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">No properties found.</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {properties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{property.id}</td>
                        <td className="px-6 py-4 text-sm max-w-xs">
                          <div className="whitespace-pre-line">{property.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{extractSize(property.description)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{extractPrice(property.description)}</td>
                        <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                          <button
                            onClick={() => handleViewClient(property.clientEmail, property)}
                            className="text-blue-400 hover:text-blue-300 transition-colors text-lg"
                            title="View Client Details"
                          >
                            👤
                          </button>
                          <button
                            onClick={() => handleViewDescription(property.description)}
                            className="text-blue-400 hover:text-blue-300 transition-colors text-lg"
                            title="View Description"
                          >
                            📄
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {modalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto">
            <pre className="text-white whitespace-pre-wrap">{modalContent}</pre>
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default PropertiesPage;
