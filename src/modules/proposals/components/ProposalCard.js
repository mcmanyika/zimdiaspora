import ProposalStatusBadge from './ProposalStatusBadge';

export default function ProposalCard({ proposal }) {
  if (!proposal) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <table className="w-full">
        <tbody>
          <tr>
            <td className="py-2">
              <h3 className="text-lg font-semibold">{proposal.title}</h3>
            </td>
            <td className="py-2 text-right">
              <ProposalStatusBadge status={proposal.status} />
            </td>
          </tr>
          <tr>
            <td colSpan="2" className="py-2">
              <p className="text-gray-600 line-clamp-2">{proposal.description}</p>
            </td>
          </tr>
          <tr>
            <td className="py-2 text-sm text-gray-500">
              Submitted by: {proposal.submittedBy?.name}
            </td>
            <td className="py-2 text-sm text-gray-500 text-right">
              {new Date(proposal.createdAt).toLocaleDateString()}
            </td>
          </tr>
          {proposal.budget?.amount && proposal.budget?.currency && (
            <tr>
              <td colSpan="2" className="py-2 text-sm">
                <span className="font-medium">Budget: </span>
                {proposal.budget.currency} {proposal.budget.amount.toLocaleString()}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 