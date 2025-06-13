import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardNavbar from '../components/DashboardNavbar';
import Footer from '../components/Footer';

interface Inquiry {
  id: number;
  clientName: string;
  propertyType: string;
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

const InquiriesPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
          fetchInquiries();
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

  const fetchInquiries = async () => {
    try {
      const response = await fetch('/api/sheets-data');
      const result = await response.json();
      
      if (result.success) {
        const transformedInquiries = result.data.inquiries.map((inquiry: any) => {
          let rawLocation = inquiry.details?.col_D || inquiry['Preferred Location'] || inquiry['Location'] || '';
          let location = rawLocation.replace(/(India),?\s*/g, '$1\n');
          location = location.replace(/[ \t]+/g, ' ').trim() || 'N/A';

          console.log('Inquiry data:', inquiry);

          return {
            id: inquiry.id,
            clientName: inquiry.Name || inquiry['Client Name'] || inquiry.clientName || inquiry.name || 'N/A',
            propertyType: inquiry['Property Type'] || inquiry.Requirement || inquiry['Space Type'] || inquiry.Type || 'N/A',
            location,
            description: inquiry.details?.col_E || inquiry['Description'] || inquiry['Requirements'] || inquiry.description || '',
            clientEmail: inquiry.clientEmail || inquiry['Client Email'] || '',
            email: inquiry.Email || inquiry['Client Email'] || inquiry.email || 'N/A',
            phone: inquiry.Phone || inquiry['Contact'] || inquiry.phone || 'N/A',
            clientCity: inquiry['Client City'] || inquiry['City'] || inquiry.city || 'N/A',
            timeIST: inquiry['Time IST'] || inquiry['Date'] || inquiry['Created Date'] || inquiry.timeIST || ''
          };
        });

        sortInquiries(transformedInquiries, sortBy, sortOrder);
      } else {
        console.error('API response unsuccessful:', result);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortInquiries = (inquiriesToSort: Inquiry[], sortType: 'date' | 'size', order: 'asc' | 'desc') => {
    const sortedInquiries = [...inquiriesToSort].sort((a, b) => {
      if (sortType === 'date') {
        const dateA = new Date(a.timeIST).getTime();
        const dateB = new Date(b.timeIST).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        const sizeA = extractSizeNumber(a.description);
        const sizeB = extractSizeNumber(b.description);
        
        // Handle N/A cases (null values) to always appear at the bottom
        if (sizeA === null && sizeB === null) return 0;
        if (sizeA === null) return 1; // N/A goes to bottom
        if (sizeB === null) return -1; // N/A goes to bottom
        
        return order === 'asc' ? sizeA - sizeB : sizeB - sizeA;
      }
    });
    setInquiries(sortedInquiries);
  };

  const extractSizeNumber = (description: string): number | null => {
    try {
      const sizeMatch = description.match(/(\d+(?:\s*[-+]\s*\d+)?)\s*(?:sq\s*ft|square\s*feet|sft|sqft|sq\s*feet|sqmtrs|acres|sat)/i);
      if (!sizeMatch) return null;
      const sizeStr = sizeMatch[1].replace(/\s+/g, '');
      if (sizeStr.includes('-')) {
        const [min, max] = sizeStr.split('-').map(Number);
        return (min + max) / 2; // Use average for ranges
      }
      return Number(sizeStr);
    } catch (error) {
      console.error('Error in extractSizeNumber:', error);
      return null;
    }
  };

  const handleSort = (type: 'date' | 'size') => {
    const newOrder = sortBy === type && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(type);
    setSortOrder(newOrder);
    sortInquiries(inquiries, type, newOrder);
  };

  const handleSignOut = () => {
    localStorage.removeItem('userEmail');
    document.cookie = 'userSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  const extractSize = (description: string): string => {
    try {
      const sizeMatch = description.match(/(\d+(?:\s*[-+]\s*\d+)?\s*(?:sq\s*ft|square\s*feet|sft|sqft|sq\s*feet|sqmtrs|acres|sat))/i);
      return sizeMatch ? sizeMatch[0] : 'N/A';
    } catch (error) {
      console.error('Error in extractSize:', error);
      return 'N/A';
    }
  };

  const handleViewClient = (clientEmail: string, inquiry: Inquiry) => {
    const client = clients.find((c) => c.email === clientEmail);
    if (client) {
      setModalContent(
        `Client Details:\nName: ${inquiry.clientName}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nCity: ${inquiry.clientCity}`
      );
    } else {
      setModalContent(
        `Client Details:\nName: ${inquiry.clientName}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nCity: ${inquiry.clientCity}`
      );
    }
  };

  const handleViewDescription = (description: string, timeIST: string) => {
    setModalContent(`Inquiry Date: ${timeIST || 'N/A'}\n\nRequirements/Description:\n${description || 'No description available'}`);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <DashboardNavbar user={user} onSignOut={handleSignOut} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Inquiries (Looking for Space)</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => handleSort('date')}
                className={`px-4 py-2 rounded text-white transition-colors ${
                  sortBy === 'date' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Sort by Date {sortBy === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
              </button>
              <button
                onClick={() => handleSort('size')}
                className={`px-4 py-2 rounded text-white transition-colors ${
                  sortBy === 'size' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Sort by Size {sortBy === 'size' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-white text-center">Loading inquiries...</div>
          ) : inquiries.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">No inquiries found.</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Property Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {inquiries.map((inquiry) => (
                      <tr key={inquiry.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{inquiry.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{inquiry.clientName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{inquiry.propertyType}</td>
                        <td className="px-6 py-4 text-sm max-w-xs">
                          <div className="whitespace-pre-line">{inquiry.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{extractSize(inquiry.description)}</td>
                        <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                          <button
                            onClick={() => handleViewClient(inquiry.clientEmail, inquiry)}
                            className="text-blue-400 hover:text-blue-300 transition-colors text-lg"
                            title="View Client Details"
                          >
                            👤
                          </button>
                          <button
                            onClick={() => handleViewDescription(inquiry.description, inquiry.timeIST)}
                            className="text-blue-400 hover:text-blue-300 transition-colors text-lg"
                            title="View Requirements/Description"
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

export default InquiriesPage;
