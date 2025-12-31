// app/(admin)/layout.tsx - Admin Layout

'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        userRole="admin"
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
      <div className="flex-1 flex flex-col lg:ml-0">
        <Topbar
          userRole="admin"
          onMenuToggle={toggleSidebar}
          isMenuOpen={isSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
