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
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          // Fetch profiles
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email);
            
          if (profileError) throw profileError;
          setProfiles(profileData);

          // Fetch countries
          const { data: countryData, error: countryError } = await supabase
            .from('countries')
            .select('*')
            .order('name');
            
          if (countryError) throw countryError;
          setCountries(countryData);
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
        theme="dark"
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">View and manage your profile information</p>
        </div>
        
        <div className="space-y-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden"
              onClick={() => handleEdit(profile)}
            >
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Gender</p>
                          <p className="mt-1 text-base text-gray-900 capitalize">
                            {profile.gender || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                          <p className="mt-1 text-base text-gray-900">
                            {profile.date_of_birth || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Country</p>
                          <p className="mt-1 text-base text-gray-900">
                            {profile.country || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Details</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Occupation</p>
                          <p className="mt-1 text-base text-gray-900">
                            {profile.occupation || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Professional Skills</p>
                          <p className="mt-1 text-base text-gray-900">
                            {profile.professional_skills || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p className="mt-1 text-base text-gray-900">
                            {profile.phone_number || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    className="inline-flex mt-2 items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <input
                      type="text"
                      name="gender"
                      value={editingProfile?.gender || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={editingProfile?.date_of_birth || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      name="country"
                      value={editingProfile?.country || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    >
                      <option value="">Select a country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={editingProfile?.occupation || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Skills</label>
                    <textarea
                      name="professional_skills"
                      value={editingProfile?.professional_skills || ''}
                      onChange={handleInputChange}
                      rows="2"
                      className="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={editingProfile?.phone_number || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 bg-white text-gray-900"
                    />
                  </div>
                </form>
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-700"
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