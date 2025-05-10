import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function InvestmentModal({ proposal, onClose, onSubmit }) {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      toast.error('Payment system is not initialized. Please try again.');
      setLoading(false);
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid investment amount');
      setLoading(false);
      return;
    }

    try {
      toast.info('Validating card details...');
      const { error: cardError } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (cardError) {
        console.error('Card validation error:', cardError);
        throw new Error(cardError.message);
      }

      toast.info('Processing payment...');
      const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (paymentError) {
        console.error('Payment error:', paymentError);
        throw new Error(paymentError.message);
      }

      // Confirm payment on the server
      const response = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: clientSecret,
          proposalId: proposal.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to confirm payment');
      }

      const { investmentId } = await response.json();
      
      // Close modal and redirect to success page
      onClose();
      window.location.href = `/payment/success?investmentId=${investmentId}&proposalId=${proposal.id}`;
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
      toast.error(`Payment failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Invest in {proposal.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Investment Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              min="1"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Details
            </label>
            <div className="p-3 border rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50"
              disabled={!stripe || loading}
            >
              {loading ? 'Processing...' : 'Confirm Investment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 