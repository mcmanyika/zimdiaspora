import { useEffect, useState } from 'react';
import ProposalDetailModal from './ProposalDetailModal';
import InvestmentModal from './InvestmentModal';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../../lib/stripe/stripeClient';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';
import PersonIcon from '@mui/icons-material/Person';

export default function MembershipList({ showInvestButton = true, showOnlyInvested = false, userId = null }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 768;
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [selectedInvestmentProposal, setSelectedInvestmentProposal] = useState(null);
  const [user, setUser] = useState(null);
  const supabase = createClientComponentClient();

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedProposals = [...proposals]
    .filter(proposal => proposal.status === 'active')
    .sort((a, b) => {
      let compareA = a[sortField];
      let compareB = b[sortField];

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
        setLoading(true);
        let query = supabase
          .from('proposals')
          .select(`
            *,
            investments (
              amount,
              investor_id
            )
          `)
          .eq('status', 'active')
          .ilike('title', '%membership%');

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching proposals:', error);
          return;
        }

        let filteredProposals = data;

        if (showOnlyInvested && userId) {
          filteredProposals = data.filter(proposal => 
            proposal.investments.some(inv => 
              inv.investor_id === userId && inv.amount > 0
            )
          );
        }

        const proposalsWithStats = filteredProposals.map(proposal => {
          const totalRaised = proposal.investments.reduce((sum, inv) => sum + inv.amount, 0);
          const investorCount = new Set(proposal.investments.map(inv => inv.investor_id)).size;
          return {
            ...proposal,
            total_raised: totalRaised,
            investor_count: investorCount
          };
        });

        setProposals(proposalsWithStats);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [supabase, showOnlyInvested, userId, sortField, sortDirection]);

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
  };

  const handleInvestmentSubmit = async (investmentData) => {
    try {
      if (!user) {
        toast.error('Please sign in to invest');
        return;
      }

      toast.info('Processing your investment...');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

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
      
      const errorMessage = err.message || 'An unexpected error occurred';
      toast.error(`Investment failed: ${errorMessage}`);
      
      if (errorMessage.includes('payment intent')) {
        toast.error('Please try again or contact support if the problem persists');
      }
    }
  };

  
  return (
    <div>
        {sortedProposals.map((proposal) => (
          <div
            key={proposal.id}
            onClick={() => setSelectedProposal(proposal)}
          >
              {showInvestButton && proposal.status === 'active' && (
                <button
                  onClick={(e) => handleInvestClick(proposal, e)}
                  className="rounded-md p-2 m-2  bg-gray-800 text-white hover:bg-gray-500 transition-colors flex items-center gap-2"
                >
                  <PersonIcon fontSize="small" />
                  Membership Payment
                </button>
              )}
          </div>
        ))}

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