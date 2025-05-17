-- Enable RLS on investments table
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view investments
CREATE POLICY "Allow authenticated users to view investments"
ON investments
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert investments
CREATE POLICY "Allow authenticated users to insert investments"
ON investments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update investments
CREATE POLICY "Allow authenticated users to update investments"
ON investments
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete investments
CREATE POLICY "Allow authenticated users to delete investments"
ON investments
FOR DELETE
TO authenticated
USING (true); 