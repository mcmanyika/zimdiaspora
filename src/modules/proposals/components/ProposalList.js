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
  const proposalsPerPage = 5;
  const supabase = createClientComponentClient();

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
          filteredProposals = data.filter(proposal => 
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
      <div className="hidden md:grid grid-cols-5 gap-4 bg-gray-50 px-6 py-2 rounded-t-lg">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 p-2 rounded" onClick={() => handleSort('title')}>
          Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        {!isMobile && (
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 p-2 rounded" onClick={() => handleSort('status')}>
            Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
        )}
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 p-2 rounded" onClick={() => handleSort('budget')}>
          Target Amount {sortField === 'budget' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 p-2 rounded" onClick={() => handleSort('amount_raised')}>
          Raised Amount {sortField === 'amount_raised' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider p-2">Action</div>
      </div>

      {/* Proposal Cards */}
      <div className="flex flex-col divide-y divide-gray-200 bg-white shadow rounded-b-lg">
        {currentProposals.map((proposal) => (
          <div
            key={proposal.id}
            className="flex flex-col md:grid md:grid-cols-5 gap-4 items-center hover:bg-gray-100 transition-colors duration-150 cursor-pointer px-6 py-4"
            onClick={() => setSelectedProposal(proposal)}
          >
            {/* Title */}
            <div className="w-full md:w-auto font-semibold text-gray-900" onClick={() => setSelectedProposal(proposal)}>
              {proposal.title.charAt(0).toUpperCase() + proposal.title.slice(1).toLowerCase()}
            </div>
            {/* Status */}
            {!isMobile && (
              <div className="w-full md:w-auto" onClick={() => setSelectedProposal(proposal)}>
                <ProposalStatusBadge status={proposal.status} />
              </div>
            )}
            {/* Target Amount */}
            <div className="w-full md:w-auto text-gray-900" onClick={() => setSelectedProposal(proposal)}>
              {formatCurrency(proposal.budget || 0, proposal.currency || 'USD')}
            </div>
            {/* Raised Amount & Progress */}
            <div className="w-full md:w-auto" onClick={() => setSelectedProposal(proposal)}>
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
                <div className="text-sm text-gray-500 mt-1">
                  {formatCurrency(proposal.amount_raised || 0, proposal.currency || 'USD')} raised
                </div>
              </div>
            </div>
            {/* Action Button */}
            <div className="w-full md:w-auto flex justify-center items-center">
              {showInvestButton && proposal.status === 'active' && (
                <button
                  onClick={(e) => handleInvestClick(proposal, e)}
                  className="px-4 py-1 bg-gray-800 text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Make Payment &gt;&gt;
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center space-x-2 mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-1 rounded ${
            currentPage === 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          Previous
        </button>
        <span className="text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-1 rounded ${
            currentPage === totalPages
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
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