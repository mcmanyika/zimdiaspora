import { useState, useEffect } from 'react';
import { proposalsApi } from '../api/proposalsApi';

export function useProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await proposalsApi.getProposals();
      setProposals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { proposals, loading, error, refetch: fetchProposals };
} 