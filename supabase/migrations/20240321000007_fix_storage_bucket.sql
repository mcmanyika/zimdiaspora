-- Temporarily disable RLS for buckets table
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- First ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS for buckets table
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Enable RLS for objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all storage operations" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to access buckets" ON storage.buckets;

-- Create bucket access policy
CREATE POLICY "Allow authenticated users to access buckets"
ON storage.buckets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for authenticated users on objects
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
);

CREATE POLICY "Allow authenticated users to read files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents'
);

CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents'
);

CREATE POLICY "Allow authenticated users to update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-documents'
); 