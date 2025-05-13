-- First, let's check if the bucket exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'project-documents'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('project-documents', 'project-documents', false);
    END IF;
END $$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON storage.objects;

-- Temporarily disable RLS for testing
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create a very permissive policy
CREATE POLICY "Allow all storage operations"
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true); 