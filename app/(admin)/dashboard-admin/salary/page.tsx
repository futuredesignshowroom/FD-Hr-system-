'use client';

export default function AdminSalaryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Salary Management</h1>

      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        Calculate Salaries
      </button>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Employee</th>
              <th className="px-6 py-3 text-left font-semibold">Base Salary</th>
              <th className="px-6 py-3 text-left font-semibold">Allowances</th>
              <th className="px-6 py-3 text-left font-semibold">Deductions</th>
              <th className="px-6 py-3 text-left font-semibold">Net Salary</th>
              <th className="px-6 py-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-6 py-4">John Doe</td>
              <td className="px-6 py-4">$5,000</td>
              <td className="px-6 py-4">$500</td>
              <td className="px-6 py-4">$200</td>
              <td className="px-6 py-4 font-semibold">$5,300</td>
              <td className="px-6 py-4">
                <button className="text-blue-600 hover:underline">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
