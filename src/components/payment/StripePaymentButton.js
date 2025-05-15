import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function StripePaymentButton({ amount, proposalId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to make a payment');
        return;
      }

      // Get user profile for additional data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      // Validate required fields
      if (!amount || amount <= 0) {
        toast.error('Invalid payment amount');
        return;
      }

      if (!proposalId) {
        toast.error('Please select a project to invest in');
        return;
      }

      // Verify the proposal exists and is active
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('id, status, title')
        .eq('id', proposalId)
        .single();

      if (proposalError) {
        console.error('Error fetching proposal:', proposalError);
        toast.error('Failed to verify project details');
        return;
      }

      if (!proposal) {
        toast.error('Selected project not found');
        return;
      }

      if (proposal.status !== 'active') {
        toast.error(`Project "${proposal.title}" is not currently accepting investments`);
        return;
      }

      console.log('Creating payment intent with data:', {
        amount,
        proposalId,
        userId: user.id,
        userEmail: profile?.email,
        proposalTitle: proposal.title
      });

      // Create payment intent with additional metadata
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          proposalId,
          metadata: {
            investorId: user.id,
            investorName: profile?.full_name || 'Anonymous',
            investorEmail: profile?.email,
            timestamp: new Date().toISOString(),
            source: 'account_page',
            proposalTitle: proposal.title
          }
        }),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('Payment intent creation failed:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        
        // Handle specific error cases
        if (response.status === 400) {
          throw new Error(responseData.message || 'Invalid payment details');
        } else if (response.status === 500) {
          throw new Error(responseData.error?.message || 'Server error occurred');
        } else {
          throw new Error(responseData.message || 'Failed to create payment intent');
        }
      }

      const { clientSecret } = responseData;

      if (!clientSecret) {
        console.error('Invalid payment intent response:', responseData);
        throw new Error('Invalid response from payment intent creation');
      }

      // Load Stripe
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        clientSecret,
        mode: 'payment',
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment-cancelled`,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', {
        message: error.message,
        error: error
      });
      toast.error(error.message || 'Payment failed. Please try again.', {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
    >
      {loading ? 'Processing...' : 'Pay Now'}
    </button>
  );
} 