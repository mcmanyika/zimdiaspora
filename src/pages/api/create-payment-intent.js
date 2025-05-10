import Stripe from 'stripe';
import { supabase } from '../../lib/supabase/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { amount, proposalId } = req.body;

    // Create a PaymentIntent with the specified amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        proposalId,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Error creating payment intent' });
  }
} 