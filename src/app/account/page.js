'use client'
import React, { useState, useEffect, useMemo } from "react";
import Admin from "../../components/layout/Admin";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { withAuth } from '../../utils/withAuth'
import ProposalList from "../../modules/proposals/components/ProposalList";
import YouTubeVideo from "./utils/youtube";
import LaunchTimeline from "../../modules/timeline/components/LaunchTimeline";
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
const CATEGORIES = [
  { name: "REAL ESTATE", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { name: "AGRICULTURE", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { name: "TOURISM", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { name: "ENERGY", icon: "M13 10V3L4 14h7v7l9-11h-7z" }
];

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("REAL ESTATE");
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
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [userInvestments, setUserInvestments] = useState([]);
  const supabase = createClientComponentClient();
  const documentCategories = [
    { id: 'title_deeds', label: 'Title Deeds' },
    { id: 'bank_statements', label: 'Bank Statements' },
    { id: 'letters', label: 'Letters / Documents' }
  ];
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const fetchUserInvestments = async () => {
      if (!user) return;
      try {
        const { data: investments, error } = await supabase
          .from('investments')
          .select(`amount, proposal_id, status, proposals ( id, title, category, budget, amount_raised )`)
          .eq('investor_id', user.id)
          .eq('status', 'COMPLETED');
        if (error) throw error;
        setUserInvestments(investments || []);
      } catch (error) {
        console.error('Error fetching user investments:', error);
      }
    };
    fetchUserInvestments();
  }, [user, supabase]);

  useEffect(() => {
    if (!userInvestments || userInvestments.length === 0) {
      setUserStats({
        totalInvestment: 0,
        numberOfProjects: 0,
        currentProjectInvestment: 0
      });
      return;
    }
    // Unique projects
    const uniqueProjects = userInvestments.reduce((acc, inv) => {
      if (inv.proposals && !acc.find(p => p.id === inv.proposals.id)) {
        acc.push(inv.proposals);
      }
      return acc;
    }, []);
    // Total investment
    const totalInvestment = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    // Number of unique projects
    const numberOfProjects = uniqueProjects.length;
    // Current project investment
    let currentProjectInvestment = 0;
    if (selectedProjectId) {
      currentProjectInvestment = userInvestments
        .filter(inv => inv.proposal_id === selectedProjectId)
        .reduce((sum, inv) => sum + inv.amount, 0);
    }
    setUserStats({
      totalInvestment,
      numberOfProjects,
      currentProjectInvestment
    });
    // Set selected project and tab if not set
    if (!selectedProjectId && uniqueProjects.length > 0) {
      setSelectedProjectId(uniqueProjects[0].id);
      setSelectedTab(uniqueProjects[0].category);
    }
  }, [userInvestments, selectedProjectId]);

  // Helper to get userInvestedProjects for selectedTab
  const userInvestedProjects = useMemo(() => {
    return userInvestments
      .map(inv => inv.proposals)
      .filter((proj, idx, arr) => proj && arr.findIndex(p => p.id === proj.id) === idx && proj.category === selectedTab);
  }, [userInvestments, selectedTab]);

  // Centralize tab/project selection logic
  const handleTabSelect = (tab) => {
    setSelectedTab(tab);
    // Find first project in this tab from all user investments
    const project = userInvestments
      .map(inv => inv.proposals)
      .find(p => p && p.category === tab);
    setSelectedProjectId(project ? project.id : null);
  };
  const handleProjectSelect = (project) => {
    setSelectedProjectId(project.id);
    setSelectedTab(project.category);
  };

  useEffect(() => {
    const fetchProposalData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let query = supabase
          .from('proposals')
          .select('id, title, budget, amount_raised, category')
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
          console.error('Supabase error:', proposalError);
          return;
        }

        if (!proposal || proposal.length === 0) {
          setProposalData(null);
          setIsLoading(false);
          return;
        }

        // Get the actual investor count from investments table
        const { data: investments, error: investmentsError } = await supabase
          .from('investments')
          .select('investor_id')
          .eq('proposal_id', proposal[0].id)
          .eq('status', 'COMPLETED');

        if (investmentsError) {
          console.error('Error fetching investments:', investmentsError);
          return;
        }

        // Calculate unique investors
        const uniqueInvestors = new Set(investments.map(inv => inv.investor_id)).size;

        setProposalData({
          ...proposal[0],
          investor_count: uniqueInvestors
        });
      } catch (error) {
        console.error('Error fetching proposal data:', error.message || error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposalData();
  }, [supabase, selectedTab, user, selectedProjectId]);

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
      }
    };

    fetchDocuments();
  }, [user, supabase]);

  const handleDocumentAction = async (document, action) => {
    try {
      if (action === 'download') {
        const { data, error } = await supabase.storage
          .from('project-documents')
          .download(document.file_path);

        if (error) throw error;

        // Create download link
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = document.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (action === 'view') {
        const { data, error } = await supabase.storage
          .from('project-documents')
          .download(document.file_path);

        if (error) throw error;

        setSelectedDocument({
          ...document,
          data
        });
      }
    } catch (error) {
      console.error('Error handling document:', error);
    }
  };

  // Calculate ownership share percentage
  const ownershipShare = useMemo(() => {
    if (!proposalData?.amount_raised || !userStats.currentProjectInvestment) return 0;
    return ((userStats.currentProjectInvestment / proposalData.amount_raised) * 100).toFixed(1);
  }, [proposalData?.amount_raised, userStats.currentProjectInvestment]);

  useEffect(() => {
    // Add screen size listener
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // 768px is typical mobile breakpoint
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return (
    <Admin>
      <div className="min-h-screen bg-gray-100 py-10 px-2">
        {/* Document Viewer Modal */}
        <AnimatePresence>
          {selectedDocument && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setSelectedDocument(null)}
            >
              <motion.div 
                className="fixed inset-y-0 right-0 w-1/2 min-h-screen bg-white shadow-xl overflow-y-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                style={{ width: isMobile ? '100%' : '50%' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h2 className="text-2xl font-semibold text-gray-900">{selectedDocument.file_name}</h2>
                    <button
                      onClick={() => setSelectedDocument(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4">
                    {selectedDocument.file_type.startsWith('image/') ? (
                      <Image 
                        src={URL.createObjectURL(selectedDocument.data)} 
                        alt={selectedDocument.file_name}
                        className="max-w-full h-auto"
                        width={800}
                        height={600}
                      />
                    ) : (
                      <iframe
                        src={URL.createObjectURL(selectedDocument.data)}
                        className="w-full h-[80vh]"
                        title={selectedDocument.file_name}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl bg-white rounded-xl shadow-lg p-8">
          {/* Category Tabs */}
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-2">
            <div className="flex flex-col md:flex-row gap-2">
              {CATEGORIES.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => handleTabSelect(tab.name)}
                  className={`px-4 sm:px-6 py-2 rounded-md font-semibold text-sm sm:text-base transition cursor-pointer touch-action-manipulation flex items-center gap-2 ${
                    selectedTab === tab.name
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-blue-100 active:bg-blue-200"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.name}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 border-gray-600 text-white hover:bg-gray-800 hover:border-white hover:text-white rounded-md px-4 py-2 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Latest Update
            </button>
          </div>

          {/* Sliding Modal */}
          <div 
            className={`fixed top-0 right-0 h-full ${
              isMobile ? 'w-full' : 'w-1/2'
            } bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
              isModalOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">&nbsp;</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-100space-y-4 overflow-y-auto h-[80vh]">
                <YouTubeVideo />
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
 
         

          {/* Project Overview */}
          <div className="bg-gray-100 w-full  text-gray-800 p-6 mb-6">
             {/* User Summary */}
          <div className="grid grid-cols-1 gap-4 w-full mb-6">
            <div className=" p-6 flex flex-col justify-center h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-2 text-center">
                  <div className="text-gray-600 mb-2 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Total Investment
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    ${userStats.totalInvestment.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-white  p-2 text-center">
                  <div className="text-gray-600 mb-2 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Number of Investments
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {userStats.numberOfProjects}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {userInvestedProjects.length > 0 && (
                <div className="w-full pb-8">
                  <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                   Category: {selectedTab}
                  </h2>
                  <div className="flex flex-wrap justify-center items-center gap-3">
                    {userInvestedProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectSelect(project)}
                        className={`px-6 py-3  text-sm font-medium transition-all duration-200 ${
                          selectedProjectId === project.id
                            ? "bg-gray-800 text-white capitalize shadow-md"
                            : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md"
                        }`}
                      >
                        {project.title}
                      </button>
                    ))}
                    {userInvestedProjects.length === 0 && (
                      <div className="text-gray-500 italic">No investments in this category</div>
                    )}
                  </div>
                </div>
              )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-400 rounded-lg p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 mx-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div className="text-xs text-white">INVESTORS</div>
                <div className="text-xl font-bold text-white">{proposalData?.investor_count || 0}</div>
              </div>
              <div className="bg-purple-400 rounded-lg p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 mx-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-white">CAPITAL RAISED</div>
                <div className="text-xl font-bold text-wrap text-white">
                  ${proposalData?.amount_raised?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-cyan-400 rounded-lg p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 mx-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div className="text-xs text-white">REMAINING</div>
                <div className="text-xl font-bold text-white">
                  ${((proposalData?.budget || 0) - (proposalData?.amount_raised || 0)).toLocaleString()}
                </div>
              </div>
              <div className="bg-orange-400 rounded-lg p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 mx-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <div className="text-xs text-white">PROJECT TOTAL</div>
                <div className="text-xl font-bold text-white">
                  ${proposalData?.budget?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </div>

          {/* Ownership & Progress */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {proposalData && userStats.currentProjectInvestment > 0 ? (
              <>
                <div className="flex-1 bg-lime-300 rounded-lg p-8 text-center flex flex-col justify-center items-center min-h-[200px]">
                  <div className="text-sm text-gray-700 mb-2">OWNERSHIP SHARE</div>
                  <div className="text-4xl font-bold">
                    {isLoading ? (
                      <div className="animate-pulse bg-gray-300 h-12 w-24 mx-auto rounded"></div>
                    ) : (
                      `${ownershipShare}%`
                    )}
                  </div>
                </div>
                <div className="flex-1 bg-gray-100 rounded-lg p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                  <div className="text-xs text-gray-500 mb-2">GOAL ${proposalData?.budget?.toLocaleString() || '0'}</div>
                  <div className="flex items-center justify-center mb-2">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-8 mx-0.5 rounded ${
                          i < Math.floor((proposalData?.amount_raised || 0) / (proposalData?.budget || 1) * 10) 
                            ? "bg-blue-700" 
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-base font-bold">AMOUNT INVESTED</div>
                  <div className="text-xl font-bold text-blue-700">
                    {isLoading ? (
                      <div className="animate-pulse bg-gray-300 h-8 w-32 mx-auto rounded"></div>
                    ) : (
                      `$${userStats.currentProjectInvestment.toLocaleString()}`
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 bg-gray-100 rounded-lg p-8 text-center flex items-center justify-center">
                <div className="text-lg text-gray-600">
                  {proposalData
                    ? `You haven't invested in ${selectedTab} yet`
                    : `No active project in ${selectedTab} category`}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="flex-1 gap-4">
              {documentCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => router.push('/documents')}
                  className="w-full p-4 m-2 rounded-lg bg-gray-400 text-white font-bold text-lg hover:bg-gray-500 transition-colors"
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Proposals List Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <div className="text-blue-700 font-bold">ACTIVE INVESTMENTS</div>
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
        </div>
      </div>
    </Admin>
  );
};

export default withAuth(Dashboard); 