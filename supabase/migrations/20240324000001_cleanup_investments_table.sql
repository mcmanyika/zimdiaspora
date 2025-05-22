-- First, migrate any data from stripe_payment_intent_id to transaction_id if transaction_id is null
UPDATE investments 
SET transaction_id = stripe_payment_intent_id 
WHERE transaction_id IS NULL AND stripe_payment_intent_id IS NOT NULL;

-- Drop the redundant stripe_payment_intent_id column
ALTER TABLE investments DROP COLUMN stripe_payment_intent_id;

-- Rename transaction_id to payment_id for clarity
ALTER TABLE investments RENAME COLUMN transaction_id TO payment_id; 