// app/dashboard-emp/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome {user?.name}</h2>
          <p className="text-gray-600">Email: {user?.email}</p>
          <p className="text-gray-600">Role: {user?.role}</p>
        </div>
      </div>
    </div>
  );
}
