-- First, update any existing PENDING records to COMPLETED
UPDATE investments
SET status = 'COMPLETED'
WHERE status = 'PENDING';

-- Then modify the status column to only allow the new values
ALTER TABLE investments
DROP CONSTRAINT IF EXISTS investments_status_check;

ALTER TABLE investments
ADD CONSTRAINT investments_status_check
CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')); 