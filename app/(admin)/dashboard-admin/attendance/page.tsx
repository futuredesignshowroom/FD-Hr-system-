'use client';
import { Employee } from '@/types/employee';
import { useState, useEffect, useCallback } from 'react';
import { AttendanceService } from '@/services/attendance.service';
import { EmployeeService } from '@/services/employee.service';
import { Attendance, AttendanceStatus } from '@/types/attendance';
import { safeDateToISOString, safeGetTime, convertFirestoreDates } from '@/utils/date';
import { getLocationLink } from '@/utils/location';

import Loader from '@/components/ui/Loader';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ReportsService } from '@/services/reports.service';

interface AttendanceWithEmployee extends Attendance {
  employeeName: string;
  employeeEmail: string;
}

interface MonthlyAttendanceEmployee {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  presentDays: number;
  totalWorkingDays: number;
  attendancePercentage: number;
  records: number;
}

export default function AdminAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendanceEmployee[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load all attendance records
      const allAttendance = await AttendanceService.getAllAttendance();

      // Load all employees for name lookup
      const allEmployees: Employee[] = await EmployeeService.getAllEmployees();

      // Filter attendance by selected date and add employee info
      const filteredAttendance = allAttendance
        .filter(record => {
          const recordDate = safeDateToISOString(record.date);
          return recordDate === selectedDate;
        })
        .map(record => {
          const employee = allEmployees.find(emp => emp.id === record.userId);
          return {
            ...record,
            employeeName: ((employee?.firstName || '') + ' ' + (employee?.lastName || '')).trim() || 'Unknown',
            employeeEmail: employee?.email || 'Unknown',
          };
        })
        .sort((a, b) => safeGetTime(b.createdAt) - safeGetTime(a.createdAt));

      setAttendanceRecords(filteredAttendance);
      setError('');
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadMonthlyData = useCallback(async () => {
    try {
      setMonthlyLoading(true);
      const monthlyData = await ReportsService.getAllEmployeesMonthlyAttendance(currentYear, currentMonth);
      setMonthlyAttendance(monthlyData);
    } catch (err) {
      console.error('Error loading monthly attendance data:', err);
      setError('Failed to load monthly attendance data');
    } finally {
      setMonthlyLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadEmployees();

    if (!db) {
      setError('Firebase not initialized');
      setLoading(false);
      return;
    }

    // Real-time listener for attendance records
    const attendanceQuery = query(collection(db, 'attendance'));
    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const allAttendance = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFirestoreDates(doc.data())
      })) as Attendance[];

      // Filter attendance by selected date and add employee info
      const filteredAttendance = allAttendance
        .filter(record => {
          const recordDate = safeDateToISOString(record.date);
          return recordDate === selectedDate;
        })
        .map(record => {
          const employee = employees.find(emp => emp.id === record.userId);
          return {
            ...record,
            employeeName: ((employee?.firstName || '') + ' ' + (employee?.lastName || '')).trim() || 'Unknown',
            employeeEmail: employee?.email || 'Unknown',
          };
        })
        .sort((a, b) => safeGetTime(b.createdAt) - safeGetTime(a.createdAt));

      setAttendanceRecords(filteredAttendance);
      setLoading(false);
      setError('');
    }, (error) => {
      console.error('Error listening to attendance:', error);
      setError('Failed to load attendance data');
      setLoading(false);
    });

    return () => unsubscribeAttendance();
  }, [selectedDate, employees]);

  useEffect(() => {
    if (viewMode === 'monthly') {
      loadMonthlyData();
    }
  }, [viewMode, loadMonthlyData]);

  const loadEmployees = async () => {
    try {
      const allEmployees = await EmployeeService.getAllEmployees();
      setEmployees(allEmployees);
    } catch (err) {
      console.error('Error loading employees:', err);
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
      second: '2-digit',
      hour12: true
    });
  };

  if (loading || monthlyLoading) {
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

      {/* View Mode Toggle */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setViewMode('daily')}
          className={`px-4 py-2 rounded-lg font-medium ${
            viewMode === 'daily'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Daily View
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={`px-4 py-2 rounded-lg font-medium ${
            viewMode === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Monthly Summary
        </button>
      </div>

      {viewMode === 'daily' ? (
        <>
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
              <h2 className="text-lg font-semibold">Daily Attendance Records</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Employee</th>
                  <th className="px-6 py-3 text-left font-semibold">Check In</th>
                  <th className="px-6 py-3 text-left font-semibold">Check Out</th>
                  <th className="px-6 py-3 text-left font-semibold">Check In Location</th>
                  <th className="px-6 py-3 text-left font-semibold">Check Out Location</th>
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
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No attendance records found for {new Date(selectedDate).toLocaleDateString()}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {new Date(2024, month - 1, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={loadMonthlyData}
              disabled={monthlyLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {monthlyLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                Monthly Attendance Summary - {new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' })} {currentYear}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Easy to manage attendance at the end of the month
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Employee</th>
                  <th className="px-6 py-3 text-left font-semibold">Department</th>
                  <th className="px-6 py-3 text-left font-semibold">Present Days</th>
                  <th className="px-6 py-3 text-left font-semibold">Total Working Days</th>
                  <th className="px-6 py-3 text-left font-semibold">Attendance %</th>
                  <th className="px-6 py-3 text-left font-semibold">Records Count</th>
                </tr>
              </thead>
              <tbody>
                {monthlyAttendance.map((employee) => (
                  <tr key={employee.employeeId} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{employee.employeeName}</div>
                        <div className="text-gray-500 text-xs">{employee.employeeEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {employee.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-600">
                      {employee.presentDays}
                    </td>
                    <td className="px-6 py-4">
                      {employee.totalWorkingDays}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        employee.attendancePercentage >= 90 ? 'bg-green-100 text-green-800' :
                        employee.attendancePercentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {employee.attendancePercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {employee.records}
                    </td>
                  </tr>
                ))}
                {monthlyAttendance.length === 0 && !monthlyLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No attendance data found for {new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' })} {currentYear}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
 
