-- First, ensure we have the correct column name
DO $$ 
BEGIN
    -- Check if stripe_payment_intent_id exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'investments' 
        AND column_name = 'stripe_payment_intent_id'
    ) THEN
        -- If it exists, rename it to payment_id
        ALTER TABLE investments RENAME COLUMN stripe_payment_intent_id TO payment_id;
    END IF;
END $$;

-- Update the handle_payment_confirmation function to use payment_id
CREATE OR REPLACE FUNCTION handle_payment_confirmation(
    p_payment_intent_id TEXT,
    p_proposal_id UUID,
    p_investor_id UUID,
    p_amount DECIMAL(10,2)
) RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    -- Insert into transactions table
    INSERT INTO transactions (
        stripe_payment_intent_id,
        amount,
        currency,
        status,
        metadata
    ) VALUES (
        p_payment_intent_id,
        p_amount,
        'usd',
        'succeeded',
        jsonb_build_object(
            'proposal_id', p_proposal_id,
            'investor_id', p_investor_id
        )
    ) RETURNING id INTO v_transaction_id;

    -- Insert into investments table with reference to transaction
    INSERT INTO investments (
        amount,
        proposal_id,
        investor_id,
        payment_id,
        status
    ) VALUES (
        p_amount,
        p_proposal_id,
        p_investor_id,
        p_payment_intent_id,
        'COMPLETED'
    );

    -- Update proposal's raised amount
    PERFORM increment_proposal_investment(p_proposal_id, p_amount);

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql; 