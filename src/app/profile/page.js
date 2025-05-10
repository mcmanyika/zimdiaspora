"use client";

import ProfileView from '../../modules/profiles/components/ProfileView';
import Admin from '../../components/layout/Admin';
import Header from '../../components/layout/Header';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function MyProfile() {
  const [userInvestments, setUserInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchUserInvestments() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: investments, error } = await supabase
          .from('investments')
          .select(`
            *,
            proposal:proposals(
              id,
              title,
              status,
              budget,
              amount_raised
            )
          `)
          .eq('investor_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUserInvestments(investments || []);
      } catch (error) {
        console.error('Error fetching user investments:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserInvestments();
  }, [supabase]);

  return (
    <Admin>
      <div className="p-6">
        <ProfileView />
        
        {/* Investment History Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Investment History</h2>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ) : userInvestments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">You haven&apos;t made any investments yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userInvestments.map((investment) => (
                    <tr key={investment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{investment.proposal?.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${investment.amount.toLocaleString()}</div>
                      </td>
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
                        <div className="text-sm text-gray-900">
                          {new Date(investment.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full max-w-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ 
                                  width: `${Math.min((investment.proposal?.amount_raised / investment.proposal?.budget) * 100 || 0, 100)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">
                              {Math.round((investment.proposal?.amount_raised / investment.proposal?.budget) * 100) || 0}%
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Admin>
  );
} 