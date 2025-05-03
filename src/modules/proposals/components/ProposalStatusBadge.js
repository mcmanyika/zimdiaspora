export default function ProposalStatusBadge({ status }) {
  const getStatusStyles = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 p-2 capitalize text-yellow-800';
      case 'active':
        return 'bg-green-100 p-2 text-green-800';
      case 'rejected':
        return 'bg-red-100 p-2 text-red-800';
      case 'in progress':
        return 'bg-blue-100 p-2text-blue-800';
      case 'completed':
        return 'bg-purple-100 p-2 text-purple-800';
      default:
        return 'bg-gray-100 p-2 text-gray-800';
    }
  };

  return (
    <span className={`px-2.5 py-1.5 inline-flex text-xs leading-4 font-medium rounded-full ${getStatusStyles()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
} 