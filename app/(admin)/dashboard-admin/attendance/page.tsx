'use client';

import { useState, useEffect } from 'react';
import { AttendanceService } from '@/services/attendance.service';
import { EmployeeService } from '@/services/employee.service';
import { Attendance, AttendanceStatus } from '@/types/attendance';
import { Employee } from '@/types/employee';
import Loader from '@/components/ui/Loader';

interface AttendanceWithEmployee extends Attendance {
  employeeName: string;
  employeeEmail: string;
}

export default function AdminAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all attendance records
      const allAttendance = await AttendanceService.getAllAttendance();

      // Load all employees for name lookup
      const allEmployees = await EmployeeService.getAllEmployees();
      setEmployees(allEmployees);

      // Filter attendance by selected date and add employee info
      const filteredAttendance = allAttendance
        .filter(record => {
          const recordDate = new Date(record.date).toISOString().split('T')[0];
          return recordDate === selectedDate;
        })
        .map(record => {
          const employee = allEmployees.find(emp => emp.id === record.userId);
          return {
            ...record,
            employeeName: employee?.name || 'Unknown',
            employeeEmail: employee?.email || 'Unknown',
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setAttendanceRecords(filteredAttendance);
    } catch (err) {
      setError('Failed to load attendance data');
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTodayStats = () => {
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const halfDay = attendanceRecords.filter(r => r.status === 'half-day').length;
    const total = attendanceRecords.length;
    const percentage = total > 0 ? Math.round(((present + halfDay) / total) * 100) : 0;

    return { present, absent, halfDay, percentage };
  };

  const handleMarkAttendance = async (userId: string, status: AttendanceStatus) => {
    try {
      await AttendanceService.markAttendance(userId, new Date(selectedDate), status);
      await loadData(); // Refresh the data
    } catch (err) {
      console.error('Error marking attendance:', err);
      alert('Failed to mark attendance');
    }
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

  const formatTime = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = getTodayStats();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance Management</h1>

      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <button
          onClick={loadData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Present Today
          </h3>
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Absent Today
          </h3>
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Half Day
          </h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.halfDay}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Attendance %
          </h3>
          <p className="text-2xl font-bold text-blue-600">{stats.percentage}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Attendance Records</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Employee</th>
              <th className="px-6 py-3 text-left font-semibold">Check In</th>
              <th className="px-6 py-3 text-left font-semibold">Check Out</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.map((record) => (
              <tr key={record.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{record.employeeName}</div>
                    <div className="text-gray-500 text-xs">{record.employeeEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4">{formatTime(record.checkInTime)}</td>
                <td className="px-6 py-4">{formatTime(record.checkOutTime)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(record.status)}`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => handleMarkAttendance(record.userId, 'present')}
                    className="text-green-600 hover:underline text-xs"
                  >
                    Mark Present
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(record.userId, 'absent')}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Mark Absent
                  </button>
                </td>
              </tr>
            ))}
            {attendanceRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No attendance records found for {new Date(selectedDate).toLocaleDateString()}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
                  Present
                </span>
              </td>
              <td className="px-6 py-4">
                <button className="text-blue-600 hover:underline">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
