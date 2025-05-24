'use client'
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Admin from "../../components/layout/Admin";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { withAuth } from '../../utils/withAuth'
import ProposalList from "../../modules/proposals/components/ProposalList";
import YouTubeVideo from "./utils/youtube";
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import MembershipList from "../../modules/proposals/components/MembershipList";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CATEGORIES = [
  { name: "REAL ESTATE", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { name: "AGRICULTURE", icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
  { name: "TOURISM", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { name: "ENERGY", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { name: "MANUFACTURING", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
  { name: "MEMBERSHIP", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
];

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedTab") || "REAL ESTATE";
    }
    return "REAL ESTATE";
  });
  const [user, setUser] = useState(null);
  const [proposalData, setProposalData] = useState(null);
  const [showOnlyInvested, setShowOnlyInvested] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userStats, setUserStats] = useState({
    totalInvestment: 0,
    numberOfProjects: 0,
    currentProjectInvestment: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [userInvestments, setUserInvestments] = useState([]);
  const supabase = createClientComponentClient();
  const documentCategories = [
    { 
      id: 'title_deeds', 
      label: 'Title Deeds',
      icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2'
    },
    { 
      id: 'bank_statements', 
      label: 'Bank Statements',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    { 
      id: 'letters', 
      label: 'Letters / Documents',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    }
  ];
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  // Optimized user stats update function
  const updateUserStats = useCallback(async (investments, selectedId) => {
    if (!user || !selectedId) {
      setUserStats({
        totalInvestment: 0,
        numberOfProjects: 0,
        currentProjectInvestment: 0
      });
      return;
    }

    // Calculate totalInvestment and numberOfProjects from investments (all proposals)
    const stats = {
      totalInvestment: 0,
      numberOfProjects: 0,
      currentProjectInvestment: 0
    };

    // Get all successful transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('amount, metadata')
      .eq('status', 'succeeded');

    if (!txError && transactions) {
      // Calculate totalInvestment from transactions
      stats.totalInvestment = transactions
        .filter(tx => tx.metadata?.investor_id === user.id)
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      // Calculate numberOfProjects from unique proposal_ids in transactions
      const uniqueProjects = new Set(
        transactions
          .filter(tx => tx.metadata?.investor_id === user.id)
          .map(tx => tx.metadata?.proposal_id)
      );
      stats.numberOfProjects = uniqueProjects.size;

      // Calculate currentProjectInvestment for selected project
      stats.currentProjectInvestment = transactions
        .filter(tx =>
          tx.metadata?.proposal_id === selectedId &&
          tx.metadata?.investor_id === user.id
        )
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    }

    setUserStats(stats);
  }, [user, supabase]);

  // Improved auth subscription handling
  useEffect(() => {
    let subscription;
    
    const setupAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        const { data } = await supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
        });
        
        subscription = data?.subscription;
      } catch (error) {
        console.error('Auth error:', error);
        setError(error.message);
        toast.error('Authentication error: ' + error.message);
      }
    };

    setupAuth();

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [supabase]);

  // Improved user investments fetching
  useEffect(() => {
    const fetchUserInvestments = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data: investments, error } = await supabase
          .from('investments')
          .select(`amount, proposal_id, status, proposals ( id, title, category, budget, amount_raised )`)
          .eq('investor_id', user.id)
          .eq('status', 'COMPLETED');

        if (error) {
          throw error;
        }

        if (!investments) {
          setUserInvestments([]);
          return;
        }

        setUserInvestments(investments);
        await updateUserStats(investments, selectedProjectId);
      } catch (error) {
        console.error('Error fetching user investments:', error);
        setError(error.message);
        setUserInvestments([]);
        toast.error('Failed to fetch investments: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInvestments();
  }, [user, supabase, selectedProjectId, updateUserStats]);

  // Improved proposal data fetching
  useEffect(() => {
    const fetchProposalData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        if (selectedTab === "MEMBERSHIP") {
          // 1. Get all MEMBERSHIP proposal IDs
          const { data: membershipProposals, error: proposalError } = await supabase
            .from('proposals')
            .select('id, budget, title, amount_raised, category')
            .eq('category', 'MEMBERSHIP');

          if (proposalError) throw proposalError;
          if (!membershipProposals || membershipProposals.length === 0) {
            setProposalData(null);
            return;
          }

          const proposalIds = membershipProposals.map(p => p.id);

          // 2. Fetch all successful transactions for these proposals
          const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('amount, metadata')
            .eq('status', 'succeeded');

          if (transactionsError) throw transactionsError;

          // 3. Filter transactions for membership proposals
          const filtered = transactions.filter(
            tx => proposalIds.includes(tx.metadata?.proposal_id)
          );

          // 4. Count unique investors and sum amounts
          const uniqueInvestors = new Set(filtered.map(tx => tx.metadata?.investor_id)).size;
          const totalRaised = filtered.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
          const totalBudget = membershipProposals.reduce((sum, p) => sum + (p.budget || 0), 0);

          setProposalData({
            // Use the first proposal for title/category, but override budget/amount_raised/investor_count
            ...membershipProposals[0],
            budget: totalBudget,
            amount_raised: totalRaised,
            investor_count: uniqueInvestors
          });
          return;
        }

        let query = supabase
          .from('proposals')
          .select('id, title, budget, amount_raised, category, investor_count')
          .eq('status', 'active');

        if (selectedProjectId) {
          query = query.eq('id', selectedProjectId);
        } else {
          query = query
            .eq('category', selectedTab)
            .order('created_at', { ascending: false })
            .limit(1);
        }

        const { data: proposal, error: proposalError } = await query;

        if (proposalError) {
          throw proposalError;
        }

        if (!proposal || proposal.length === 0) {
          setProposalData(null);
          return;
        }

        // Fetch all successful transactions for this proposal
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('amount, metadata')
          .eq('status', 'succeeded');

        if (transactionsError) {
          throw transactionsError;
        }

        // Filter transactions for the current proposal
        const filtered = transactions.filter(
          tx => tx.metadata?.proposal_id === proposal[0].id
        );

        // Calculate capital raised
        const capitalRaised = filtered.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        // Calculate unique investors
        const uniqueInvestors = new Set(filtered.map(tx => tx.metadata?.investor_id)).size;

        setProposalData({
          ...proposal[0],
          amount_raised: capitalRaised,
          investor_count: uniqueInvestors
        });
      } catch (error) {
        console.error('Error fetching proposal data:', error);
        setError(error.message);
        setProposalData(null);
        toast.error('Failed to fetch proposal data: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposalData();
  }, [supabase, selectedTab, user, selectedProjectId]);

  // Improved document fetching
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError(error.message);
        setDocuments([]);
        toast.error('Failed to fetch documents: ' + error.message);
      }
    };

    fetchDocuments();
  }, [user, supabase]);

  // Improved document action handling
  const handleDocumentAction = async (document, action) => {
    try {
      if (action === 'download') {
        const { data, error } = await supabase.storage
          .from('project-documents')
          .download(document.file_path);

        if (error) throw error;

        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = document.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Document downloaded successfully');
      } else if (action === 'view') {
        const { data, error } = await supabase.storage
          .from('project-documents')
          .download(document.file_path);

        if (error) throw error;

        setSelectedDocument({
          ...document,
          data
        });
        toast.success('Document loaded successfully');
      }
    } catch (error) {
      console.error('Error handling document:', error);
      toast.error('Failed to process document: ' + error.message);
    }
  };

  // Improved tab selection handling
  const handleTabSelect = async (tab) => {
    try {
      setIsCategoryLoading(true);
      setSelectedTab(tab);
      setSelectedProjectId(null);
      setProposalData(null);
    } catch (error) {
      console.error('Error switching category:', error);
      setError(error.message);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  // Automatically select the first project in the selected category by default
  useEffect(() => {
    const projectsInCategory = userInvestments
      .map(inv => inv.proposals)
      .filter(proj => proj && proj.category === selectedTab);

    if (projectsInCategory.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projectsInCategory[0].id);
    }
  }, [userInvestments, selectedTab, selectedProjectId]);

  // Improved project selection handling
  const handleProjectSelect = (project) => {
    setSelectedProjectId(project.id);
    setSelectedTab(project.category);
  };

  // Screen size handling
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Component mount handling
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Calculate ownership share percentage with error handling
  const ownershipShare = useMemo(() => {
    try {
      if (!proposalData?.amount_raised || !userStats.currentProjectInvestment) return 0;
      const share = (userStats.currentProjectInvestment / proposalData.amount_raised) * 100;
      return isNaN(share) ? 0 : share.toFixed(1);
    } catch (error) {
      console.error('Error calculating ownership share:', error);
      return 0;
    }
  }, [proposalData?.amount_raised, userStats.currentProjectInvestment]);

  // Helper to get userInvestedProjects with error handling
  const userInvestedProjects = useMemo(() => {
    try {
      return userInvestments
        .map(inv => inv.proposals)
        .filter((proj, idx, arr) => 
          proj && 
          arr.findIndex(p => p.id === proj.id) === idx && 
          proj.category === selectedTab
        );
    } catch (error) {
      console.error('Error calculating invested projects:', error);
      return [];
    }
  }, [userInvestments, selectedTab]);

  useEffect(() => {
    if (selectedTab) {
      localStorage.setItem("selectedTab", selectedTab);
    }
  }, [selectedTab]);

  if (!hasMounted) return null;

  return (
    <Admin>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        
        {/* Error Display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-lg"
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <strong className="font-semibold">Error: </strong>
              <span className="ml-2">{error}</span>
            </div>
            <button 
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
              onClick={() => setError(null)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}

        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 backdrop-blur-sm bg-opacity-90">
            {/* Category Tabs */}
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-8">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {CATEGORIES.map((tab) => (
                  <motion.button
                    key={tab.name}
                    onClick={() => handleTabSelect(tab.name)}
                    disabled={isCategoryLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      selectedTab === tab.name
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                        : "bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg"
                    } ${isCategoryLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isCategoryLoading && selectedTab === tab.name ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="hidden md:block h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                      </svg>
                    )}
                    <span>{tab.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Project Overview */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-8 shadow-inner">
              {/* User Summary */}
              <div className="grid grid-cols-1 gap-6 w-full mb-8">
                <div className="flex flex-col justify-center h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <div className="text-gray-600 mb-3 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">Total Investment</span>
                      </div>
                      <div className="text-3xl font-bold text-gray-800 text-center">
                        ${userStats.totalInvestment.toLocaleString()}
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <div className="text-gray-600 mb-3 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2M7 7h10" />
                        </svg>
                        <span className="font-semibold">Number of Investments</span>
                      </div>
                      <div className="text-3xl font-bold text-gray-800 text-center">
                        {userStats.numberOfProjects}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {userInvestedProjects.length > 0 && (
                <div className="pb-8">
                  <div className="text-sm font-semibold text-gray-700 mb-4 text-center uppercase tracking-wider">
                    Category: {selectedTab}
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-3">
                    {userInvestedProjects.map((project) => (
                      <motion.button
                        key={project.id}
                        onClick={() => handleProjectSelect(project)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full md:flex-1 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                          selectedProjectId === project.id
                            ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg"
                        }`}
                      >
                        {project.title}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 mx-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="text-sm text-white font-semibold tracking-wider">INVESTORS</div>
                  <div className="text-2xl font-bold text-white mt-2">{proposalData?.investor_count || 0}</div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 mx-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-white font-semibold tracking-wider">CAPITAL RAISED</div>
                  <div className="text-2xl font-bold text-white mt-2">
                    ${proposalData?.amount_raised?.toLocaleString() || '0'}
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 mx-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="text-sm text-white font-semibold tracking-wider">REMAINING</div>
                  <div className="text-2xl font-bold text-white mt-2">
                    ${((proposalData?.budget || 0) - (proposalData?.amount_raised || 0)).toLocaleString()}
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 mx-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  <div className="text-sm text-white font-semibold tracking-wider">PROJECT TOTAL</div>
                  <div className="text-2xl font-bold text-white mt-2">
                    ${proposalData?.budget?.toLocaleString() || '0'}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Ownership & Progress */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {proposalData && userStats.currentProjectInvestment > 0 ? (
                <>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex-1 bg-gradient-to-br from-lime-400 to-lime-500 rounded-xl p-8 text-center flex flex-col justify-center items-center min-h-[200px] shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="text-sm text-white font-semibold tracking-wider mb-3">OWNERSHIP SHARE</div>
                    <div className="text-5xl font-bold text-white">
                      {isLoading ? (
                        <div className="animate-pulse bg-white/20 h-16 w-32 mx-auto rounded-lg"></div>
                      ) : (
                        `${ownershipShare}%`
                      )}
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex-1 bg-white rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[200px] shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="text-sm text-gray-500 mb-3">GOAL ${proposalData?.budget?.toLocaleString() || '0'}</div>
                    <div className="flex items-center justify-center mb-4">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-8 mx-0.5 rounded-lg transition-all duration-300 ${
                            i < Math.floor((proposalData?.amount_raised || 0) / (proposalData?.budget || 1) * 10) 
                              ? "bg-gradient-to-b from-blue-600 to-blue-700" 
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-base font-semibold text-gray-700 mb-2">AMOUNT INVESTED</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {isLoading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-32 mx-auto rounded-lg"></div>
                      ) : (
                        `$${userStats.currentProjectInvestment.toLocaleString()}`
                      )}
                    </div>
                  </motion.div>
                </>
              ) : (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex-1 bg-white rounded-xl p-8 text-center flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-lg text-gray-600">
                    {proposalData
                      ? `You haven't invested in ${selectedTab} yet`
                      : `No active project in ${selectedTab} category`}
                  </div>
                </motion.div>
              )}

              {/* Documents */}
              <div className="flex-1 space-y-4">
                {documentCategories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/documents')}
                    className="w-full p-6 rounded-xl bg-white text-gray-700 font-medium text-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                    </svg>
                    {category.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Existing Proposals List Section */}
            {proposalData && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={showOnlyInvested}
                        onChange={(e) => setShowOnlyInvested(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-900">Show only my investments</span>
                    </label>
                  </div>
                </div>
                <ProposalList 
                  showInvestButton={true} 
                  category={selectedTab} 
                  showOnlyInvested={showOnlyInvested}
                  userId={user?.id}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Admin>
  );
};

// Add PropTypes validation
Dashboard.propTypes = {
  // Add any props if needed
};

export default withAuth(Dashboard); 