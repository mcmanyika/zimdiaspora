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

    // ... existing code ...

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto px-4 py-8">
                {/* Proposals List Section */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">
                        Current Proposals 
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="ml-2 hover:text-blue-600 transition-colors"
                        >
                            [+]
                        </button>
                    </h2>
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
        </div>
    );
}

export default withAuth(Dashboard); 