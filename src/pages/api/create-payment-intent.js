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
    // Log the incoming request
    console.log('Received payment intent request:', {
      body: req.body,
      headers: req.headers
    });

    const { amount, proposalId, currency = 'usd' } = req.body;

    // Validate input parameters
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error('Invalid amount:', amount);
      return res.status(400).json({ 
        message: 'Invalid amount provided',
        details: { amount }
      });
    }

    if (!proposalId) {
      console.error('Missing proposalId');
      return res.status(400).json({ 
        message: 'Missing proposalId',
        details: { proposalId }
      });
    }

    // Validate currency
    const validCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud'];
    const normalizedCurrency = currency.toLowerCase();
    if (!validCurrencies.includes(normalizedCurrency)) {
      console.error('Invalid currency:', currency);
      return res.status(400).json({ 
        message: 'Invalid currency provided',
        details: { 
          currency,
          supportedCurrencies: validCurrencies 
        }
      });
    }

    console.log('Creating payment intent with params:', {
      amount,
      currency: normalizedCurrency,
      proposalId
    });

    // Create a PaymentIntent with the specified amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd', // Always use USD
      metadata: {
        proposalId,
      },
      payment_method_types: ['card'],
      capture_method: 'automatic',
      confirm: false,
      setup_future_usage: 'off_session',
    });

    console.log('Payment intent created successfully:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    // Return both the client secret and payment intent ID
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    // Enhanced error logging
    console.error('Error creating payment intent:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
      raw: error
    });

    // Return a more detailed error response
    return res.status(500).json({ 
      message: 'Error creating payment intent',
      error: {
        message: error.message,
        type: error.type,
        code: error.code
      },
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 