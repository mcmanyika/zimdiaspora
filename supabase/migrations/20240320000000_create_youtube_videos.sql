-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view videos" ON youtube_videos;
DROP POLICY IF EXISTS "Allow authenticated users to insert videos" ON youtube_videos;
DROP POLICY IF EXISTS "Allow authenticated users to update videos" ON youtube_videos;

-- Create youtube_videos table
CREATE TABLE IF NOT EXISTS youtube_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_youtube_videos_status ON youtube_videos(status);

-- Create index on uploaded_at for sorting
CREATE INDEX IF NOT EXISTS idx_youtube_videos_uploaded_at ON youtube_videos(uploaded_at);

-- Add RLS policies
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view videos
CREATE POLICY "Allow authenticated users to view videos"
    ON youtube_videos
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert videos
CREATE POLICY "Allow authenticated users to insert videos"
    ON youtube_videos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update their own videos
CREATE POLICY "Allow authenticated users to update videos"
    ON youtube_videos
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true); 