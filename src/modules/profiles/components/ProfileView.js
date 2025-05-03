"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase/config';
import LinearProgress from '@mui/material/LinearProgress';

export default function ProfileView() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, users(email)')
          .order(sortField, { ascending: sortDirection === 'asc' });

        if (error) {
          console.error('Error fetching profiles:', error);
          setError(error.message || 'Failed to fetch profiles');
          return;
        }
        setProfiles(data || []);
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError('An unexpected error occurred while fetching profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [sortField, sortDirection]);

  if (loading) return <div className="p-4">Loading profiles...</div>;
  if (error) return (
    <div className="text-red-600 p-4 rounded-md bg-red-50">
      <p>Unable to load profiles. Please try again later.</p>
      <p className="mt-2 text-sm">{error}</p>
    </div>
  );

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full bg-white shadow rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('full_name')}>
              Name {sortField === 'full_name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-6 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('role')}>
              Role {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-6 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Profile Completion
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {profiles.map((profile) => (
            <tr key={profile.id} 
                className="hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                onClick={() => setSelectedProfile(profile)}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}`}
                      alt=""
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {profile.full_name || 'No name set'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{profile.users?.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{profile.role || 'Not specified'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="w-full max-w-xs">
                  <div className="flex items-center gap-2">
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateProfileCompletion(profile)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        flexGrow: 1,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#00D48A'
                        },
                        backgroundColor: '#f3f4f6'
                      }}
                    />
                    <span className="text-sm ml-2 whitespace-nowrap">
                      {calculateProfileCompletion(profile)}% Complete
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TODO: Add ProfileDetailModal component when profile is selected */}
    </div>
  );
}

function calculateProfileCompletion(profile) {
  const fields = ['full_name', 'avatar_url', 'role', 'bio', 'location', 'phone'];
  const completedFields = fields.filter(field => profile[field]);
  return Math.round((completedFields.length / fields.length) * 100);
} 