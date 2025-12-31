'use client';

export default function AdminLeavesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Leave Management</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Employee</th>
              <th className="px-6 py-3 text-left font-semibold">Type</th>
              <th className="px-6 py-3 text-left font-semibold">From</th>
              <th className="px-6 py-3 text-left font-semibold">To</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-6 py-4">Jane Smith</td>
              <td className="px-6 py-4">Casual Leave</td>
              <td className="px-6 py-4">Dec 31</td>
              <td className="px-6 py-4">Jan 2</td>
              <td className="px-6 py-4">
                <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                  Pending
                </span>
              </td>
              <td className="px-6 py-4 space-x-2">
                <button className="text-green-600 hover:underline">Approve</button>
                <button className="text-red-600 hover:underline">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
