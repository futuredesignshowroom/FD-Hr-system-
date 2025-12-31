// components/ConnectionStatus.tsx - Network Connection Status Monitor

'use client';

import { useEffect, useState } from 'react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showAlert) return null;

  return (
    <div
      className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all ${
        isOnline
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-600' : 'bg-red-600'}`}></span>
        <span className="font-medium">
          {isOnline ? '✓ Connection restored' : '✗ No internet connection'}
        </span>
      </div>
    </div>
  );
}
