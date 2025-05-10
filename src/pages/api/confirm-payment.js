import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { paymentIntentId, proposalId } = req.body;

    // Verify the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Get the investment record
    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (investmentError) {
      console.error('Error fetching investment:', investmentError);
      return res.status(500).json({ message: 'Error fetching investment record' });
    }

    // Update investment status
    const { error: updateError } = await supabase
      .from('investments')
      .update({
        status: 'COMPLETED',
        transaction_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', investment.id);

    if (updateError) {
      console.error('Error updating investment:', updateError);
      return res.status(500).json({ message: 'Error updating investment status' });
    }

    // Update proposal's raised amount
    const { error: proposalError } = await supabase
      .from('proposals')
      .update({
        raised_amount: investment.amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (proposalError) {
      console.error('Error updating proposal:', proposalError);
      return res.status(500).json({ message: 'Error updating proposal amount' });
    }

    return res.status(200).json({ 
      message: 'Payment confirmed successfully',
      investmentId: investment.id
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({ message: 'Error confirming payment' });
  }
} 