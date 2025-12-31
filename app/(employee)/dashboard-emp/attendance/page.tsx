'use client';

export default function EmployeeAttendancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Check In
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-2">
          Check Out
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Date</th>
              <th className="px-6 py-3 text-left font-semibold">Check In</th>
              <th className="px-6 py-3 text-left font-semibold">Check Out</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-6 py-4">Dec 30, 2025</td>
              <td className="px-6 py-4">09:00 AM</td>
              <td className="px-6 py-4">05:30 PM</td>
              <td className="px-6 py-4">
                <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                  Present
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
