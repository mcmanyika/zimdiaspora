import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';

const YouTubeUpload = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClientComponentClient();

  const validateYoutubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!youtubeUrl || !title) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!validateYoutubeUrl(youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a record in the youtube_videos table
      const { data: videoData, error: dbError } = await supabase
        .from('youtube_videos')
        .insert([
          {
            title,
            youtube_url: youtubeUrl,
            status: 'published',
            uploaded_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            file_path: youtubeUrl // Using the YouTube URL as the file path since we're just storing links
          }
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success('Video link added successfully!');
      
      // Reset form
      setYoutubeUrl('');
      setTitle('');
      event.target.reset();
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error('Failed to add video: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter video title"
            required
          />
        </div>

        <div>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter YouTube video URL"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter the full YouTube video URL (e.g., https://www.youtube.com/watch?v=...)
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isSubmitting ? 'Adding...' : 'Add Video'}
        </button>
      </form>
    </div>
  );
};

export default YouTubeUpload; 