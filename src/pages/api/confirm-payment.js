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

    // Get the investment record
    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (investmentError) throw investmentError;

    // Update investment status
    const { error: updateError } = await supabase
      .from('investments')
      .update({ 
        status: 'COMPLETED',
        transaction_id: paymentIntent.id
      })
      .eq('id', investment.id);

    if (updateError) throw updateError;

    // Update proposal's raised amount
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('amount_raised')
      .eq('id', proposalId)
      .single();

    if (proposalError) throw proposalError;

    const newAmount = (proposal.amount_raised || 0) + investment.amount;

    const { error: updateProposalError } = await supabase
      .from('proposals')
      .update({ amount_raised: newAmount })
      .eq('id', proposalId);

    if (updateProposalError) throw updateProposalError;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Error confirming payment' });
  }
} 