'use client';
import React, { useState, useEffect } from 'react';
import SmallLayout from '../../components/layout/SmallLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ToastContainer, toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import 'react-toastify/dist/ReactToastify.css';
import withAuth from '../../utils/withAuth';
import { useRouter } from 'next/navigation';

function UploadProfile() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState({
    gender: '',
    dateOfBirth: '',
    phoneNumber: '',
    country: '',
    occupation: '',
    professionalSkills: ''
  });
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, redirecting to login...');
        router.push('/login');
        return;
      }
      console.log('Session found:', session.user.id);
      setUserEmail(session.user.email);
      setCheckingSession(false);
    };
    checkSession();
  }, [router, supabase]);

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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      
      if (!session) {
        console.error('No session found');
        throw new Error('No session found - please log in again');
      }

      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select()
        .eq('id', session.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', fetchError);
        throw fetchError;
      }

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update({
            full_name: session.user.display_name,
            email: session.user.email,
            gender: formData.gender,
            date_of_birth: formData.dateOfBirth,
            phone_number: formData.phoneNumber,
            country: formData.country,
            occupation: formData.occupation,
            professional_skills: formData.professionalSkills,
            updated_at: new Date()
          })
          .eq('id', session.user.id)
          .select();
      } else {
        // Insert new profile
        result = await supabase
          .from('profiles')
          .insert([
            {
              id: session.user.id,
              full_name: session.user.display_name,
              email: session.user.email,
              gender: formData.gender,
              date_of_birth: formData.dateOfBirth,
              phone_number: formData.phoneNumber,
              country: formData.country,
              occupation: formData.occupation,
              professional_skills: formData.professionalSkills,
              created_at: new Date()
            }
          ])
          .select();
      }

      if (result.error) {
        console.error('Supabase operation error:', JSON.stringify(result.error, null, 2));
        throw result.error;
      }

      console.log('Operation successful, data:', result.data);
      toast.success(existingProfile ? 'Profile updated successfully!' : 'Profile created successfully!');
      setFormData({
        gender: '',
        dateOfBirth: '',
        phoneNumber: '',
        country: '',
        occupation: '',
        professionalSkills: ''
      });
      
      router.push('/');
      
    } catch (error) {
      console.error('Error handling profile:', error);
      let errorMessage = 'An unexpected error occurred';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error('Failed to handle profile: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SmallLayout>
      <>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <h1 className="text-2xl font-bold mb-6">Personal Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4 w-[600px]">
         
          <div>
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
            </select>
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block mb-2">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Phone Number"
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Country"
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleInputChange}
              placeholder="Occupation"
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <textarea
              name="professionalSkills"
              value={formData.professionalSkills}
              onChange={handleInputChange}
              placeholder="Professional Skills (separate with commas)"
              className="w-full p-2 border rounded-md"
              rows="3"
              required
            />
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

export default withAuth(UploadProfile);