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
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <ConnectionStatus />
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-gray-100 border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-2">
              <span>Powered by</span>
              <a
                href="https://digizaro.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <img
                  src="https://digizaro.com/wp-content/uploads/2023/12/digizaro-logo.png"
                  alt="Digizaro Logo"
                  className="h-6 w-auto"
                />
                <span>Digizaro</span>
              </a>
            </div>
            <div className="mt-1">
              <span>Digital Solutions Agency</span>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
