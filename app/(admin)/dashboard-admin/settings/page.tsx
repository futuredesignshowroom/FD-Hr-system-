'use client';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Leave Policies</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Casual Leaves per Year</label>
            <input type="number" defaultValue="10" className="border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sick Leaves per Year</label>
            <input type="number" defaultValue="5" className="border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Earned Leaves per Year</label>
            <input type="number" defaultValue="12" className="border border-gray-300 rounded px-3 py-2" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Company Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <input type="text" defaultValue="Your Company" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Working Days per Month</label>
            <input type="number" defaultValue="26" className="border border-gray-300 rounded px-3 py-2" />
          </div>
        </div>
      </div>

      <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
        Save Settings
      </button>
    </div>
  );
}
