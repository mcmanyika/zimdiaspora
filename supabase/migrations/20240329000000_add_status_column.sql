-- Add status column with COMPLETED as default if it doesn't exist
DO $$ 
BEGIN
    -- Check if status column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'investments' 
        AND column_name = 'status'
    ) THEN
        -- Add status column if it doesn't exist
        ALTER TABLE investments 
        ADD COLUMN status TEXT NOT NULL DEFAULT 'COMPLETED';
    END IF;

    -- Add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'investments' 
        AND constraint_name = 'valid_status'
    ) THEN
        ALTER TABLE investments
        ADD CONSTRAINT valid_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'));
    END IF;
END $$;

-- Create index for status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'investments'
        AND indexname = 'idx_investments_status'
    ) THEN
        CREATE INDEX idx_investments_status ON investments(status);
    END IF;
END $$; 