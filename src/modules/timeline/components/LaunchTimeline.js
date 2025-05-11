'use client'
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';

export default function LaunchTimeline() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('launch_milestones')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-lime-300';
      case 'in-progress':
        return 'bg-blue-500';
      case 'upcoming':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 rounded-md bg-red-50">
        Error loading timeline: {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-8">Launch Preparation Timeline</h1>
      </div>
      <div className="relative">
        {/* Central vertical line (fixed position) */}
        <div className="absolute left-1/2 top-0 w-1 bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600 h-full transform -translate-x-1/2 z-0"></div>
        
        {/* Scrollable content container */}
        <div className="relative overflow-y-auto max-h-[80vh] h-[600px]">
          <div className="flex flex-col">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative flex items-center justify-between z-10">
                {/* Left card (even index) */}
                {index % 2 === 0 ? (
                  <div className="flex-1 flex p-6 justify-center pr-2">
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl max-w-md text-right">
                      <div>
                      <h3 className="text-xl font-semibold">{milestone.title}</h3></div>
                      <div className={`${
                        milestone.status === 'completed' ? 'text-white text-center bg-lime-300 inline-block rounded-md px-2 py-1' :
                        milestone.status === 'in-progress' ? 'text-blue-600 text-center bg-blue-50 border border-blue-600 rounded-md px-2 py-1' :
                        'text-gray-600 text-center bg-gray-50 border border-gray-600 rounded-md px-2 py-1'
                      }`}>
                        {milestone.status === 'completed' ? 'Completed' :
                         milestone.status === 'in-progress' ? 'In Progress' :
                         'Upcoming'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1"></div>
                )}

                {/* Center - Status dot (no individual lines) */}
                <div className="flex flex-col p-8 items-center mx-2 z-10">
                  <div 
                    className={`w-8 h-8 rounded-full border-4 border-lime-300 shadow-lg flex items-center justify-center z-10 ${getStatusColor(milestone.status)} my-4`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white"></div>
                  </div>
                </div>

                {/* Right card (odd index) */}
                {index % 2 !== 0 ? (
                  <div className="flex-1 flex p-6  justify-center pl-8">
                    <div className="bg-white  p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl max-w-md text-left">
                      <h3 className="text-xl font-semibold">{milestone.title}</h3>
                      <p className={`${
                        milestone.status === 'completed' ? 'text-white text-center bg-lime-300  rounded-md px-2 py-1' :
                        milestone.status === 'in-progress' ? 'text-blue-600 text-center bg-blue-50 border border-blue-600 rounded-md px-2 py-1' :
                        'text-gray-600 bg-gray-50 border text-center  border-gray-600 rounded-md px-2 py-1'
                      }`}>
                        {milestone.status === 'completed' ? 'Completed' :
                         milestone.status === 'in-progress' ? 'In Progress' :
                         'Upcoming'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 