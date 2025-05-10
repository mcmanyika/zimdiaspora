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

    setSelectedInvestmentProposal(proposal);
    setShowInvestmentModal(true);
  };

  const handleInvestmentSubmit = async (investmentData) => {
    try {
      if (!user) {
        toast.error('Please sign in to invest');
        return;
      }

      // Create investment record
      const { data: investment, error: investmentError } = await supabase
        .from('investments')
        .insert([
          {
            investor_id: user.id,
            proposal_id: selectedInvestmentProposal.id,
            amount: investmentData.amount,
            status: 'PENDING',
          }
        ])
        .select()
        .single();

      if (investmentError) throw investmentError;

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: investmentData.amount,
          proposalId: selectedInvestmentProposal.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Update investment with payment intent ID
      const { error: updateError } = await supabase
        .from('investments')
        .update({ stripe_payment_intent_id: clientSecret })
        .eq('id', investment.id);

      if (updateError) throw updateError;

      setShowInvestmentModal(false);
      setSelectedInvestmentProposal(null);
      toast.success('Investment initiated successfully');
      
    } catch (err) {
      console.error('Error submitting investment:', err);
      toast.error('Failed to process investment');
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