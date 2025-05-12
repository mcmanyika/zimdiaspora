'use client';
import React from 'react';
import Admin from '../../components/layout/Admin';
import YouTubeUpload from '../../modules/youtube/components/YouTubeUpload';
import VideoList from '../../modules/youtube/components/VideoList';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const YouTubePage = () => {
  return (
    <Admin>
      <div className="p-6 space-y-6">
        <ToastContainer
          position="bottom-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Project Updates</h1>
          
          <div className="grid gap-6">
            {/* <YouTubeUpload /> */}
            <VideoList />
          </div>
        </div>
      </div>
    </Admin>
  );
};

export default YouTubePage; 