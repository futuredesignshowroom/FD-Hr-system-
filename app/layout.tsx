// app/layout.tsx - Root Layout

import type { Metadata } from 'next';
import './globals.css';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export const metadata: Metadata = {
  title: 'HRMS System',
  description: 'Human Resource Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConnectionStatus />
        {children}
      </body>
    </html>
  );
}
