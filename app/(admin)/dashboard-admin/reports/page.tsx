'use client';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg">
          <h3 className="text-xl font-bold mb-2">Attendance Report</h3>
          <p className="text-gray-600 mb-4">View monthly attendance summary</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Generate
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg">
          <h3 className="text-xl font-bold mb-2">Salary Report</h3>
          <p className="text-gray-600 mb-4">View payroll and salary details</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Generate
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg">
          <h3 className="text-xl font-bold mb-2">Leave Report</h3>
          <p className="text-gray-600 mb-4">View leave allocation and usage</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Generate
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg">
          <h3 className="text-xl font-bold mb-2">Employee Report</h3>
          <p className="text-gray-600 mb-4">View employee details and status</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
