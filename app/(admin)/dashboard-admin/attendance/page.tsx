'use client';

export default function AdminAttendancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Present Today
          </h3>
          <p className="text-2xl font-bold">115</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Absent Today
          </h3>
          <p className="text-2xl font-bold">10</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Half Day
          </h3>
          <p className="text-2xl font-bold">3</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Attendance %
          </h3>
          <p className="text-2xl font-bold">92%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Employee</th>
              <th className="px-6 py-3 text-left font-semibold">Date</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-6 py-4">John Doe</td>
              <td className="px-6 py-4">Dec 30, 2025</td>
              <td className="px-6 py-4">
                <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                  Present
                </span>
              </td>
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
