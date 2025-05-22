'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';
import convertToSubcurrency from '../../../lib/convertToSubcurrency';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from '../../../components/checkout';

import Admin from '../../../components/layout/Admin';

if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === undefined) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not defined");
}
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);


export default function CheckoutPageWrapper({ params }) {
  const router = useRouter();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState(null);
  const [investorId, setInvestorId] = useState(null);
  const supabase = createClientComponentClient();
  const proposalId = use(params).proposalId;
  
  const amount = 1;
  const options = {
    mode: 'payment',
    currency: 'usd',
    amount: amount,
  };

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            proposalId,
          }),
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast.error('Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [amount, proposalId]);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please sign in to invest');
          router.push('/login');
          return;
        }
        setInvestorId(user.id);

        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', proposalId)
          .single();

        if (error) throw error;
        if (!data) {
          toast.error('Proposal not found');
          router.push('/');
          return;
        }

        if (data.status !== 'active') {
          toast.error('This proposal is not currently accepting investments');
          router.push('/');
          return;
        }

        setProposal(data);
      } catch (error) {
        console.error('Error fetching proposal:', error);
        toast.error('Failed to load proposal');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [proposalId, router, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  return (
    <Admin>
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column - Proposal details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
                <p className="mt-2 text-gray-600">{proposal.description}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Investment Details</h2>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Status</dt>
                    <dd className="font-medium text-gray-900">{proposal.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Created</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Right column - Checkout form */}
            <div className="bg-white rounded-lg">
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm clientSecret={clientSecret} proposalId={proposalId} investorId={investorId} amount={amount} />
                </Elements>
              ) : (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </Admin>
  );
} 