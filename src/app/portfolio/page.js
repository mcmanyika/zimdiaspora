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
        recentInvestments: [],
        investmentHistory: {}
    });

    const supabase = createClientComponentClient();

    useEffect(() => {
        async function fetchDashboardData() {
            setIsLoading(true);
            try {
                // Fetch recent investments
                const { data: recentInvestments, error: investmentsError } = await supabase
                    .from('investments')
                    .select(`
                        *,
                        proposal:proposals(title),
                        investor:profiles(full_name)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (investmentsError) throw investmentsError;

                // Fetch investment history per proposal
                const { data: proposals, error: proposalsError } = await supabase
                    .from('proposals')
                    .select(`
                        id,
                        title,
                        investments(
                            amount,
                            status,
                            created_at,
                            investor_id
                        )
                    `);

                if (proposalsError) throw proposalsError;

                // Calculate investment history per proposal, only for proposals with investments
                const investmentHistory = proposals.reduce((acc, proposal) => {
                    // Only include proposals that have investments
                    if (proposal.investments && proposal.investments.length > 0) {
                        acc[proposal.id] = {
                            title: proposal.title,
                            totalInvested: proposal.investments.reduce((sum, inv) => sum + inv.amount, 0),
                            investmentCount: proposal.investments.length,
                            investments: proposal.investments
                        };
                    }
                    return acc;
                }, {});

                setDashboardData(prev => ({
                    ...prev,
                    recentInvestments,
                    investmentHistory
                }));

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
                {/* Recent Investments Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Recent Investments</h2>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {dashboardData.recentInvestments.map((investment) => (
                                    <tr key={investment.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{investment.investor?.full_name || 'Anonymous'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{investment.proposal?.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">${investment.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                investment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                investment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {investment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(investment.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Investment History per Proposal */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Investment History per Proposal</h2>
                    {Object.keys(dashboardData.investmentHistory).length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <p className="text-gray-500">No investment history available.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(dashboardData.investmentHistory).map(([proposalId, data]) => (
                                <div key={proposalId} className="bg-white rounded-lg shadow p-4">
                                    <h3 className="font-semibold mb-2">{data.title}</h3>
                                    <p className="text-sm text-gray-600">Total Invested: ${data.totalInvested.toLocaleString()}</p>
                                    <p className="text-sm text-gray-600">Investment Count: {data.investmentCount}</p>
                                    <div className="mt-2">
                                        <h4 className="text-sm font-medium mb-1">Recent Investments:</h4>
                                        <ul className="text-sm text-gray-600">
                                            {data.investments.slice(0, 3).map((inv, index) => (
                                                <li key={index}>
                                                    ${inv.amount.toLocaleString()} - {new Date(inv.created_at).toLocaleDateString()}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Admin>
    );
}
export default withAuth(Dashboard);