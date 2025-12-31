// components/layout/SearchBar.tsx - Search Bar Component

'use client';

import { useState } from 'react';

interface SearchBarProps {
  userRole: 'admin' | 'employee';
}

export default function SearchBar({ userRole }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchTerm);
  };

  const placeholder =
    userRole === 'admin'
      ? 'Search employees, attendance...'
      : 'Search messages, leaves...';

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-md">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
        >
          🔍
        </button>
      </div>
    </form>
  );
}
