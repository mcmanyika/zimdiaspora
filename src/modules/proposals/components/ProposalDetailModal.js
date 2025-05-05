import ProposalStatusBadge from './ProposalStatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase/config';
import { toast } from 'react-toastify';
import LinearProgress from '@mui/material/LinearProgress';

export default function ProposalDetailModal({ proposal, onClose }) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!proposal) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div 
          className="fixed inset-y-0 right-0 w-1/2 min-h-screen bg-white shadow-xl overflow-y-auto"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ width: windowWidth > 600 ? '50%' : '100%' }}
            onClick={e => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <div className="flex-grow">
                <h2 className="text-2xl font-semibold text-gray-900">{proposal.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              Status:  <ProposalStatusBadge status={proposal.status}  className="m-2"/>
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                Deadline Date {proposal.deadline ? new Date(proposal.deadline).toLocaleDateString() : 'No deadline set'}
              </span>
            </div>

            <div className="space-y-6">
              {/* Main Content */}
              <div className="grid gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{proposal.description}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Budget</h3>
                  <p className="text-gray-600">
                    {proposal.budget.toLocaleString()}
                  </p>
                </div>

                {/* Budget Progress Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Funding Progress</h3>
                  <div className="space-y-2">
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((proposal.amount_raised / proposal.budget) * 100 || 0, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        flexGrow: 1,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#00D48A'
                        },
                        backgroundColor: '#f3f4f6'
                      }}
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        ${(proposal.amount_raised || 0).toLocaleString()} raised
                      </span>
                      <span>
                        {Math.min((proposal.amount_raised / proposal.budget) * 100 || 0, 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 