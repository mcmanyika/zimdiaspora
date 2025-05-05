"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ProfileView() {
  const [profiles, setProfiles] = useState([]);
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          gender: editingProfile.gender,
          date_of_birth: editingProfile.date_of_birth,
          country: editingProfile.country,
          occupation: editingProfile.occupation,
          professional_skills: editingProfile.professional_skills,
          phone_number: editingProfile.phone_number,
        })
        .eq('id', editingProfile.id);

      if (error) throw error;

      setProfiles(profiles.map(p => 
        p.id === editingProfile.id ? editingProfile : p
      ));
      setIsModalOpen(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.message || 'An unexpected error occurred');
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <>
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
        theme="light"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer p-6"
            onClick={() => handleEdit(profile)}
          >
            <div className="space-y-4">
              <div className="pt-2">
                <p className="text-sm text-gray-600">Gender</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.gender || 'Not specified'}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.date_of_birth || 'Not specified'}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">Country</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.country || 'Not specified'}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">Occupation</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.occupation || 'Not specified'}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">Professional Skills</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.professional_skills || 'Not specified'}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.phone_number || 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && editingProfile && (
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity ${isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className={`fixed inset-y-0 right-0 h-screen bg-white transform transition-transform duration-300 ease-in-out ${
              isModalOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{ width: windowWidth > 600 ? '50%' : '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="h-full flex flex-col p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Profile</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSave} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <input
                      type="text"
                      name="gender"
                      value={editingProfile?.gender || ''}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={editingProfile?.date_of_birth || ''}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={editingProfile?.country || ''}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={editingProfile?.occupation || ''}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Professional Skills</label>
                    <textarea
                      name="professional_skills"
                      value={editingProfile?.professional_skills || ''}
                      onChange={handleInputChange}
                      rows="3"
                      className="block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={editingProfile?.phone_number || ''}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    />
                  </div>
                </form>
                <div className="flex justify-end space-x-2 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 