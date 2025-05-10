import Stripe from 'stripe';
import { supabase } from '../../lib/supabase/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    // Update the proposal's amount_raised in the database
    const { data, error } = await supabase
      .from('proposals')
      .select('amount_raised')
      .eq('id', proposalId)
      .single();

    if (error) throw error;

    const currentAmount = data.amount_raised || 0;
    const newAmount = currentAmount + (paymentIntent.amount / 100); // Convert from cents

    const { error: updateError } = await supabase
      .from('proposals')
      .update({ amount_raised: newAmount })
      .eq('id', proposalId);

    if (updateError) throw updateError;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Error confirming payment' });
  }
} 