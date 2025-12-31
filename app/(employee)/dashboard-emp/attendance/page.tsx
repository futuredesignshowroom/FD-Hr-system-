'use client';

import { useState, useEffect, useCallback } from 'react';
import { AttendanceService } from '@/services/attendance.service';
import { useAuthStore } from '@/store/auth.store';
import { Attendance } from '@/types/attendance';
import Loader from '@/components/ui/Loader';

export default function EmployeeAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const { user } = useAuthStore();

  const loadAttendance = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const records = await AttendanceService.getUserAttendance(user.id);
      // Sort by date descending
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAttendanceRecords(records);
    } catch (err) {
      setError('Failed to load attendance records');
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAttendance();
    }
  }, [user, loadAttendance]);

  const handleCheckIn = async () => {
    if (!user) return;

    try {
      setCheckingIn(true);
      await AttendanceService.checkIn(user.id);
      await loadAttendance(); // Refresh the list
    } catch (err) {
      console.error('Error checking in:', err);
      alert('Failed to check in. Please try again.');
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
        await loadAttendance(); // Refresh the list
      } else {
        alert('No check-in record found for today.');
      }
    } catch (err) {
      console.error('Error checking out:', err);
      alert('Failed to check out. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
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
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadAttendance}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
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
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(record.status)}`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
            {attendanceRecords.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
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
