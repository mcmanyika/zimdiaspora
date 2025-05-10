import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function PaymentForm({ proposal, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe hasn't been initialized");
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting payment for:', {
        amount: parseFloat(amount),
        proposalId: proposal.id
      });

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          proposalId: proposal.id,
        }),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment Intent Error Details:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText,
          url: response.url
        });
        throw new Error(`Payment failed: ${response.statusText}. Status: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
        console.log('Payment Intent created successfully');
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError);
        throw new Error('Failed to parse API response');
      }

      if (!data?.clientSecret) {
        console.error('Invalid response data:', data);
        throw new Error('Invalid response from server');
      }

      // Confirm payment
      console.log('Confirming card payment...');
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        console.error('Stripe Confirmation Error:', result.error);
        setError(result.error.message);
      } else {
        console.log('Payment successful:', result.paymentIntent);
        onSuccess(result.paymentIntent);
      }
    } catch (err) {
      console.error('Payment Form Error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Investment Amount (USD)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          min="1"
          required
        />
      </div>
      
      <div className="p-4 border rounded-md">
        <CardElement />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-gray-200 text-black py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Invest Now'}
      </button>
    </form>
  );
} 