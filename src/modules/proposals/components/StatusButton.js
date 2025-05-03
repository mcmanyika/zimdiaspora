export default function StatusButton({ status, isActive, onClick }) {
  const getStatusStyles = () => {
    const baseStyles = 'px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 hover:opacity-90';
    const inactiveStyles = 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    
    if (!isActive) return `${baseStyles} ${inactiveStyles}`;

    switch (status?.toLowerCase()) {
      case 'pending':
        return `${baseStyles} bg-yellow-500 text-white`;
      case 'active':
        return `${baseStyles} bg-green-500 text-white`;
      case 'rejected':
        return `${baseStyles} bg-red-500 text-white`;
      case 'in progress':
        return `${baseStyles} bg-blue-500 text-white`;
      case 'completed':
        return `${baseStyles} bg-purple-500 text-white`;
      default:
        return `${baseStyles} ${inactiveStyles}`;
    }
  };

  return (
    <button
      onClick={onClick}
      className={getStatusStyles()}
    >
      {status || 'Unknown'}
    </button>
  );
} 