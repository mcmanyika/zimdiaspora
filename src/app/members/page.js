'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState, useCallback } from 'react';
import Admin from '../../components/layout/Admin';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import withAuth from '../../utils/withAuth';
import { 
  ClockIcon, 
  BriefcaseIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';

function MembersPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [currentInvestmentPage, setCurrentInvestmentPage] = useState(1);
  const [investmentSortField, setInvestmentSortField] = useState('created_at');
  const [investmentSortOrder, setInvestmentSortOrder] = useState('desc');
  const investmentsPerPage = 9;
  const profilesPerPage = 6;
  const supabase = createClientComponentClient();

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  };

  const executeSearch = () => {
    setDebouncedSearchQuery(searchQuery);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Generate pagination range with ellipsis
  const getPaginationRange = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    range.forEach(i => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  // Add this new function for client-side sorting
  const sortProfiles = useCallback((profiles, field, order) => {
    return [...profiles].sort((a, b) => {
      let valueA = a[field];
      let valueB = b[field];

      // Handle null/undefined values
      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';

      // Convert to lowercase for string comparison
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  // Modify the handleSort function
  const handleSort = (field) => {
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    
    // Sort profiles client-side
    const sortedProfiles = sortProfiles(allProfiles, field, newOrder);
    setProfiles(sortedProfiles);
  };

  // Add function to sort investments
  const sortInvestments = useCallback((investments, field, order) => {
    return [...investments].sort((a, b) => {
      let valueA = field === 'project' ? a.proposal?.title : a[field];
      let valueB = field === 'project' ? b.proposal?.title : b[field];

      // Handle null/undefined values
      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';

      // Convert to lowercase for string comparison
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  // Add function to handle investment sort
  const handleInvestmentSort = (field) => {
    const newOrder = field === investmentSortField && investmentSortOrder === 'asc' ? 'desc' : 'asc';
    setInvestmentSortField(field);
    setInvestmentSortOrder(newOrder);
    
    const sortedInvestments = sortInvestments(investments, field, newOrder);
    setInvestments(sortedInvestments);
  };

  // Add function to fetch investments
  const fetchInvestments = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          proposal:proposals(
            id,
            title,
            status,
            amount_raised,
            budget
          )
        `)
        .eq('investor_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (err) {
      console.error('Error fetching investments:', err);
    }
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('profiles')
          .select('*', { count: 'exact' });

        // Apply search filter
        if (debouncedSearchQuery) {
          query = query.or(`full_name.ilike.%${debouncedSearchQuery}%,email.ilike.%${debouncedSearchQuery}%`);
        }

        // Get total count
        const { count, error: countError } = await query;
        if (countError) throw countError;
        setTotalProfiles(count || 0);

        // Fetch all profiles
        const { data, error } = await query;
        if (error) throw error;
        
        // Store all profiles and set initial sorted profiles
        setAllProfiles(data || []);
        const sortedProfiles = sortProfiles(data || [], sortField, sortOrder);
        setProfiles(sortedProfiles);
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [debouncedSearchQuery, sortProfiles, sortField, sortOrder]);

  // Modify the search effect to work with client-side sorting
  useEffect(() => {
    if (debouncedSearchQuery) {
      const filteredProfiles = allProfiles.filter(profile => 
        profile.full_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        profile.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
      const sortedFilteredProfiles = sortProfiles(filteredProfiles, sortField, sortOrder);
      setProfiles(sortedFilteredProfiles);
      setTotalProfiles(filteredProfiles.length);
    } else {
      const sortedProfiles = sortProfiles(allProfiles, sortField, sortOrder);
      setProfiles(sortedProfiles);
      setTotalProfiles(allProfiles.length);
    }
  }, [debouncedSearchQuery, allProfiles, sortProfiles, sortField, sortOrder]);

  const totalPages = Math.ceil(totalProfiles / profilesPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Modify handleProfileClick to fetch investments
  const handleProfileClick = async (profile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
    await fetchInvestments(profile.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProfile(null);
  };

  const getAvailabilityIcon = (availability) => {
    switch (availability) {
      case 'full-time':
        return <ClockIcon className="h-5 w-5 text-green-500" />;
      case 'part-time':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'contract':
        return <DocumentTextIcon className="h-5 w-5 text-purple-500" />;
      case 'freelance':
        return <UserGroupIcon className="h-5 w-5 text-orange-500" />;
      case 'not-available':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAvailabilityText = (availability) => {
    switch (availability) {
      case 'full-time':
        return 'Full Time';
      case 'part-time':
        return 'Part Time';
      case 'contract':
        return 'Contract';
      case 'freelance':
        return 'Freelance';
      case 'not-available':
        return 'Not Available';
      default:
        return availability;
    }
  };

  // Add function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Add function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'FAILED':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  // Modify getPaginatedInvestments to use sorted investments
  const getPaginatedInvestments = () => {
    const sortedInvestments = sortInvestments(investments, investmentSortField, investmentSortOrder);
    const startIndex = (currentInvestmentPage - 1) * investmentsPerPage;
    const endIndex = startIndex + investmentsPerPage;
    return sortedInvestments.slice(startIndex, endIndex);
  };

  // Add function to get total investment pages
  const getTotalInvestmentPages = () => {
    return Math.ceil(investments.length / investmentsPerPage);
  };

  // Add function to handle investment page change
  const handleInvestmentPageChange = (newPage) => {
    setCurrentInvestmentPage(newPage);
  };

  // Add function to get investment pagination range
  const getInvestmentPaginationRange = () => {
    const totalPages = getTotalInvestmentPages();
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentInvestmentPage - delta && i <= currentInvestmentPage + delta)
      ) {
        range.push(i);
      }
    }

    range.forEach(i => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  return (
    <Admin>
      <div className="p-6">
        <ToastContainer
          position="bottom-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Members Directory</h1>
        </div>

        {/* Search and Sort Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={handleSearch}
              onKeyDown={handleSearchSubmit}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <button
              onClick={executeSearch}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              Search
            </button>
          </div>
        </div>

        {/* Page Info */}
        <div className="mt-4 mb-4 text-right text-sm text-gray-500">
          {totalProfiles > 0 ? (
            <>
              Showing {((currentPage - 1) * profilesPerPage) + 1} to {Math.min(currentPage * profilesPerPage, totalProfiles)} of {totalProfiles} members
              {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
            </>
          ) : (
            'No members found'
          )}
        </div>

        {/* Table Layout */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('full_name')}>
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    {sortField === 'full_name' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('occupation')}>
                  <div className="flex items-center space-x-1">
                    <span>Occupation</span>
                    {sortField === 'occupation' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('country')}>
                  <div className="flex items-center space-x-1">
                    <span>Country</span>
                    {sortField === 'country' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('availability')}>
                  <div className="flex items-center space-x-1">
                    <span>Availability</span>
                    {sortField === 'availability' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {profiles.map((profile) => (
                <tr key={profile.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleProfileClick(profile)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {profile.avatar_url ? (
                          <Image
                            src={profile.avatar_url}
                            alt={profile.full_name || 'Profile'}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm capitalize">
                              {(profile.full_name || '?')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {profile.full_name || 'Anonymous'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{profile.occupation || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{profile.country || '-'}</div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getAvailabilityIcon(profile.availability)}
                      <span className="text-sm text-gray-900">
                        {getAvailabilityText(profile.availability)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Profile Detail Modal */}
        {isModalOpen && selectedProfile && (
          <div className="fixed inset-0 bg-white z-50">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="border-b border-gray-200 bg-white px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {selectedProfile.avatar_url ? (
                      <Image
                        src={selectedProfile.avatar_url}
                        alt={selectedProfile.full_name || 'Profile'}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-lg capitalize">
                          {(selectedProfile.full_name || '?')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 capitalize">
                      {selectedProfile.full_name || 'Anonymous'}
                    </h2>
                    <p className="text-gray-500">{selectedProfile.email}</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profile Information */}
                    <div className="space-y-6 md:col-span-1">
                      <h3 className="text-lg font-medium text-gray-900 uppercase">Profile Information</h3>
                      
                      {selectedProfile.occupation && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Occupation</h4>
                          <p className="mt-1 text-base text-gray-900">{selectedProfile.occupation}</p>
                        </div>
                      )}

                      {selectedProfile.professional_skills && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Professional Skills</h4>
                          <p className="mt-1 text-base text-gray-900">{selectedProfile.professional_skills}</p>
                        </div>
                      )}

                      {selectedProfile.gender && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Gender</h4>
                          <p className="mt-1 text-base text-gray-900 capitalize">{selectedProfile.gender}</p>
                        </div>
                      )}

                      {selectedProfile.date_of_birth && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Date of Birth</h4>
                          <p className="mt-1 text-base text-gray-900">
                            {new Date(selectedProfile.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {selectedProfile.phone_number && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Phone Number</h4>
                          <p className="mt-1 text-base text-gray-900">{selectedProfile.phone_number}</p>
                        </div>
                      )}

                      {selectedProfile.country && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Country</h4>
                          <p className="mt-1 text-base text-gray-900">{selectedProfile.country}</p>
                        </div>
                      )}

                      {selectedProfile.availability && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Availability</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            {getAvailabilityIcon(selectedProfile.availability)}
                            <p className="text-base text-gray-900 capitalize">
                              {getAvailabilityText(selectedProfile.availability)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Investment History */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 uppercase">Investment History</h3>
                      {investments.length > 0 ? (
                        <>
                          {/* Investment Count */}
                          <div className="mb-4 text-right text-xs text-gray-500">
                            Showing {((currentInvestmentPage - 1) * investmentsPerPage) + 1} to {Math.min(currentInvestmentPage * investmentsPerPage, investments.length)} of {investments.length} investments
                          </div>

                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                      onClick={() => handleInvestmentSort('project')}>
                                    <div className="flex items-center space-x-1">
                                      <span>Project</span>
                                      {investmentSortField === 'project' && (
                                        <span>{investmentSortOrder === 'asc' ? '↑' : '↓'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                      onClick={() => handleInvestmentSort('amount')}>
                                    <div className="flex items-center space-x-1">
                                      <span>Amount</span>
                                      {investmentSortField === 'amount' && (
                                        <span>{investmentSortOrder === 'asc' ? '↑' : '↓'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                      onClick={() => handleInvestmentSort('status')}>
                                    <div className="flex items-center space-x-1">
                                      <span>Status</span>
                                      {investmentSortField === 'status' && (
                                        <span>{investmentSortOrder === 'asc' ? '↑' : '↓'}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                      onClick={() => handleInvestmentSort('created_at')}>
                                    <div className="flex items-center space-x-1">
                                      <span>Date</span>
                                      {investmentSortField === 'created_at' && (
                                        <span>{investmentSortOrder === 'asc' ? '↑' : '↓'}</span>
                                      )}
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {getPaginatedInvestments().map((investment) => (
                                  <tr key={investment.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {investment.proposal?.title || 'Unknown Project'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {formatCurrency(investment.amount)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(investment.status)}`}>
                                        {investment.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                      {new Date(investment.created_at).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Investment Pagination */}
                          {getTotalInvestmentPages() > 1 && (
                            <div className="mt-4 flex justify-center items-center space-x-2">
                              <button
                                onClick={() => handleInvestmentPageChange(currentInvestmentPage - 1)}
                                disabled={currentInvestmentPage === 1}
                                className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Previous
                              </button>
                              
                              <div className="flex items-center space-x-1">
                                {getInvestmentPaginationRange().map((pageNum, index) => (
                                  pageNum === '...' ? (
                                    <span key={`ellipsis-${index}`} className="px-2">...</span>
                                  ) : (
                                    <button
                                      key={pageNum}
                                      onClick={() => handleInvestmentPageChange(pageNum)}
                                      className={`px-3 py-1 rounded-md ${
                                        currentInvestmentPage === pageNum
                                          ? 'bg-black text-white'
                                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  )
                                ))}
                              </div>

                              <button
                                onClick={() => handleInvestmentPageChange(currentInvestmentPage + 1)}
                                disabled={currentInvestmentPage === getTotalInvestmentPages()}
                                className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-500">No investment history available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {getPaginationRange().map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2">...</span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === pageNum
                        ? 'bg-black text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

       
      </div>
    </Admin>
  );
}

export default withAuth(MembersPage);
