'use client';

import { useState, useEffect } from 'react';
import { AttendanceService } from '@/services/attendance.service';
import { useAuthStore } from '@/store/auth.store';
import { Attendance } from '@/types/attendance';
import { safeGetTime } from '@/utils/date';
import { getLocationLink } from '@/utils/location';
import { convertFirestoreDates } from '@/utils/date';
import Loader from '@/components/ui/Loader';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function EmployeeAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    const loadAttendanceData = async () => {
      try {
        setLoading(true);
        setError('');

        // Try to get attendance records using service method as fallback
        const records = await AttendanceService.getUserAttendance(user.id);

        // Sort by date descending
        records.sort((a, b) => safeGetTime(b.date) - safeGetTime(a.date));
        setAttendanceRecords(records);
        setLoading(false);
      } catch (fallbackError) {
        console.error('Fallback fetch failed:', fallbackError);
        setError('Failed to load attendance records');
        setLoading(false);
      }
    };

    const setupSubscription = () => {
      if (!db) {
        console.error('Firebase not initialized');
        loadAttendanceData();
        return;
      }

      try {
        const q = query(
          collection(db, 'attendance'),
          where('userId', '==', user.id)
        );

        unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const records = querySnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...convertFirestoreDates(data)
              };
            }) as Attendance[];

            // Sort by date descending
            records.sort((a, b) => safeGetTime(b.date) - safeGetTime(a.date));
            setAttendanceRecords(records);
            setLoading(false);
            setError('');
            retryCount = 0; // Reset retry count on success
          },
          (error) => {
            console.error('Error subscribing to attendance:', error);

            // If subscription fails and we haven't exceeded max retries, try again
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying subscription (${retryCount}/${maxRetries})...`);
              retryTimeout = setTimeout(() => {
                setupSubscription();
              }, 2000 * retryCount); // Exponential backoff
              return;
            }

            // If subscription keeps failing, fall back to one-time fetch
            console.log('Subscription failed, falling back to one-time fetch...');
            loadAttendanceData();
          }
        );
      } catch (setupError) {
        console.error('Error setting up subscription:', setupError);
        loadAttendanceData();
      }
    };

    // Start with subscription attempt
    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [user]);

  const handleCheckIn = async () => {
    if (!user) return;

    try {
      setCheckingIn(true);
      await AttendanceService.checkIn(user.id);
      alert('Successfully checked in!');
    } catch (err: any) {
      console.error('Error checking in:', err);
      if (err.message?.includes('Location')) {
        alert('Check-in successful, but location could not be captured. Please enable location permissions for better tracking.');
      } else {
        alert('Failed to check in. Please try again.');
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;

    try {
      setCheckingOut(true);
      // Find today's attendance record
      const today = new Date().toDateString();
      const todayRecord = attendanceRecords.find(
        record => new Date(record.date).toDateString() === today
      );

      if (todayRecord && todayRecord.id) {
        await AttendanceService.checkOut(todayRecord.id);
        alert('Successfully checked out!');
      } else {
        alert('No check-in record found for today.');
      }
    } catch (err: any) {
      console.error('Error checking out:', err);
      if (err.message?.includes('Location')) {
        alert('Check-out successful, but location could not be captured. Please enable location permissions for better tracking.');
      } else {
        alert('Failed to check out. Please try again.');
      }
    } finally {
      setCheckingOut(false);
    }
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-200 text-green-800';
      case 'absent':
        return 'bg-red-200 text-red-800';
      case 'half-day':
        return 'bg-yellow-200 text-yellow-800';
      case 'late':
        return 'bg-orange-200 text-orange-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4">
          <button
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {checkingIn ? 'Checking In...' : 'Check In'}
          </button>
          <button
            onClick={handleCheckOut}
            disabled={checkingOut}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {checkingOut ? 'Checking Out...' : 'Check Out'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Date</th>
              <th className="px-6 py-3 text-left font-semibold">Check In</th>
              <th className="px-6 py-3 text-left font-semibold">Check Out</th>
              <th className="px-6 py-3 text-left font-semibold">Check In Location</th>
              <th className="px-6 py-3 text-left font-semibold">Check Out Location</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.map((record) => (
              <tr key={record.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {formatTime(record.checkInTime)}
                </td>
                <td className="px-6 py-4">
                  {formatTime(record.checkOutTime)}
                </td>
                <td className="px-6 py-4">
                  {record.checkInLocation ? (
                    <a
                      href={getLocationLink(record.checkInLocation)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                    >
                      View Location
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">No location</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {record.checkOutLocation ? (
                    <a
                      href={getLocationLink(record.checkOutLocation)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                    >
                      View Location
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">No location</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(record.status)}`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
            {attendanceRecords.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
