import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase/config';
import ProposalCard from './ProposalCard';
import ProposalStatusBadge from './ProposalStatusBadge';
import ProposalDetailModal from './ProposalDetailModal';
import StatusButton from './StatusButton';
import LinearProgress from '@mui/material/LinearProgress';
import InvestmentModal from './InvestmentModal';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../../lib/stripe/stripeClient';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';

export default function ProposalList({ showInvestButton = true }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 768; // Define mobile breakpoint
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [selectedInvestmentProposal, setSelectedInvestmentProposal] = useState(null);
  const [user, setUser] = useState(null);
  const supabase = createClientComponentClient();

  const handleSort = (field) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it with default desc direction
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedProposals = [...proposals].sort((a, b) => {
    let compareA = a[sortField];
    let compareB = b[sortField];

    // Handle special cases for date and number fields
    if (sortField === 'deadline') {
      compareA = new Date(compareA);
      compareB = new Date(compareB);
    } else if (sortField === 'budget') {
      compareA = Number(compareA);
      compareB = Number(compareB);
    }

    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);  // Ensure loading state is set before fetch
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Response data:', data);
        console.log('Number of proposals:', data?.length || 0);
        console.log('Proposal data structure:', data[0]);
        
        if (!data || data.length === 0) {
          console.log('No proposals found in the database');
        }
        
        setProposals(data || []);
      } catch (err) {
        console.error('Error fetching proposals:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  const handleInvestClick = async (proposal, e) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to invest');
      return;
    }

    if (proposal.status !== 'active') {
      toast.error('This proposal is not currently accepting investments');
      return;
    }

    setSelectedInvestmentProposal(proposal);
    setShowInvestmentModal(true);
    toast.info('Enter your investment amount and card details');
  };

  const handleInvestmentSubmit = async (investmentData) => {
    try {
      if (!user) {
        toast.error('Please sign in to invest');
        return;
      }

      toast.info('Processing your investment...');

      // Get user's profile for the investment record
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

      // Create investment record with schema-compliant fields
      const { data: investment, error: investmentError } = await supabase
        .from('investments')
        .insert([
          {
            investor_id: user.id,
            proposal_id: selectedInvestmentProposal.id,
            amount: investmentData.amount,
            status: 'PENDING',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (investmentError) {
        console.error('Error creating investment:', investmentError);
        throw new Error(`Failed to create investment record: ${investmentError.message}`);
      }

      toast.info('Creating payment intent...');

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: investmentData.amount,
          proposalId: selectedInvestmentProposal.id,
          investmentId: investment.id,
          investorName: profile?.full_name || 'Anonymous Investor',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Payment intent creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to initialize payment: ${errorData.message || response.statusText}`);
      }

      const { clientSecret } = await response.json();

      toast.info('Updating investment record...');

      // Update investment with payment intent ID
      const { error: updateError } = await supabase
        .from('investments')
        .update({ 
          stripe_payment_intent_id: clientSecret,
          updated_at: new Date().toISOString()
        })
        .eq('id', investment.id);

      if (updateError) {
        console.error('Error updating investment:', updateError);
        throw new Error(`Failed to update investment record: ${updateError.message}`);
      }

      setShowInvestmentModal(false);
      setSelectedInvestmentProposal(null);
      
      // Show detailed success message
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(investmentData.amount);
      
      toast.success(
        `Investment of ${formattedAmount} in "${selectedInvestmentProposal.title}" initiated successfully! Processing your payment...`
      );
      
    } catch (err) {
      console.error('Error submitting investment:', {
        message: err.message,
        stack: err.stack,
        error: err
      });
      
      // Show more detailed error message to user
      const errorMessage = err.message || 'An unexpected error occurred';
      toast.error(`Investment failed: ${errorMessage}`);
      
      // If there's a specific error about the payment intent, show a more helpful message
      if (errorMessage.includes('payment intent')) {
        toast.error('Please try again or contact support if the problem persists');
      }
    }
  };

  if (loading) return <div>Loading proposals...</div>;
  if (error) return (
    <div className="text-red-600 p-4 rounded-md bg-red-50">
      Unable to load proposals. Please try again later.
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-2 text-sm">{error.toString()}</pre>
      )}
    </div>
  );

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full bg-white shadow rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('title')}>
              Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            {!isMobile && (
              <th className="px-6 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}>
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            )}
            <th className="px-6 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('budget')}>
              Target Amount {sortField === 'budget' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-6 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount_raised')}>
              Raised Amount {sortField === 'amount_raised' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-6 p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedProposals.map((proposal) => (
            <tr key={proposal.id} 
                className="hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                onClick={() => setSelectedProposal(proposal)}>
              <td className="px-6 py-4 p-2 whitespace-nowrap cursor-pointer text-gray-900"
                  onClick={() => setSelectedProposal(proposal)}>
                {proposal.title.charAt(0).toUpperCase() + proposal.title.slice(1).toLowerCase()}
              </td>
              {!isMobile && (
                <td className="px-6 py-4 whitespace-nowrap cursor-pointer text-gray-900"
                    onClick={() => setSelectedProposal(proposal)}>
                  <ProposalStatusBadge status={proposal.status} />
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap cursor-pointer text-gray-900"
                  onClick={() => setSelectedProposal(proposal)}>
                USD {proposal.budget?.toLocaleString() || '0'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap p-2 cursor-pointer"
                  onClick={() => setSelectedProposal(proposal)}>
                <div className="w-full max-w-xs">
                  <div className="flex items-center gap-2">
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((proposal.amount_raised / proposal.budget) * 100 || 0, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        flexGrow: 1,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#00D48A'
                        },
                        backgroundColor: '#f3f4f6'
                      }}
                    />
                    <span className="text-sm ml-2 whitespace-nowrap text-gray-900">
                      {Math.round((proposal.amount_raised / proposal.budget) * 100) || 0}% Funded
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap items-center justify-center">
                {showInvestButton && proposal.status === 'active' && (
                  <button
                    onClick={(e) => handleInvestClick(proposal, e)}
                    className="px-4 py-1 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Invest
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedProposal && (
        <ProposalDetailModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
        />
      )}

      {showInvestmentModal && selectedInvestmentProposal && (
        <Elements stripe={stripePromise}>
          <InvestmentModal
            proposal={selectedInvestmentProposal}
            onClose={() => {
              setShowInvestmentModal(false);
              setSelectedInvestmentProposal(null);
            }}
            onSubmit={handleInvestmentSubmit}
          />
        </Elements>
      )}
    </div>
  );
} 