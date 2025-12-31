// components/layout/Topbar.tsx - Topbar Component

'use client';

import SearchBar from './SearchBar';

interface TopbarProps {
  userRole: 'admin' | 'employee';
}

export default function Topbar({ userRole }: TopbarProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-6">
        <SearchBar userRole={userRole} />
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">John Doe</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
          <img
            src="https://via.placeholder.com/40"
            alt="Profile"
            className="w-10 h-10 rounded-full"
          />
        </div>
      </div>
    </header>
  );
}
