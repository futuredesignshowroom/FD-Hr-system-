'use client';

export default function AdminEmployeesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Employees</h1>

      <div className="flex space-x-4">
        <input
          type="text"
          placeholder="Search employees..."
          className="flex-1 border border-gray-300 rounded px-4 py-2"
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Add Employee
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Name</th>
              <th className="px-6 py-3 text-left font-semibold">Email</th>
              <th className="px-6 py-3 text-left font-semibold">Department</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="px-6 py-4">John Doe</td>
              <td className="px-6 py-4">john@example.com</td>
              <td className="px-6 py-4">IT</td>
              <td className="px-6 py-4">
                <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 space-x-2">
                <button className="text-blue-600 hover:underline">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
