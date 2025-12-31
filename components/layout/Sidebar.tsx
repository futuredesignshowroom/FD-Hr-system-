// components/layout/Sidebar.tsx - Sidebar Component

'use client';

import Link from 'next/link';

interface SidebarProps {
  userRole: 'admin' | 'employee';
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ userRole, isOpen = true, onClose }: SidebarProps) {
  const employeeMenu = [
    { label: 'Dashboard', href: '/dashboard-emp', icon: 'D' },
    { label: 'Attendance', href: '/dashboard-emp/attendance', icon: 'A' },
    { label: 'Leaves', href: '/dashboard-emp/leaves', icon: 'L' },
    { label: 'Salary', href: '/dashboard-emp/salary', icon: 'S' },
    { label: 'Messages', href: '/dashboard-emp/messages', icon: 'M' },
    { label: 'Profile', href: '/dashboard-emp/profile', icon: 'P' },
  ];

  const adminMenu = [
    { label: 'Dashboard', href: '/dashboard-admin', icon: 'D' },
    { label: 'Employees', href: '/dashboard-admin/employees', icon: 'E' },
    { label: 'Attendance', href: '/dashboard-admin/attendance', icon: 'A' },
    { label: 'Leaves', href: '/dashboard-admin/leaves', icon: 'L' },
    { label: 'Salary', href: '/dashboard-admin/salary', icon: 'S' },
    { label: 'Messages', href: '/dashboard-admin/messages', icon: 'M' },
    { label: 'Reports', href: '/dashboard-admin/reports', icon: 'R' },
    { label: 'Settings', href: '/dashboard-admin/settings', icon: 'S' },
  ];

  const menu = userRole === 'admin' ? adminMenu : employeeMenu;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gray-800 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">HRMS</h1>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-700"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-700 mb-2 transition-colors group"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm font-bold group-hover:bg-white/20 transition-colors">
                {item.icon}
              </div>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button className="w-full flex items-center space-x-3 text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm font-bold">
              L
            </div>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
