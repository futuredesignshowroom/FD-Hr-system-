// app/layout.tsx - Root Layout

import type { Metadata } from 'next';
import './globals.css';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'HRMS System',
  description: 'Human Resource Management System',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <ConnectionStatus />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
