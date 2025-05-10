import { useState } from 'react';

export default function InvestmentModal({ proposal, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ amount: parseFloat(amount) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Invest in {proposal.title}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Investment Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
            >
              Confirm Investment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 