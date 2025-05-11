'use client'
import React, { useState, useEffect, useMemo } from "react";
import Admin from "../../components/layout/Admin";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { withAuth } from '../../utils/withAuth'
import ProposalList from "../../modules/proposals/components/ProposalList";
import YouTubeVideo from "./utils/youtube";
import LaunchTimeline from "../../modules/timeline/components/LaunchTimeline";
const CATEGORIES = ["REAL ESTATE", "AGRICULTURE", "TOURISM", "ENERGY"];

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("REAL ESTATE");
  const [user, setUser] = useState(null);
  const [proposalData, setProposalData] = useState(null);
  const [showOnlyInvested, setShowOnlyInvested] = useState(false);
  const [userInvestedProjects, setUserInvestedProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userStats, setUserStats] = useState({
    totalInvestment: 0,
    numberOfProjects: 0,
    currentProjectInvestment: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

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
    const fetchUserStats = async () => {
      if (!user) return;

      try {
        // Fetch user's investments
        const { data: investments, error: investmentsError } = await supabase
          .from('investments')
          .select('amount, proposal_id')
          .eq('investor_id', user.id)
          .eq('status', 'COMPLETED');

        if (investmentsError) throw investmentsError;

        // Calculate total investment and number of unique projects
        const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
        const uniqueProjects = new Set(investments.map(inv => inv.proposal_id)).size;

        setUserStats({
          totalInvestment,
          numberOfProjects: uniqueProjects,
          currentProjectInvestment: 0 // Will be updated when proposal data is fetched
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, [user, supabase]);

  useEffect(() => {
    const fetchUserInvestedProjects = async () => {
      if (!user) return;

      try {
        const { data: investments, error } = await supabase
          .from('investments')
          .select(`
            proposal_id,
            proposals (
              id,
              title,
              category,
              budget,
              amount_raised
            )
          `)
          .eq('investor_id', user.id)
          .eq('status', 'COMPLETED');

        if (error) throw error;

        // Get unique projects with their details
        const uniqueProjects = investments.reduce((acc, inv) => {
          if (!acc.find(p => p.id === inv.proposals.id)) {
            acc.push(inv.proposals);
          }
          return acc;
        }, []);

        setUserInvestedProjects(uniqueProjects);
        
        // Set the first project as selected if none is selected
        if (!selectedProjectId && uniqueProjects.length > 0) {
          const firstProject = uniqueProjects[0];
          setSelectedProjectId(firstProject.id);
          setSelectedTab(firstProject.category); // Set the category tab to match the first project
        }
      } catch (error) {
        console.error('Error fetching user invested projects:', error);
      }
    };

    fetchUserInvestedProjects();
  }, [user, supabase]);

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

        let currentProjectInvestment = 0;

        // Only fetch user investments if user is logged in
        if (user) {
          const { data: userInvestments, error: userInvestmentsError } = await supabase
            .from('investments')
            .select('amount')
            .eq('proposal_id', proposal[0].id)
            .eq('investor_id', user.id)
            .eq('status', 'COMPLETED');

          if (userInvestmentsError) {
            console.error('Error fetching user investments:', userInvestmentsError);
          } else if (userInvestments) {
            currentProjectInvestment = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
          }
        }

        setUserStats(prev => ({
          ...prev,
          currentProjectInvestment
        }));

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

  // Calculate ownership share percentage
  const ownershipShare = useMemo(() => {
    if (!proposalData?.amount_raised || !userStats.currentProjectInvestment) return 0;
    return ((userStats.currentProjectInvestment / proposalData.amount_raised) * 100).toFixed(1);
  }, [proposalData?.amount_raised, userStats.currentProjectInvestment]);

  return (
    <Admin>
      <div className="min-h-screen bg-gray-100 py-10 px-2">
          <div className="max-w-7xl bg-white rounded-xl shadow-lg p-8">

        {/* Category Tabs */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-2">
          <div className="flex flex-col md:flex-row gap-2">
            {CATEGORIES.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedTab(tab);
                  setSelectedProjectId(null);
                }}
                className={`px-4 sm:px-6 py-2 rounded-md font-semibold text-sm sm:text-base transition ${
                  selectedTab === tab
                    ? "bg-lime-300 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="border border-gray-400 hover:bg-lime-300 hover:border-white hover:text-white rounded-md px-4 py-2"
          >
            Track Progress To Launch
          </button>
        </div>

        {/* Sliding Modal */}
        <div 
          className={`fixed top-0 right-0 h-full w-1/2 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
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
            <div className="space-y-4">
              <LaunchTimeline />
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
 
          {/* User Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-100 rounded-lg p-2 flex flex-col justify-center items-center h-full">
              <h1 className="text-2xl font-bold mb-2">Your Investment Summary</h1>
              <div className="text-center">
                Total Investment: <span className="font-bold">${userStats.totalInvestment.toLocaleString()}</span>
              </div>
              <div className="text-center">
                Number of Projects: <span className="font-bold">{userStats.numberOfProjects}</span>
              </div>
              {userInvestedProjects.length > 0 && (
              <div className="pt-4 text-center">
                <div className="text-sm text-gray-600 mb-2">Your Invested Projects in {selectedTab}:</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {userInvestedProjects
                    .filter(project => project.category === selectedTab)
                    .map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setSelectedTab(project.category);
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          selectedProjectId === project.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {project.title}
                      </button>
                    ))}
                  {userInvestedProjects.filter(project => project.category === selectedTab).length === 0 && (
                    <div className="text-sm text-gray-500">No investments in this category</div>
                  )}
                </div>
              </div>
            )}
            </div>

            {/* Youtube Video */}
              <div className="bg-gray-100 rounded-lg p-4">
                <YouTubeVideo />
              </div>
          </div>

          {/* Project Overview */}
          <div className="bg-gray-200 rounded-xl text-gray-800 p-6 mb-6">
            <div className="text-blue-700 font-bold mb-4">
              {proposalData?.title || 'No Active Project'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500">INVESTORS</div>
                <div className="text-3xl font-bold">{proposalData?.investor_count || 0}</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500">CAPITAL RAISED</div>
                <div className="text-xl font-bold text-wrap">
                  ${proposalData?.amount_raised?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500">REMAINING</div>
                <div className="text-xl font-bold">
                  ${((proposalData?.budget || 0) - (proposalData?.amount_raised || 0)).toLocaleString()}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500">PROJECT TOTAL</div>
                <div className="text-xl font-bold">
                  ${proposalData?.budget?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </div>

          {/* Ownership & Progress */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {proposalData && userStats.currentProjectInvestment > 0 ? (
              <>
                <div className="flex-1 bg-gray-400 rounded-lg p-8 text-center flex flex-col justify-center items-center min-h-[200px]">
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
              <div className="flex-1 bg-gray-100 rounded-lg p-8 text-center">
                <div className="text-lg text-gray-600">
                  {proposalData
                    ? "You haven't invested in this project yet"
                    : "No active project in this category"}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="flex-1 gap-4">
              {["Title Deeds", "Bank Statements", "Letters / Documents"].map((label) => (
                <select
                  key={label}
                  className="w-full p-4 m-2 rounded-lg bg-gray-400 text-white font-bold text-lg"
                >
                  <option>{label}</option>
                  <option>Download</option>
                  <option>View</option>
                </select>
              ))}
            </div>
          </div>

          {/* Existing Proposals List Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <div className="text-blue-700 font-bold">ACTIVE PROJECTS</div>
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