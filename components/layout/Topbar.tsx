// components/layout/Topbar.tsx - Topbar Component

'use client';

import SearchBar from './SearchBar';
import HamburgerMenu from './HamburgerMenu';
import Avatar from '../ui/Avatar';

interface TopbarProps {
  userRole: 'admin' | 'employee';
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export default function Topbar({ userRole, onMenuToggle, isMenuOpen }: TopbarProps) {
  const userName = 'John Doe'; // This should ideally come from props or context

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4 lg:p-6">
        <div className="flex items-center space-x-4">
          {onMenuToggle && (
            <HamburgerMenu isOpen={isMenuOpen || false} onToggle={onMenuToggle} />
          )}
          <div className="lg:hidden">
            <h1 className="text-xl font-bold text-gray-800">HRMS</h1>
          </div>
          <div className="hidden lg:block">
            <SearchBar userRole={userRole} />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
          <Avatar name={userName} size={40} />
        </div>
      </div>
      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 pb-4">
        <SearchBar userRole={userRole} />
      </div>
    </header>
  );
}
