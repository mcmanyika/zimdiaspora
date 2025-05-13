-- First delete all objects in the bucket
DELETE FROM storage.objects WHERE bucket_id = 'project-documents';

-- Then drop the project-documents bucket
DELETE FROM storage.buckets WHERE id = 'project-documents';

-- Also clean up any related policies
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow all storage operations" ON storage.objects; 