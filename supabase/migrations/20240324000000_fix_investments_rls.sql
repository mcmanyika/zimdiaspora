-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view investments" ON investments;
DROP POLICY IF EXISTS "Allow authenticated users to insert investments" ON investments;
DROP POLICY IF EXISTS "Allow authenticated users to update investments" ON investments;
DROP POLICY IF EXISTS "Allow authenticated users to delete investments" ON investments;

-- Enable RLS on investments table
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own investments
CREATE POLICY "Allow users to view their own investments"
ON investments
FOR SELECT
TO authenticated
USING (investor_id = auth.uid());

-- Create policy to allow users to insert their own investments
CREATE POLICY "Allow users to insert their own investments"
ON investments
FOR INSERT
TO authenticated
WITH CHECK (investor_id = auth.uid());

-- Create policy to allow users to update their own investments
CREATE POLICY "Allow users to update their own investments"
ON investments
FOR UPDATE
TO authenticated
USING (investor_id = auth.uid())
WITH CHECK (investor_id = auth.uid());

-- Create policy to allow users to delete their own investments
CREATE POLICY "Allow users to delete their own investments"
ON investments
FOR DELETE
TO authenticated
USING (investor_id = auth.uid()); 