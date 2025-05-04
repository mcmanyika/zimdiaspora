'use client';
import React, { useState } from 'react';
import SmallLayout from '../../components/layout/SmallLayout';
import { createClient } from '@supabase/supabase-js';
import { ToastContainer, toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import 'react-toastify/dist/ReactToastify.css';
import withAuth from '../../utils/withAuth';
import { useRouter } from 'next/navigation';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function UploadProfile() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    gender: '',
    user_type: 'member',
    status: 'verified'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: uuidv4(), // Generate a new UUID for each profile
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            gender: formData.gender,
            user_type: formData.user_type,
            status: formData.status,
            updated_at: new Date()
          }
        ]);

      if (error) throw error;

      toast.success('Profile uploaded successfully!');
      setFormData({
        email: '',
        gender: '',
        user_type: 'member',
        status: 'verified'
      });
      
      // Add redirect after successful upload
      router.push('/');
      
    } catch (error) {
      console.error('Error uploading profile:', error);
      toast.error('Failed to upload profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SmallLayout>
      <>
        <h1 className="text-2xl font-bold mb-6">Upload Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4 w-[600px]">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">User Type</label>
            <select
              name="user_type"
              value={formData.user_type}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="member">Member</option>
              <option value="super_user">Super User</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Uploading...' : 'Upload Profile'}
          </button>
        </form>
      </>
    </SmallLayout>
  );
}

export default UploadProfile;