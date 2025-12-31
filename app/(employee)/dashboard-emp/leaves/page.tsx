'use client';

export default function EmployeeLeavesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Leaves</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Total Allowed
          </h3>
          <p className="text-2xl font-bold">12</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Used
          </h3>
          <p className="text-2xl font-bold">4</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Remaining
          </h3>
          <p className="text-2xl font-bold">8</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Pending
          </h3>
          <p className="text-2xl font-bold">1</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Leave Type</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2">
              <option>Casual Leave</option>
              <option>Sick Leave</option>
              <option>Earned Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <input type="date" className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <input type="date" className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea className="w-full border border-gray-300 rounded px-3 py-2" rows={4}></textarea>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}
