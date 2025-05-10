'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Admin from '../../../components/layout/Admin';
import { toast } from 'react-toastify';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const investmentId = searchParams.get('investmentId');
        const proposalId = searchParams.get('proposalId');

        if (!investmentId || !proposalId) {
          throw new Error('Missing payment information');
        }

        // Fetch investment and proposal details
        const { data: investment, error: investmentError } = await supabase
          .from('investments')
          .select(`
            *,
            proposal:proposals(title),
            investor:profiles(full_name)
          `)
          .eq('id', investmentId)
          .single();

        if (investmentError) throw investmentError;

        setPaymentDetails(investment);
        toast.success('Payment processed successfully!');
      } catch (error) {
        console.error('Error fetching payment details:', error);
        toast.error('Error loading payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [searchParams, supabase]);

  if (loading) {
    return (
      <Admin>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </Admin>
    );
  }

  return (
    <Admin>
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Thank you for your investment</p>
          </div>

          {paymentDetails && (
            <div className="space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Project</dt>
                    <dd className="text-gray-900 font-medium">{paymentDetails.proposal?.title}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Amount</dt>
                    <dd className="text-gray-900 font-medium">
                      ${paymentDetails.amount?.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Date</dt>
                    <dd className="text-gray-900 font-medium">
                      {new Date(paymentDetails.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Transaction ID</dt>
                    <dd className="text-gray-900 font-medium">{paymentDetails.transaction_id}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <a
              href="/portfolio"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              Return to Portfolio
            </a>
          </div>
        </div>
      </div>
    </Admin>
  );
} 