'use client';
import { Employee } from '@/types/employee';
import { useState, useEffect, useCallback } from 'react';
import { AttendanceService } from '@/services/attendance.service';
import { EmployeeService } from '@/services/employee.service';
import { Attendance, AttendanceStatus } from '@/types/attendance';
import { safeDateToISOString, safeGetTime } from '@/utils/date';
import { getLocationLink } from '@/utils/location';

import Loader from '@/components/ui/Loader';
import { ReportsService } from '@/services/reports.service';

interface AttendanceWithEmployee extends Attendance {
  employeeName: string;
  employeeEmail: string;
  employeeId: string;
  department: string;
  position: string;
  phone?: string;
  employeeStatus: 'active' | 'inactive' | 'on-leave' | 'terminated';
  avatar?: string;
}

interface MonthlyAttendanceEmployee {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  position: string;
  presentDays: number;
  totalWorkingDays: number;
  attendancePercentage: number;
  records: number;
  status: 'active' | 'inactive' | 'on-leave' | 'terminated';
}

export default function AdminAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendanceEmployee[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load all attendance records
      const allAttendance = await AttendanceService.getAllAttendance();

      // Load all employees for name lookup
      const allEmployees: Employee[] = await EmployeeService.getAllEmployees();

      // Filter attendance by selected date and add employee info
      let filteredAttendance = allAttendance
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
            employeeId: employee?.employeeId || 'N/A',
            department: employee?.department || 'N/A',
            position: employee?.position || 'N/A',
            phone: employee?.phone,
            employeeStatus: employee?.status || 'inactive',
            avatar: employee?.avatar,
          };
        })
        .sort((a, b) => safeGetTime(b.createdAt) - safeGetTime(a.createdAt));

      // Apply search and filter
      if (searchTerm) {
        filteredAttendance = filteredAttendance.filter(record =>
          record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (departmentFilter) {
        filteredAttendance = filteredAttendance.filter(record =>
          record.department === departmentFilter
        );
      }

      if (statusFilter) {
        filteredAttendance = filteredAttendance.filter(record =>
          record.employeeStatus === statusFilter
        );
      }

      setAttendanceRecords(filteredAttendance);
      setError('');
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, searchTerm, departmentFilter, statusFilter]);

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
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (viewMode === 'monthly') {
      loadMonthlyData();
    }
  }, [viewMode, loadMonthlyData]);

  const getUniqueDepartments = () => {
    const departments = attendanceRecords.map(record => record.department).filter(Boolean);
    return [...new Set(departments)];
  };

  const getUniqueStatuses = () => {
    return ['active', 'inactive', 'on-leave', 'terminated'];
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'on-leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const handleDownloadAttendance = () => {
    if (attendanceRecords.length === 0) {
      alert('No attendance data to download');
      return;
    }

    // Create CSV content
    const headers = [
      'Date',
      'Employee Name',
      'Employee ID',
      'Email',
      'Department',
      'Position',
      'Status',
      'Check In Time',
      'Check Out Time',
      'Check In Location',
      'Check Out Location',
      'Employee Status'
    ];

    const csvContent = [
      headers.join(','),
      ...attendanceRecords.map(record => [
        new Date(record.date).toLocaleDateString(),
        `"${record.employeeName}"`,
        record.employeeId,
        record.employeeEmail,
        record.department,
        record.position,
        record.status,
        record.checkInTime ? new Date(record.checkInTime).toLocaleString() : '',
        record.checkOutTime ? new Date(record.checkOutTime).toLocaleString() : '',
        record.checkInLocation ? `"${record.checkInLocation.lat}, ${record.checkInLocation.lng}"` : '',
        record.checkOutLocation ? `"${record.checkOutLocation.lat}, ${record.checkOutLocation.lng}"` : '',
        record.employeeStatus
      ].join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
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
              <div className="flex items-end">
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Refreshing...' : '🔄 Refresh'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Employee
                </label>
                <input
                  type="text"
                  placeholder="Name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full min-w-[200px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">All Departments</option>
                  {getUniqueDepartments().map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">All Statuses</option>
                  {getUniqueStatuses().map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Refresh
              </button>
              <button
                onClick={handleDownloadAttendance}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                disabled={attendanceRecords.length === 0}
              >
                Download CSV
              </button>
            </div>
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
                  <th className="px-6 py-3 text-left font-semibold">Department</th>
                  <th className="px-6 py-3 text-left font-semibold">Position</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Check In</th>
                  <th className="px-6 py-3 text-left font-semibold">Check Out</th>
                  <th className="px-6 py-3 text-left font-semibold">Location</th>
                  <th className="px-6 py-3 text-left font-semibold">Attendance</th>
                  <th className="px-6 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {record.avatar ? (
                          <img
                            src={record.avatar}
                            alt={record.employeeName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {record.employeeName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{record.employeeName}</div>
                          <div className="text-gray-500 text-xs">{record.employeeEmail}</div>
                          <div className="text-gray-400 text-xs">ID: {record.employeeId}</div>
                          {record.phone && (
                            <div className="text-gray-400 text-xs">📞 {record.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {record.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{record.position}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(record.employeeStatus)}`}>
                        {record.employeeStatus.charAt(0).toUpperCase() + record.employeeStatus.slice(1).replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatTime(record.checkInTime)}</td>
                    <td className="px-6 py-4">{formatTime(record.checkOutTime)}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {record.checkInLocation ? (
                          <a
                            href={getLocationLink(record.checkInLocation)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-xs block"
                          >
                            Check-in Location
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">No check-in location</span>
                        )}
                        {record.checkOutLocation ? (
                          <a
                            href={getLocationLink(record.checkOutLocation)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-xs block"
                          >
                            Check-out Location
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">No check-out location</span>
                        )}
                      </div>
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
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No attendance records found for {new Date(selectedDate).toLocaleDateString()}.
                      {searchTerm && ` Matching "${searchTerm}"`}
                      {departmentFilter && ` in ${departmentFilter}`}
                      {statusFilter && ` with status ${statusFilter}`}
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
                  <th className="px-6 py-3 text-left font-semibold">Position</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
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
                    <td className="px-6 py-4 text-sm">{employee.position}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(employee.status)}`}>
                        {employee.status.charAt(0).toUpperCase() + employee.status.slice(1).replace('-', ' ')}
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
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
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
 
