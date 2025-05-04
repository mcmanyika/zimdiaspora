"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react';


export default function ProfileView() {
  const [profiles, setProfiles] = useState([]);
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          // Filter directly in the database query instead of client-side
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email);
            
          if (error) throw error;
          setProfiles(data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
  if (error) return (
    <div className="text-red-600 p-4 rounded-md bg-red-50">
      <p>Unable to load profile. Please try again later.</p>
      <p className="mt-2 text-sm">{error}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer p-6"
        >
          <div className="space-y-4">
            <div className="pt-2  border-gray-200">
              <p className="text-sm text-gray-600">Gender</p>
              <p className="text-sm font-medium text-gray-900">
                {profile.gender || 'Not specified'}
              </p>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600">Member Type</p>
              <p className="text-sm font-medium text-gray-900">
                {profile.user_type || 'Not specified'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 