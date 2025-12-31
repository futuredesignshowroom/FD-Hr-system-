// components/layout/SearchBar.tsx - Search Bar Component

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  userRole: 'admin' | 'employee';
}

export default function SearchBar({ userRole }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Navigate to search results page with query
    const searchQuery = encodeURIComponent(searchTerm.trim());
    if (userRole === 'admin') {
      router.push(`/dashboard-admin/search?q=${searchQuery}`);
    } else {
      router.push(`/dashboard-emp/search?q=${searchQuery}`);
    }
  };

  const placeholder =
    userRole === 'admin'
      ? 'Search employees, attendance, leaves...'
      : 'Search messages, leaves, profile...';

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-lg">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
        />
      </div>
    </form>
  );
}
