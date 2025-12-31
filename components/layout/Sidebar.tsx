// components/layout/Sidebar.tsx - Sidebar Component

'use client';

import Link from 'next/link';

interface SidebarProps {
  userRole: 'admin' | 'employee';
}

export default function Sidebar({ userRole }: SidebarProps) {
  const employeeMenu = [
    { label: 'Dashboard', href: '/dashboard-emp' },
    { label: 'Attendance', href: '/dashboard-emp/attendance' },
    { label: 'Leaves', href: '/dashboard-emp/leaves' },
    { label: 'Salary', href: '/dashboard-emp/salary' },
    { label: 'Messages', href: '/dashboard-emp/messages' },
    { label: 'Profile', href: '/dashboard-emp/profile' },
  ];

  const adminMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'Employees', href: '/dashboard-admin/employees' },
    { label: 'Attendance', href: '/dashboard-admin/attendance' },
    { label: 'Leaves', href: '/dashboard-admin/leaves' },
    { label: 'Salary', href: '/dashboard-admin/salary' },
    { label: 'Messages', href: '/dashboard-admin/messages' },
    { label: 'Reports', href: '/dashboard-admin/reports' },
    { label: 'Settings', href: '/dashboard-admin/settings' },
  ];

  const menu = userRole === 'admin' ? adminMenu : employeeMenu;

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">HRMS</h1>
      </div>

      <nav className="flex-1 p-4">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-4 py-2 rounded hover:bg-gray-700 mb-2 transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button className="w-full text-left px-4 py-2 rounded hover:bg-gray-700">
          Logout
        </button>
      </div>
    </aside>
  );
}
