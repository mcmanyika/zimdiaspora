import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';

export default function ProposalForm() {
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Get the current user's session
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      
      if (!session) {
        throw new Error('You must be logged in to create a proposal');
      }

      const { data, error } = await supabase
        .from('proposals')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            budget: parseFloat(formData.budget),
            deadline: formData.deadline,
            user_id: session.user.id, // Add the user_id from the session
            status: 'pending'
          }
        ])
        .select();

      if (error) throw error;

      // Reset form on success
      setFormData({
        title: '',
        description: '',
        budget: '',
        deadline: ''
      });
      
      toast.success('Proposal created successfully!');

    } catch (err) {
      setError(err.message || 'An error occurred while creating the proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto  bg-white rounded-lg">
      
      
      {error && (
        <div className="text-red-600 p-4 rounded-md bg-red-50 mb-8">
          {error}
        </div>
      )}

      <input
        type="text"
        id="title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Title"
        required
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <textarea
        id="description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Description"
        required
        rows={4}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <input
        type="number"
        id="budget"
        name="budget"
        value={formData.budget}
        onChange={handleChange}
        placeholder="Budget"
        required
        min="0"
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <input
        type="date"
        id="deadline"
        name="deadline"
        value={formData.deadline}
        onChange={handleChange}
        placeholder="Deadline"
        required
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 mt-8"
      >
        {isSubmitting ? 'Submitting...' : 'Create Proposal'}
      </button>
    </form>
  );
} 