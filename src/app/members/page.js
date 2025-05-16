'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState, useCallback } from 'react';
import Admin from '../../components/layout/Admin';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
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

        // Apply sorting
        query = query.order(sortField, { ascending: sortOrder === 'asc' });

        // Get total count
        const { count, error: countError } = await query;
        if (countError) throw countError;
        setTotalProfiles(count || 0);

        // Apply pagination
        const { data, error } = await query
          .range((currentPage - 1) * profilesPerPage, currentPage * profilesPerPage - 1);

        if (error) throw error;
        setProfiles(data || []);
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Reset to first page when search or sort changes
    if (debouncedSearchQuery !== searchQuery) {
      setCurrentPage(1);
    }
    fetchProfiles();
  }, [debouncedSearchQuery, sortField, sortOrder, currentPage]);

  const totalPages = Math.ceil(totalProfiles / profilesPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleProfileClick = (profile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
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

  if (loading) {
    return (
      <Admin>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Admin>
    );
  }

  if (error) {
    return (
      <Admin>
        <div className="text-red-500 p-4">{error}</div>
      </Admin>
    );
  }

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
          <p className="mt-2 text-gray-600">View all registered members</p>
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
          <div className="flex gap-2">
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortField(field);
                setSortOrder(order);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="full_name-asc">Name (A-Z)</option>
              <option value="full_name-desc">Name (Z-A)</option>
              <option value="country-asc">Country (A-Z)</option>
              <option value="country-desc">Country (Z-A)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer"
              onClick={() => handleProfileClick(profile)}
            >
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.full_name || 'Profile'}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-lg capitalize">
                          {(profile.full_name || '?')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {profile.full_name || 'Anonymous'}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {profile.occupation && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Occupation</p>
                      <p className="text-base text-gray-900">{profile.occupation}</p>
                    </div>
                  )}
                  
                  {profile.country && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Country</p>
                      <p className="text-base text-gray-900">{profile.country}</p>
                    </div>
                  )}

                  {profile.availability && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Availability</p>
                      <div className="flex items-center space-x-2">
                        {getAvailabilityIcon(profile.availability)}
                        <p className="text-base text-gray-900 capitalize">
                          {getAvailabilityText(profile.availability)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Profile Detail Modal */}
        {isModalOpen && selectedProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {selectedProfile.avatar_url ? (
                        <Image
                          src={selectedProfile.avatar_url}
                          alt={selectedProfile.full_name || 'Profile'}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xl capitalize">
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

                <div className="space-y-6">
                  {selectedProfile.occupation && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Occupation</h3>
                      <p className="mt-1 text-lg text-gray-900">{selectedProfile.occupation}</p>
                    </div>
                  )}

                  {selectedProfile.professional_skills && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Professional Skills</h3>
                      <p className="mt-1 text-lg text-gray-900">{selectedProfile.professional_skills}</p>
                    </div>
                  )}

                  {selectedProfile.gender && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                      <p className="mt-1 text-lg text-gray-900 capitalize">{selectedProfile.gender}</p>
                    </div>
                  )}

                  {selectedProfile.date_of_birth && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                      <p className="mt-1 text-lg text-gray-900">
                        {new Date(selectedProfile.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {selectedProfile.phone_number && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                      <p className="mt-1 text-lg text-gray-900">{selectedProfile.phone_number}</p>
                    </div>
                  )}

                  {selectedProfile.country && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Country</h3>
                      <p className="mt-1 text-lg text-gray-900">{selectedProfile.country}</p>
                    </div>
                  )}


                    {selectedProfile.availability && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Availability</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getAvailabilityIcon(selectedProfile.availability)}
                        <p className="text-lg text-gray-900 capitalize">
                          {getAvailabilityText(selectedProfile.availability)}
                        </p>
                      </div>
                    </div>
                  )}
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

        {/* Page Info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {totalProfiles > 0 ? (
            <>
              Showing {((currentPage - 1) * profilesPerPage) + 1} to {Math.min(currentPage * profilesPerPage, totalProfiles)} of {totalProfiles} members
              {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
            </>
          ) : (
            'No members found'
          )}
        </div>
      </div>
    </Admin>
  );
}

export default MembersPage;
