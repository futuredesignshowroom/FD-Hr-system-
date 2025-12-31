// components/layout/Topbar.tsx - Topbar Component

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import HamburgerMenu from './HamburgerMenu';
import Avatar from '../ui/Avatar';
import { useAuthStore } from '@/store/auth.store';

interface TopbarProps {
  userRole: 'admin' | 'employee';
  userName?: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export default function Topbar({ userRole, userName = 'User', onMenuToggle, isMenuOpen }: TopbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout } = useAuthStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    if (userRole === 'employee') {
      router.push('/dashboard-emp/profile');
    } else {
      // For admin, maybe redirect to a profile page or settings
      router.push('/dashboard-admin/settings');
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm relative">
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
        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
          <button onClick={handleAvatarClick} className="focus:outline-none">
            <Avatar name={userName} size={40} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-2">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 pb-4">
        <SearchBar userRole={userRole} />
      </div>
    </header>
  );
}
