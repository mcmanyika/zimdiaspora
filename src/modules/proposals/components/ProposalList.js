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
import { useRouter } from 'next/navigation';

export default function ProposalList({ showInvestButton = true, category = null, showOnlyInvested = false, userId = null }) {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMembershipPayment, setHasMembershipPayment] = useState(false);
  const proposalsPerPage = 5;
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Format currency based on user's locale
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

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

  const sortedProposals = [...proposals]
    .filter(proposal => proposal.status === 'active')
    .sort((a, b) => {
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

  // Calculate pagination
  const indexOfLastProposal = currentPage * proposalsPerPage;
  const indexOfFirstProposal = indexOfLastProposal - proposalsPerPage;
  const currentProposals = sortedProposals.slice(indexOfFirstProposal, indexOfLastProposal);
  const totalPages = Math.ceil(sortedProposals.length / proposalsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
          .eq('status', 'active');

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching proposals:', error);
          return;
        }

        let filteredProposals = data;

        // Filter for user's investments if requested
        if (showOnlyInvested && userId) {
          filteredProposals = filteredProposals.filter(proposal => 
            proposal.investments.some(inv => 
              inv.investor_id === userId && inv.amount > 0
            )
          );
        }

        // Calculate total raised for each proposal
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
  }, [supabase, category, showOnlyInvested, userId, sortField, sortDirection]);

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
      
      // Check if user has already paid for membership
      if (user) {
        const { data: investments } = await supabase
          .from('investments')
          .select('*')
          .eq('investor_id', user.id)
          .eq('status', 'COMPLETED')
          .eq('proposal_id', proposals.find(p => p.category === 'MEMBERSHIP')?.id);
        
        setHasMembershipPayment(investments && investments.length > 0);
      }
    };
    getUser();
  }, [supabase, proposals]);

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

    router.push(`/checkout/${proposal.id}`);
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

  if (loading) return (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
  if (error) return (
    <div className="text-red-600 p-4 rounded-md bg-red-50">
      Unable to load proposals. Please try again later.
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-2 text-sm">{error.toString()}</pre>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {/* Header Row for Sorting */}
      <div className="hidden md:flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('title')}>
          Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div className="text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('budget')}>
          Target Amount {sortField === 'budget' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div className="text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('amount_raised')}>
          Raised Amount {sortField === 'amount_raised' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
      </div>

      {/* Proposal Cards Grid */}
      <div className={`grid grid-cols-1 ${currentProposals.length === 1 ? 'w-full' : 'md:grid-cols-2 lg:grid-cols-2'} gap-6`}>
        {currentProposals.map((proposal) => (
          <div
            key={proposal.id}
            className="bg-white cursor-pointer rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100"
            onClick={() => setSelectedProposal(proposal)}
          >
            <div className="p-2">
              {/* Title */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {proposal.title.charAt(0).toUpperCase() + proposal.title.slice(1).toLowerCase()}
                </h3>
              </div>

              {/* Budget and Raised Amount */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Target Amount</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(proposal.budget || 0, proposal.currency || 'USD')}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Raised</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(proposal.amount_raised || 0, proposal.currency || 'USD')}
                    </span>
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((proposal.amount_raised / proposal.budget) * 100 || 0, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#00D48A'
                      },
                      backgroundColor: '#f3f4f6'
                    }}
                  />
                  <div className="text-sm text-gray-500 text-right">
                    {Math.round((proposal.amount_raised / proposal.budget) * 100) || 0}% Funded
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {showInvestButton && proposal.status === 'active' && (
                <div className="mt-6">
                  <button
                    onClick={(e) => handleInvestClick(proposal, e)}
                    className="w-full px-4 py-2 bg-cyan-400 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                  >
                    Make Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center space-x-4 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          Previous
        </button>
        <span className="text-gray-600 font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          Next
        </button>
      </div>

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