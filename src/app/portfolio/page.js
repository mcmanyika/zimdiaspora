'use client';

import ProposalList from "../../modules/proposals/components/ProposalList";
import { useState, useEffect } from "react";
import Admin from "../../components/layout/Admin";
import ProposalForm from "../../modules/proposals/components/ProposalForm";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Header from "../../components/layout/Header";
import { withAuth } from '../../utils/withAuth';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({
        key: 'created_at',
        direction: 'desc'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
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
                    .order('created_at', { ascending: false });

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

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortedInvestments = () => {
        if (!dashboardData.recentInvestments) return [];
        
        return [...dashboardData.recentInvestments].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle nested objects
            if (sortConfig.key === 'investor') {
                aValue = a.investor?.full_name || 'Anonymous';
                bValue = b.investor?.full_name || 'Anonymous';
            } else if (sortConfig.key === 'proposal') {
                aValue = a.proposal?.title || '';
                bValue = b.proposal?.title || '';
            }

            // Handle date comparison
            if (sortConfig.key === 'created_at') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getPaginatedInvestments = () => {
        const sortedInvestments = getSortedInvestments();
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedInvestments.slice(startIndex, startIndex + itemsPerPage);
    };

    const totalPages = Math.ceil((dashboardData.recentInvestments?.length || 0) / itemsPerPage);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const getChartData = () => {
        const history = dashboardData.investmentHistory;
        const labels = Object.values(history).map(data => data.title);
        const data = Object.values(history).map(data => data.totalInvested);
        
        // Generate colors for each segment
        const backgroundColors = labels.map((_, index) => {
            const hue = (index * 137.508) % 360; // Golden angle approximation
            return `hsl(${hue}, 70%, 60%)`;
        });

        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('60%)', '50%)')),
                    borderWidth: 1,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        }
    };

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

                {/* Investment History per Proposal */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Project Investment History</h2>
                    {Object.keys(dashboardData.investmentHistory).length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <p className="text-gray-500">No investment history available.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                                {Object.entries(dashboardData.investmentHistory).map(([proposalId, data]) => (
                                    <div key={proposalId} className="bg-white rounded-lg shadow p-4">
                                        <h3 className="font-semibold mb-2">{data.title}</h3>
                                        <p className="text-sm text-gray-600">Total Invested: ${data.totalInvested.toLocaleString()}</p>
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
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="h-[300px] flex items-center justify-center">
                                    <div className="w-full max-w-[350px]">
                                        <Pie data={getChartData()} options={chartOptions} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Recent Investments Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Recent Investments</h2>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('investor')}
                                    >
                                        Investor {getSortIcon('investor')}
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('proposal')}
                                    >
                                        Proposal {getSortIcon('proposal')}
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('amount')}
                                    >
                                        Amount {getSortIcon('amount')}
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('status')}
                                    >
                                        Status {getSortIcon('status')}
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        Date {getSortIcon('created_at')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getPaginatedInvestments().map((investment) => (
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
                        {/* Pagination Controls */}
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                        currentPage === 1 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                        currentPage === totalPages 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(currentPage * itemsPerPage, dashboardData.recentInvestments?.length || 0)}
                                        </span>{' '}
                                        of <span className="font-medium">{dashboardData.recentInvestments?.length || 0}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                                currentPage === 1 
                                                    ? 'text-gray-300 cursor-not-allowed' 
                                                    : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="sr-only">Previous</span>
                                            ←
                                        </button>
                                        {[...Array(totalPages)].map((_, index) => (
                                            <button
                                                key={index + 1}
                                                onClick={() => handlePageChange(index + 1)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    currentPage === index + 1
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                                currentPage === totalPages 
                                                    ? 'text-gray-300 cursor-not-allowed' 
                                                    : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="sr-only">Next</span>
                                            →
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </Admin>
    );
}
export default withAuth(Dashboard);