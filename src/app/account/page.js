'use client'
import React, { useState, useEffect } from "react";
import Admin from "../../components/layout/Admin";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const tabs = ["REAL ESTATE", "TOURISM", "FARMING", "ENERGY"];

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("TOURISM");
  const [user, setUser] = useState(null);
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

  return (
    <Admin>
      <div className="min-h-screen bg-gray-100 py-10 px-2">
        <div className="max-w-7xl bg-white rounded-xl shadow-lg p-8">
          {/* Tabs */}
          <div className="flex justify-start mb-6 space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-6 py-2 rounded-md font-semibold transition ${
                  selectedTab === tab
                    ? "bg-blue-700 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* User Summary */}
          <div className="flex flex-col md:flex-row justify-between mb-6 space-y-2 md:space-y-0 md:space-x-4">
            <div className="bg-gray-100 rounded-lg p-4 flex-1 mb-2 md:mb-0">
              <div className="font-bold">{user?.user_metadata?.name || ''}</div>
              <div>
                Total Investment: <span className="font-bold">$10,000</span>
              </div>
              <div>
                Number of Projects: <span className="font-bold">2</span>
              </div>
            </div>
            <div className="flex-1 flex space-x-4">
              <button
                className={`flex-1 rounded-lg p-4 font-bold ${
                  selectedTab === "TOURISM"
                    ? "bg-blue-700 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                TOURISM
              </button>
              <button
                className={`flex-1 rounded-lg p-4 font-bold ${
                  selectedTab === "ENERGY"
                    ? "bg-blue-700 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                ENERGY
              </button>
            </div>
          </div>

          {/* Project Overview */}
          <div className="bg-gray-200 rounded-xl text-gray-800 p-6 mb-6">
            <div className="text-blue-700 font-bold mb-4">TOURISM: NYANGA PROJECT</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500">INVESTORS</div>
                <div className="text-3xl font-bold">250</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500">CAPITAL</div>
                <div className="text-xl font-bold">$1,500,000</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500">REMAINING</div>
                <div className="text-xl font-bold">$1,000,000</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500">PROJECT TOTAL</div>
                <div className="text-xl font-bold">$2,500,000</div>
              </div>
            </div>
          </div>

          {/* Ownership & Progress */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex bg-lime-300 rounded-lg p-8 text-center">
              <div className="text-sm text-gray-700 mb-2">OWNERSHIP SHARE</div>
              <div className="text-4xl font-bold">4%</div>
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg p-8 text-center flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-2">GOAL $10,000</div>
              <div className="flex items-center mb-2">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-8 mx-0.5 rounded ${
                      i < 2 ? "bg-blue-700" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-base font-bold">AMOUNT INVESTED</div>
              <div className="text-xl font-bold text-blue-700">$2,000</div>
            </div>
          

          {/* Documents */}
          <div className="flex-1 gap-4">
            {["Title Deeds", "Bank Statements", "Letters / Documents"].map((label) => (
              <select
                key={label}
                className="w-full p-4 m-2 rounded-lg bg-blue-700 text-white font-bold text-lg"
              >
                <option>{label}</option>
                <option>Download</option>
                <option>View</option>
              </select>
            ))}
          </div>
          </div>
        </div>
      </div>
    </Admin>
  );
};

export default Dashboard; 