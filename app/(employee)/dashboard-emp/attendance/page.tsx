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
  const [attendanceRecords, setAttendanceRecords] = useState<{ date: Date; records: Attendance[] }[]>([]);
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

        // Group records by date
        const groupedRecords = records.reduce((acc, record) => {
          const dateKey = new Date(record.date).toDateString();
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(record);
          return acc;
        }, {} as Record<string, Attendance[]>);

        // Convert to array of grouped records, sorted by date descending
        const groupedArray = Object.keys(groupedRecords)
          .map(dateKey => ({
            date: new Date(dateKey),
            records: groupedRecords[dateKey].sort((a, b) => safeGetTime(a.createdAt) - safeGetTime(b.createdAt))
          }))
          .sort((a, b) => safeGetTime(b.date) - safeGetTime(a.date));

        setAttendanceRecords(groupedArray);
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

            // Group records by date
            const groupedRecords = records.reduce((acc, record) => {
              const dateKey = new Date(record.date).toDateString();
              if (!acc[dateKey]) {
                acc[dateKey] = [];
              }
              acc[dateKey].push(record);
              return acc;
            }, {} as Record<string, Attendance[]>);

            // Convert to array of grouped records, sorted by date descending
            const groupedArray = Object.keys(groupedRecords)
              .map(dateKey => ({
                date: new Date(dateKey),
                records: groupedRecords[dateKey].sort((a, b) => safeGetTime(a.createdAt) - safeGetTime(b.createdAt))
              }))
              .sort((a, b) => safeGetTime(b.date) - safeGetTime(a.date));

            setAttendanceRecords(groupedArray as any);
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
      console.log('Starting check-in process...');
      await AttendanceService.checkIn(user.id);
      console.log('Check-in successful');
      alert('Successfully checked in!');
    } catch (err: any) {
      console.error('Check-in error:', err);
      if (err.message?.includes('Location')) {
        alert('Check-in successful, but location could not be captured. Please enable location permissions for better tracking.');
      } else if (err.message?.includes('Already checked in')) {
        alert('You are already checked in for today. You can only check out.');
      } else {
        alert(`Failed to check in: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;

    try {
      setCheckingOut(true);
      console.log('Starting check-out process...');

      // Perform check-out (works independently of check-in)
      await AttendanceService.checkOut(user.id);
      console.log('Check-out successful');
      alert('Successfully checked out!');
    } catch (err: any) {
      console.error('Check-out error:', err);
      if (err.message?.includes('Location')) {
        alert('Check-out successful, but location could not be captured. Please enable location permissions for better tracking.');
      } else if (err.message?.includes('Already checked out')) {
        alert('Already checked out for today.');
      } else {
        alert(`Failed to check out: ${err.message || 'Please try again.'}`);
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

      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
          >
            {checkingIn ? 'Checking In...' : 'Check In'}
          </button>
          <button
            onClick={handleCheckOut}
            disabled={checkingOut}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto"
          >
            {checkingOut ? 'Checking Out...' : 'Check Out'}
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
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
            {attendanceRecords.map((group) => {
              const checkInTimes = group.records.map(r => formatTime(r.checkInTime)).filter(t => t !== 'N/A');
              const checkOutTimes = group.records.map(r => formatTime(r.checkOutTime)).filter(t => t !== 'N/A');
              const checkInLocations = group.records.filter(r => r.checkInLocation);
              const checkOutLocations = group.records.filter(r => r.checkOutLocation);
              const status = group.records.some(r => r.status === 'present') ? 'present' : 'absent'; // Simple status

              return (
                <tr key={group.date.toDateString()} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {group.date.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {checkInTimes.length > 0 ? checkInTimes.join(', ') : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {checkOutTimes.length > 0 ? checkOutTimes.join(', ') : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {checkInLocations.length > 0 ? (
                      <div className="space-y-1">
                        {checkInLocations.map((record, idx) => (
                          <a
                            key={idx}
                            href={getLocationLink(record.checkInLocation!)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-xs block"
                          >
                            View Location {idx + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No locations</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {checkOutLocations.length > 0 ? (
                      <div className="space-y-1">
                        {checkOutLocations.map((record, idx) => (
                          <a
                            key={idx}
                            href={getLocationLink(record.checkOutLocation!)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-xs block"
                          >
                            View Location {idx + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No locations</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {attendanceRecords.map((group) => {
          const checkInTimes = group.records.map(r => formatTime(r.checkInTime)).filter(t => t !== 'N/A');
          const checkOutTimes = group.records.map(r => formatTime(r.checkOutTime)).filter(t => t !== 'N/A');
          const checkInLocations = group.records.filter(r => r.checkInLocation);
          const checkOutLocations = group.records.filter(r => r.checkOutLocation);
          const status = group.records.some(r => r.status === 'present') ? 'present' : 'absent';

          return (
            <div key={group.date.toDateString()} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {group.date.toLocaleDateString()}
                  </h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${getStatusColor(status)}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Check In</p>
                  <p className="text-gray-900">{checkInTimes.length > 0 ? checkInTimes.join(', ') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Check Out</p>
                  <p className="text-gray-900">{checkOutTimes.length > 0 ? checkOutTimes.join(', ') : 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 font-medium mb-1">Locations</p>
                  <div className="flex flex-col space-y-1">
                    {checkInLocations.map((record, idx) => (
                      <a
                        key={`in-${idx}`}
                        href={getLocationLink(record.checkInLocation!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-xs"
                      >
                        📍 Check-in Location {idx + 1}
                      </a>
                    ))}
                    {checkOutLocations.map((record, idx) => (
                      <a
                        key={`out-${idx}`}
                        href={getLocationLink(record.checkOutLocation!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-xs"
                      >
                        📍 Check-out Location {idx + 1}
                      </a>
                    ))}
                    {checkInLocations.length === 0 && checkOutLocations.length === 0 && (
                      <span className="text-gray-400 text-xs">No locations</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {attendanceRecords.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No attendance records found.
          </div>
        )}
      </div>
    </div>
  );
}
