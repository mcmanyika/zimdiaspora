import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('Payment confirmation request received:', {
    method: req.method,
    body: req.body,
    headers: req.headers
  });

  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { paymentIntentId, proposalId } = req.body;

    if (!paymentIntentId || !proposalId) {
      console.error('Missing required parameters:', { paymentIntentId, proposalId });
      return res.status(400).json({ 
        message: 'Missing required parameters',
        details: { paymentIntentId, proposalId }
      });
    }

    console.log('Starting payment confirmation process:', {
      paymentIntentId,
      proposalId
    });

    // Verify the payment intent
    let paymentIntent;
    try {
      console.log('Retrieving payment intent from Stripe:', paymentIntentId);
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log('Payment intent retrieved:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        metadata: paymentIntent.metadata
      });
    } catch (stripeError) {
      console.error('Stripe error:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        stack: stripeError.stack
      });
      return res.status(400).json({ 
        message: 'Error retrieving payment intent',
        error: stripeError.message,
        type: stripeError.type,
        code: stripeError.code
      });
    }

    if (paymentIntent.status !== 'succeeded') {
      console.error('Payment not successful:', {
        status: paymentIntent.status,
        id: paymentIntent.id,
        amount: paymentIntent.amount
      });
      return res.status(400).json({ 
        message: 'Payment not successful',
        status: paymentIntent.status,
        details: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status
        }
      });
    }

    // Get or create the investment record
    let investment;
    try {
      console.log('Fetching investment record for payment intent:', paymentIntentId);
      const { data: existingInvestment, error: fetchError } = await supabase
        .from('investments')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching investment:', {
          error: fetchError,
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint
        });
        return res.status(500).json({ 
          message: 'Error fetching investment record',
          error: fetchError.message,
          details: fetchError
        });
      }

      if (!existingInvestment) {
        console.log('No existing investment found, creating new record');
        // Create new investment record
        const { data: newInvestment, error: createError } = await supabase
          .from('investments')
          .insert({
            proposal_id: proposalId,
            amount: paymentIntent.amount / 100, // Convert from cents to dollars
            status: 'COMPLETED',
            stripe_payment_intent_id: paymentIntentId,
            transaction_id: paymentIntentId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating investment:', {
            error: createError,
            message: createError.message,
            details: createError.details
          });
          return res.status(500).json({ 
            message: 'Error creating investment record',
            error: createError.message,
            details: createError
          });
        }

        investment = newInvestment;
        console.log('New investment record created:', {
          id: investment.id,
          amount: investment.amount,
          status: investment.status
        });
      } else {
        investment = existingInvestment;
        console.log('Existing investment record found:', {
          id: investment.id,
          amount: investment.amount,
          status: investment.status
        });
      }
    } catch (dbError) {
      console.error('Database error:', {
        message: dbError.message,
        stack: dbError.stack
      });
      return res.status(500).json({ 
        message: 'Database error while handling investment',
        error: dbError.message
      });
    }

    // Get current raised amount
    let proposal;
    try {
      console.log('Fetching current proposal raised amount:', proposalId);
      const { data, error: proposalFetchError } = await supabase
        .from('proposals')
        .select('amount_raised')
        .eq('id', proposalId)
        .single();

      if (proposalFetchError) {
        console.error('Error fetching proposal:', {
          error: proposalFetchError,
          message: proposalFetchError.message,
          details: proposalFetchError.details
        });
        return res.status(500).json({ 
          message: 'Error fetching proposal details',
          error: proposalFetchError.message,
          details: proposalFetchError
        });
      }

      proposal = data;
      console.log('Current proposal raised amount:', {
        proposalId,
        currentAmount: proposal.amount_raised
      });
    } catch (proposalError) {
      console.error('Error fetching proposal:', {
        message: proposalError.message,
        stack: proposalError.stack
      });
      return res.status(500).json({ 
        message: 'Error fetching proposal',
        error: proposalError.message
      });
    }

    // Calculate new raised amount
    const currentRaisedAmount = proposal.amount_raised || 0;
    const newRaisedAmount = currentRaisedAmount + investment.amount;

    // Update proposal's raised amount
    try {
      console.log('Updating proposal raised amount:', {
        proposalId,
        oldAmount: currentRaisedAmount,
        newAmount: newRaisedAmount,
        investmentAmount: investment.amount
      });

      const { error: proposalError } = await supabase
        .from('proposals')
        .update({
          amount_raised: newRaisedAmount
        })
        .eq('id', proposalId);

      if (proposalError) {
        console.error('Error updating proposal:', {
          error: proposalError,
          message: proposalError.message,
          details: proposalError.details
        });
        return res.status(500).json({ 
          message: 'Error updating proposal amount',
          error: proposalError.message,
          details: proposalError
        });
      }

      console.log('Proposal raised amount updated successfully');
    } catch (updateError) {
      console.error('Error updating proposal:', {
        message: updateError.message,
        stack: updateError.stack
      });
      return res.status(500).json({ 
        message: 'Error updating proposal',
        error: updateError.message
      });
    }

    console.log('Payment confirmation completed successfully');

    return res.status(200).json({ 
      message: 'Payment confirmed successfully',
      investmentId: investment.id,
      details: {
        amount: investment.amount,
        proposalId,
        paymentIntentId
      }
    });
  } catch (error) {
    console.error('Unexpected error in payment confirmation:', {
      message: error.message,
      stack: error.stack,
      error
    });
    return res.status(500).json({ 
      message: 'Unexpected error in payment confirmation',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 