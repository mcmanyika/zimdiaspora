'use client';

import ProposalList from "../../modules/proposals/components/ProposalList";
import { useState, useEffect } from "react";
import Admin from "../../components/layout/Admin";
import ProposalForm from "../../modules/proposals/components/ProposalForm";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Header from "../../components/layout/Header";
import { withAuth } from '../../utils/withAuth';

function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        investmentsByStatus: {
            active: 0,
            pending: 0,
            inactive: 0
        },
        investmentTotal: 0,
        activeProposals: 0,
        pendingProposals: 0,
        totalProposals: 0,
        recentUpdates: [],
        upcomingEvents: [],
        totalUsers: 0,
        usersByGender: {
            male: 0,
            female: 0
        }
    });

    const supabase = createClientComponentClient();

    useEffect(() => {
        async function fetchDashboardData() {
            setIsLoading(true);
            setError(null);
            try {
                const [
                    { data: proposals },
                    { data: investments },
                    { count: activeProposalCount },
                    { count: pendingProposalCount },
                    { count: totalProposalCount },
                    { data: updates },
                    { data: users }
                ] = await Promise.all([
                    supabase.from('proposals').select('budget, status'),
                    supabase.from('investments').select('amount'),
                    supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                    supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('proposals').select('*', { count: 'exact', head: true }),
                    supabase.from('project_updates').select('*').order('created_at', { ascending: false }).limit(5),
                    supabase.from('profiles').select('*')
                ]);

                // Calculate investments by status
                const investmentsByStatus = proposals?.reduce((acc, proposal) => {
                    const status = proposal.status?.toLowerCase() || 'inactive';
                    acc[status] = (acc[status] || 0) + (proposal.budget || 0);
                    return acc;
                }, { active: 0, pending: 0, inactive: 0 });

                // Count users by gender (only Male and Female)
                const genderCounts = {
                    male: users?.filter(user => user.gender?.toLowerCase() === 'male').length || 0,
                    female: users?.filter(user => user.gender?.toLowerCase() === 'female').length || 0
                };

                setDashboardData({
                    investmentsByStatus,
                    investmentTotal: investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0,
                    activeProposals: activeProposalCount || 0,
                    pendingProposals: pendingProposalCount || 0,
                    totalProposals: totalProposalCount || 0,
                    recentUpdates: updates || [],
                    upcomingEvents: [],
                    totalUsers: users?.length || 0,
                    usersByGender: genderCounts
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError('Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
      <Admin>
      <div className="p-6 relative">

        {/* Proposals List Section */}
        <div className="mt-8">
          <ProposalList showInvestButton={true} />
        </div>

        {/* Sliding Modal */}
        <div 
          className={`fixed top-0 right-0 w-1/2 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isModalOpen ? 'translate-x-0' : 'translate-x-full'
          } z-50`}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">New Proposal</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {/* Add your proposal form here */}
            <div className="proposal-form">
              <ProposalForm />
            </div>
          </div>
        </div>

        {/* Overlay */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsModalOpen(false)}
          />
        )}
      </div>
      </Admin>
    )
  }
  export default withAuth(Dashboard);