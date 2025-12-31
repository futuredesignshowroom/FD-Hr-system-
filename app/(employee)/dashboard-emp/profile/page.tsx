'use client';

export default function EmployeeProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-6 mb-6">
          <img
            src="https://via.placeholder.com/100"
            alt="Profile"
            className="w-24 h-24 rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold">John Doe</h2>
            <p className="text-gray-600">Employee ID: EMP001</p>
            <p className="text-gray-600">Department: IT</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" defaultValue="john@example.com" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input type="tel" defaultValue="+1234567890" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input type="date" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input type="text" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
        </div>

        <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Update Profile
        </button>
      </div>
    </div>
  );
}
