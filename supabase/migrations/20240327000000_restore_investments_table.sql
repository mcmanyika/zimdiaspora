-- Drop existing table if it exists
DROP TABLE IF EXISTS investments;

-- Create investments table with original structure
CREATE TABLE investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    payment_id TEXT,
    proposal_id UUID NOT NULL REFERENCES proposals(id),
    investor_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

-- Enable Row Level Security
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow users to view their own investments"
ON investments
FOR SELECT
TO authenticated
USING (investor_id = auth.uid());

CREATE POLICY "Allow users to insert their own investments"
ON investments
FOR INSERT
TO authenticated
WITH CHECK (investor_id = auth.uid());

CREATE POLICY "Allow users to update their own investments"
ON investments
FOR UPDATE
TO authenticated
USING (investor_id = auth.uid())
WITH CHECK (investor_id = auth.uid());

CREATE POLICY "Allow users to delete their own investments"
ON investments
FOR DELETE
TO authenticated
USING (investor_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX idx_investments_investor_id ON investments(investor_id);
CREATE INDEX idx_investments_proposal_id ON investments(proposal_id);
CREATE INDEX idx_investments_payment_id ON investments(payment_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_created_at ON investments(created_at);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_investments_updated_at
    BEFORE UPDATE ON investments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 