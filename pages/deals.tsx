import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Deal } from '../lib/dealsUtils';
import { createSupabaseClient } from '../lib/supabase';
import DashboardNavbar from '../components/DashboardNavbar';

interface User {
  email: string;
}

const formatIndianCurrency = (numInput: number | string | null | undefined): string => {
  if (numInput === null || numInput === undefined || numInput === '') {
    return '';
  }

  const numStr = String(numInput);
  const isTrailingDecimal = numStr.endsWith('.');

  const cleanedNumStr = numStr.replace(/[^0-9.]/g, '');

  if (cleanedNumStr === '' || cleanedNumStr === '.') {
    return cleanedNumStr;
  }

  let [integerPart, decimalPart] = cleanedNumStr.split('.');

  if (integerPart.length > 3) {
    let lastThree = integerPart.substring(integerPart.length - 3);
    let otherNumbers = integerPart.substring(0, integerPart.length - 3);
    otherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    integerPart = otherNumbers + ',' + lastThree;
  }

  let formattedValue = integerPart;
  if (decimalPart !== undefined) {
    formattedValue += `.${decimalPart}`;
  } else if (isTrailingDecimal) {
    formattedValue += '.';
  }

  return formattedValue;
};

const DealsPage = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filter, setFilter] = useState<'Active' | 'Payment Pending' | 'Closed' | 'Cancelled' | 'All'>('All');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [supabase, setSupabase] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState<Partial<Deal>>({
    service_type: 'Owner',
    status: 'Active',
    revenue_from_owner: 0,
    revenue_from_tenant: 0,
    cost_or_budget: 0,
    size: 0,
    start_date: new Date().toISOString().split('T')[0],
    payment_date: null,
    closed_date: null,
  });

  const router = useRouter();
  const ADMIN_EMAIL = 'admin@enoshinfra.com';

  const validStatuses = ['Active', 'Payment Pending', 'Closed', 'Cancelled'] as const;

  const filteredDeals = deals && Array.isArray(deals)
    ? filter === 'All'
      ? deals
      : deals.filter((deal) => deal.status === filter)
    : [];

  const loadDeals = async (supabaseClient: any, userEmail: string) => {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    try {
      console.log('Loading deals for user:', userEmail);
      const { data, error } = await supabaseClient
        .from('deals')
        .select('*')
        .eq('created_by', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    } catch (error) {
      throw new Error(`Error fetching deals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const checkTeamMembership = async (userEmail: string, supabaseClient: any) => {
    try {
      const { data, error } = await supabaseClient
        .from('team')
        .select('email')
        .eq('email', userEmail)
        .single();

      if (error || !data) {
        setError('Unauthorized to make database changes');
        router.push('/dashboard');
        return false;
      }
      return true;
    } catch (error) {
      setError('Unauthorized to make database changes');
      router.push('/dashboard');
      return false;
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      router.push('/api/auth/logout');
    } catch (error) {
      console.error('Sign-out error:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          throw new Error('Not authenticated');
        }

        const data = await res.json();
        const userEmail = data.email;
        if (!userEmail || userEmail === 'no email stored') {
          throw new Error('No email found in authentication');
        }

        const supabaseClient = createSupabaseClient();
        setSupabase(supabaseClient);

        await new Promise(resolve => setTimeout(resolve, 10));

        const isAuthorized = await checkTeamMembership(userEmail, supabaseClient);
        if (!isAuthorized) {
          return;
        }

        const userData = { email: userEmail };
        setUser(userData);

        setNewDeal(( gotten) => ({
          ...gotten,
          created_by: userEmail,
          start_date: gotten.start_date || new Date().toISOString().split('T')[0],
        }));

        const dealsData = await loadDeals(supabaseClient, userEmail);
        setDeals(dealsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize app');
        router.push('/api/auth/login');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [router]);

  const handleStatusChange = (newStatus: 'Active' | 'Payment Pending' | 'Closed' | 'Cancelled') => {
    const updatedDeal = { ...newDeal, status: newStatus };
    const currentDate = new Date().toISOString().split('T')[0];

    if (newStatus === 'Closed') {
      if (!updatedDeal.payment_date && newDeal.status === 'Active') {
        updatedDeal.payment_date = currentDate;
      }
      if (!updatedDeal.closed_date) {
        updatedDeal.closed_date = currentDate;
      }
    } else if (newStatus === 'Payment Pending') {
      if (!updatedDeal.payment_date) {
        updatedDeal.payment_date = currentDate;
      }
      updatedDeal.closed_date = null;
    } else if (newStatus === 'Cancelled') {
      if (!updatedDeal.closed_date) {
        updatedDeal.closed_date = currentDate;
      }
      updatedDeal.payment_date = null;
    } else if (newStatus === 'Active') {
      updatedDeal.payment_date = null;
      updatedDeal.closed_date = null;
    }

    setNewDeal(updatedDeal);
  };

  const resetForm = () => {
    setNewDeal({
      service_type: 'Owner',
      status: 'Active',
      revenue_from_owner: 0,
      revenue_from_tenant: 0,
      cost_or_budget: 0,
      size: 0,
      start_date: new Date().toISOString().split('T')[0],
      payment_date: null,
      closed_date: null,
      created_by: user?.email || '',
    });
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !supabase) {
      setError('Please log in to create a deal');
      router.push('/api/auth/login');
      return;
    }

    const isAuthorized = await checkTeamMembership(user.email, supabase);
    if (!isAuthorized) {
      return;
    }

    setLoading(true);
    setError(null);

    const dealToInsert = {
      status: newDeal.status || 'Active',
      service_type: newDeal.service_type || 'Owner',
      customer: newDeal.customer?.trim() || '',
      location: newDeal.location?.trim() || '',
      size: newDeal.size ? parseFloat(String(newDeal.size)) : 0,
      cost_or_budget: newDeal.cost_or_budget ? parseFloat(String(newDeal.cost_or_budget)) : 0,
      revenue_from_owner: newDeal.revenue_from_owner ? parseFloat(String(newDeal.revenue_from_owner)) : 0,
      revenue_from_tenant: newDeal.revenue_from_tenant ? parseFloat(String(newDeal.revenue_from_tenant)) : 0,
      notes: newDeal.notes?.trim() || '',
      start_date: newDeal.start_date || new Date().toISOString().split('T')[0],
      payment_date: newDeal.payment_date || null,
      closed_date: newDeal.closed_date || null,
      created_by: user.email,
    };

    if (!dealToInsert.customer || !dealToInsert.location) {
      setError('Customer and Location are required fields.');
      setLoading(false);
      return;
    }

    if (!validStatuses.includes(dealToInsert.status)) {
      setError(`Invalid status value: ${dealToInsert.status}`);
      setLoading(false);
      return;
    }

    try {
      console.log('Inserting deal with status:', dealToInsert.status);
      const { error } = await supabase.from('deals').insert([dealToInsert]);
      if (error) {
        throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
      }

      const dealsData = await loadDeals(supabase, user.email);
      setDeals(dealsData);
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating deal:', error);
      setError(error instanceof Error ? error.message : 'Error creating deal');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !user || !supabase) return;

    const isAuthorized = await checkTeamMembership(user.email, supabase);
    if (!isAuthorized) {
      return;
    }

    if (user.email !== selectedDeal.created_by && user.email !== ADMIN_EMAIL) {
      setError('Unauthorized: You can only edit deals you created.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const dealToUpdate = {
      status: newDeal.status || 'Active',
      service_type: newDeal.service_type || 'Owner',
      customer: newDeal.customer?.trim() || '',
      location: newDeal.location?.trim() || '',
      size: newDeal.size ? parseFloat(String(newDeal.size)) : 0,
      cost_or_budget: newDeal.cost_or_budget ? parseFloat(String(newDeal.cost_or_budget)) : 0,
      revenue_from_owner: newDeal.revenue_from_owner ? parseFloat(String(newDeal.revenue_from_owner)) : 0,
      revenue_from_tenant: newDeal.revenue_from_tenant ? parseFloat(String(newDeal.revenue_from_tenant)) : 0,
      notes: newDeal.notes?.trim() || '',
      start_date: newDeal.start_date || new Date().toISOString().split('T')[0],
      payment_date: newDeal.payment_date || null,
      closed_date: newDeal.closed_date || null,
    };

    if (!dealToUpdate.customer || !dealToUpdate.location) {
      setError('Customer and Location are required fields.');
      setLoading(false);
      return;
    }

    if (!validStatuses.includes(dealToUpdate.status)) {
      setError(`Invalid status value: ${dealToUpdate.status}`);
      setLoading(false);
      return;
    }

    try {
      console.log('Updating deal with status:', dealToUpdate.status);
      const { error } = await supabase
        .from('deals')
        .update(dealToUpdate)
        .eq('id', selectedDeal.id);

      if (error) {
        throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
      }

      const dealsData = await loadDeals(supabase, user.email);
      setDeals(dealsData);
      setShowEditForm(false);
      setSelectedDeal(null);
      resetForm();
    } catch (error) {
      console.error('Error updating deal:', error);
      setError(error instanceof Error ? error.message : 'Error updating deal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?') || !supabase || !user) return;

    const isAuthorized = await checkTeamMembership(user.email, supabase);
    if (!isAuthorized) {
      return;
    }

    const deal = deals.find((d) => d.id === dealId);
    if (!deal) {
      setError('Deal not found.');
      return;
    }

    if (user.email !== deal.created_by && user.email !== ADMIN_EMAIL) {
      setError('Unauthorized: You can only delete deals you created.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) {
        throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
      }

      const dealsData = await loadDeals(supabase, user.email);
      setDeals(dealsData);
      setSelectedDeal(null);
    } catch (error) {
      console.error('Error deleting deal:', error);
      setError(error instanceof Error ? error.message : 'Error deleting deal');
    } finally {
      setLoading(false);
    }
  };

  const openEditForm = (deal: Deal) => {
    setSelectedDeal(deal);
    setNewDeal({
      ...deal,
      revenue_from_owner: deal.revenue_from_owner ?? 0,
      revenue_from_tenant: deal.revenue_from_tenant ?? 0,
      cost_or_budget: deal.cost_or_budget ?? 0,
      size: deal.size ?? 0,
      payment_date: deal.payment_date ?? null,
      closed_date: deal.closed_date ?? null,
    });
    setShowEditForm(true);
  };

  const handleNumericChange = (
    field: 'revenue_from_owner' | 'revenue_from_tenant' | 'cost_or_budget' | 'size',
    value: string
  ) => {
    const parts = value.split('.');
    let cleanedValue = parts[0].replace(/[^0-9]/g, '');
    if (parts.length > 1) {
      cleanedValue += '.' + parts.slice(1).join('').replace(/[^0-9]/g, '');
    }

    setNewDeal((prev) => ({ ...prev, [field]: cleanedValue }));
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <DashboardNavbar user={user} onSignOut={handleSignOut} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Head>
            <title>Deals - Enosh Infra</title>
            <meta name="description" content="Manage active real estate deals" />
          </Head>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Manage Your Deals</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {loading && !user ? (
            <div className="text-white text-center">Loading...</div>
          ) : error ? (
            <div className="mb-8 p-4 bg-red-600 text-white rounded">
              {error}
              <button className="ml-4 underline" onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <label htmlFor="statusFilter" className="mr-2 text-white">Filter by Status:</label>
                  <select
                    id="statusFilter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as 'Active' | 'Payment Pending' | 'Closed' | 'Cancelled' | 'All')}
                    className="p-2 border rounded bg-gray-800 text-white border-gray-600"
                  >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Payment Pending">Payment Pending</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 transition disabled:opacity-50"
                    onClick={() => loadDeals(supabase, user?.email || '')}
                    disabled={loading || !supabase || !user}
                  >
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(true);
                    }}
                  >
                    Add New Deal
                  </button>
                </div>
              </div>
              {filteredDeals.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <p className="text-gray-400">No deals found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => setSelectedDeal(deal)}
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {deal.customer ? deal.customer.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="ml-4 flex-grow">
                          <h3 className="text-lg font-semibold text-white">
                            {deal.customer || 'Unknown Deal'}
                          </h3>
                          <span
                            className={`inline-block px-2 py-1 mt-1 rounded text-xs font-medium ${
                              deal.status === 'Active'
                                ? 'bg-blue-200 text-blue-800'
                                : deal.status === 'Payment Pending'
                                ? 'bg-yellow-200 text-yellow-800'
                                : deal.status === 'Closed'
                                ? 'bg-red-200 text-red-800'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            {deal.status}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{deal.created_by || '-'}</span>
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657A8 8 0 118.343 7.343 8 8 0 0117.657 16.657z"
                            />
                          </svg>
                          <span>{deal.location || '-'}</span>
                        </div>
                        {deal.size ? (
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            <span>{deal.size} sq ft</span>
                          </div>
                        ) : null}
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>₹{deal.cost_or_budget?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                          <span>₹{deal.total_revenue?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {selectedDeal && !showEditForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
              <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] flex flex-col text-white mx-4 overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex-shrink-0">
                  <h2 className="text-2xl font-bold text-white">{selectedDeal.customer}</h2>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                  <div className="space-y-4 text-sm text-gray-300">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">Status:</span>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          selectedDeal.status === 'Active'
                            ? 'bg-blue-200 text-blue-800'
                            : selectedDeal.status === 'Payment Pending'
                            ? 'bg-yellow-200 text-yellow-800'
                            : selectedDeal.status === 'Closed'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {selectedDeal.status}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">Service Type:</span>
                      <span>{selectedDeal.service_type}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">Location:</span>
                      <span>{selectedDeal.location}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">Size:</span>
                      <span>{selectedDeal.size ? `${selectedDeal.size} sq.ft` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">
                        {selectedDeal.service_type === 'Owner' ? 'Cost/sqft' : 'Budget/sqft'}:
                      </span>
                      <span>₹{selectedDeal.cost_or_budget?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">Revenue (Owner):</span>
                      <span>₹{selectedDeal.revenue_from_owner?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">Revenue (Tenant):</span>
                      <span>₹{selectedDeal.revenue_from_tenant?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">Total Revenue:</span>
                      <span>₹{selectedDeal.total_revenue?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-400 w-24">Notes:</span>
                      <span className="whitespace-pre-wrap">{selectedDeal.notes || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">Start Date:</span>
                      <span>{selectedDeal.start_date || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">Payment Date:</span>
                      <span>{selectedDeal.payment_date || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">Closed Date:</span>
                      <span>{selectedDeal.closed_date || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400 w-24">Created By:</span>
                      <span>{selectedDeal.created_by}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-700 flex-shrink-0">
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition text-sm"
                      onClick={() => openEditForm(selectedDeal)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition text-sm"
                      onClick={() => handleDeleteDeal(selectedDeal.id)}
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition text-sm"
                      onClick={() => setSelectedDeal(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(showAddForm || showEditForm) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg w-full max-w-lg h-[90vh] flex flex-col text-white overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex-shrink-0">
                  <h2 className="text-2xl font-bold">
                    {showEditForm ? 'Edit Deal' : 'Add New Deal'}
                  </h2>
                </div>
                <div className="overflow-y-auto px-8 py-6 grow">
                  <form
                    id="deal-form"
                    onSubmit={showEditForm ? handleEditDeal : handleAddDeal}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Status
                      </label>
                      <select
                        value={newDeal.status || 'Active'}
                        onChange={(e) =>
                          handleStatusChange(e.target.value as 'Active' | 'Payment Pending' | 'Closed' | 'Cancelled')
                        }
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                      >
                        <option value="Active">Active</option>
                        <option value="Payment Pending">Payment Pending</option>
                        <option value="Closed">Closed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Customer *
                      </label>
                      <input
                        type="text"
                        value={newDeal.customer || ''}
                        onChange={(e) =>
                          setNewDeal({ ...newDeal, customer: e.target.value })
                        }
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Service Type
                      </label>
                      <select
                        value={newDeal.service_type || 'Owner'}
                        onChange={(e) =>
                          setNewDeal({
                            ...newDeal,
                            service_type: e.target.value as 'Owner' | 'Tenant',
                          })
                        }
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                      >
                        <option value="Owner">Owner</option>
                        <option value="Tenant">Tenant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={newDeal.location || ''}
                        onChange={(e) =>
                          setNewDeal({ ...newDeal, location: e.target.value })
                        }
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium">
                          Size (sq ft)
                        </label>
                        <input
                          type="text"
                          value={formatIndianCurrency(newDeal.size)}
                          onChange={(e) => handleNumericChange('size', e.target.value)}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                          placeholder="e.g., 1200"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium">
                          {newDeal.service_type === 'Owner' ? 'Cost/sqft' : 'Budget/sqft'}
                        </label>
                        <input
                          type="text"
                          value={formatIndianCurrency(newDeal.cost_or_budget)}
                          onChange={(e) =>
                            handleNumericChange('cost_or_budget', e.target.value)
                          }
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium">
                          Revenue from Owner
                        </label>
                        <input
                          type="text"
                          value={formatIndianCurrency(newDeal.revenue_from_owner)}
                          onChange={(e) =>
                            handleNumericChange('revenue_from_owner', e.target.value)
                          }
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium">
                          Revenue from Tenant
                        </label>
                        <input
                          type="text"
                          value={formatIndianCurrency(newDeal.revenue_from_tenant)}
                          onChange={(e) =>
                            handleNumericChange('revenue_from_tenant', e.target.value)
                          }
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Notes</label>
                      <textarea
                        value={newDeal.notes || ''}
                        onChange={(e) =>
                          setNewDeal({ ...newDeal, notes: e.target.value })
                        }
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm h-20 resize-none"
                        rows={3}
                        maxLength={500}
                        placeholder="Additional notes (max 500 characters)"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {(newDeal.notes || '').length}/500 characters
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          value={newDeal.start_date || ''}
                          onChange={(e) =>
                            setNewDeal({ ...newDeal, start_date: e.target.value })
                          }
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                          required
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <label className="block text-sm font-medium">
                            Payment Date
                          </label>
                          <div className="relative group">
                            <span
                              aria-label="Tooltip for payment date"
                              tabIndex={0}
                              className="inline-flex items-center justify-center w-4 h-4 bg-gray-400 text-gray-800 rounded-full text-xs font-medium cursor-help"
                            >
                              i
                            </span>
                            <span className="absolute z-10 invisible group-hover:visible bg-gray-200 text-gray-800 text-xs rounded-md p-2 w-48 top-6 left-0 -translate-x-1/4">
                              Auto-filled when status is set to 'Payment Pending' or 'Closed'
                            </span>
                          </div>
                        </div>
                        <input
                          type="date"
                          value={newDeal.payment_date || ''}
                          onChange={(e) =>
                            setNewDeal({ ...newDeal, payment_date: e.target.value })
                          }
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                          disabled={newDeal.status !== 'Payment Pending' && newDeal.status !== 'Closed'}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="block text-sm font-medium">
                          Closed Date
                        </label>
                        <div className="relative group">
                          <span
                            aria-label="Tooltip for closed date"
                            tabIndex={0}
                            className="inline-flex items-center justify-center w-4 h-4 bg-gray-400 text-gray-800 rounded-full text-xs font-medium cursor-help"
                          >
                            i
                          </span>
                          <span className="absolute z-10 invisible group-hover:visible bg-gray-200 text-gray-800 text-xs rounded-md p-2 w-48 top-6 left-0 -translate-x-1/4">
                            Auto-filled when status is set to 'Closed' or 'Cancelled'
                          </span>
                        </div>
                      </div>
                      <input
                        type="date"
                        value={newDeal.closed_date || ''}
                        onChange={(e) =>
                          setNewDeal({ ...newDeal, closed_date: e.target.value })
                        }
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                        disabled={newDeal.status !== 'Closed' && newDeal.status !== 'Cancelled'}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Created By
                      </label>
                      <input
                        type="text"
                        value={user?.email || ''}
                        disabled
                        className="w-full p-2 bg-gray-600 border border-gray-600 rounded text-sm text-gray-300"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Automatically set to logged-in user
                      </p>
                    </div>
                  </form>
                </div>
                <div className="p-6 border-t border-gray-700 bg-gray-800 rounded-b-lg">
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button
                      type="button"
                      className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition text-sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setShowEditForm(false);
                        setSelectedDeal(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="deal-form"
                      className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      disabled={!user || loading}
                    >
                      {loading ? 'Saving...' : showEditForm ? 'Update Deal' : 'Save Deal'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DealsPage;
