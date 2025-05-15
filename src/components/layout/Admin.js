'use client';

import React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useRouter } from 'next/navigation';
import Header from './Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Admin({ children }) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profiles, setProfiles] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email);
            
          if (error) throw error;
          
          if (!data || data.length === 0) {
            router.push('/upload');
            return;
          }

          if (!data[0].gender) {
            router.push('/upload');
            return;
          }
          
          setProfiles(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'An unexpected error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center text-red-500">
      {error}
    </div>;
  }

  if (!profiles) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <ToastContainer
        position="top-right"
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
      {/* Sidebar */}
      <aside className="group fixed md:static left-0 bottom-0 md:top-0 h-16 md:h-screen w-full md:w-16 hover:md:w-64 transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-t md:border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-around md:justify-center">
          <Sidebar />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0 w-full transition-all duration-300 ease-in-out">
        <Header />
        <div className="overflow-auto h-[calc(100vh-4rem)]">
          {children}
          <footer className="bg-white dark:bg-gray-800 text-center text-sm p-4 border-t border-gray-200 dark:border-gray-700">
          <p>
            &copy; {new Date().getFullYear()} All rights reserved. System Developed by <a href="https://smartlearner.co.zw" className="text-blue-500 hover:text-blue-600" target="_blank" rel="noopener noreferrer">P.Manyika</a>
          </p>
        </footer>
        </div>
        
      </main>
    </div>
  )
}

export default Admin