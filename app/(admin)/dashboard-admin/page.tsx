'use client';

import { useEffect, useState } from 'react';
import { ReportsService, DashboardMetrics } from '@/services/reports.service';
import Loader from '@/components/ui/Loader';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await ReportsService.getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Employees */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Employees</p>
                <p className="text-3xl font-bold text-blue-600">
                  {metrics.totalEmployees}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          {/* Departments */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Departments</p>
                <p className="text-3xl font-bold text-green-600">
                  {metrics.totalDepartments}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>

          {/* Today Attendance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Attendance</p>
                <p className="text-3xl font-bold text-purple-600">
                  {metrics.todayAttendance}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          {/* Pending Leaves */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Leaves</p>
                <p className="text-3xl font-bold text-orange-600">
                  {metrics.pendingLeaves}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏖️</span>
              </div>
            </div>
          </div>

          {/* Average Attendance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Attendance %</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {metrics.averageAttendance}%
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          {/* Total Payroll */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Payroll</p>
                <p className="text-3xl font-bold text-green-600">
                  ${(metrics.totalPayroll / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/dashboard-admin/employees"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <p className="text-2xl mb-2">👨‍💼</p>
            <p className="font-medium">Manage Employees</p>
          </a>
          <a
            href="/dashboard-admin/attendance"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <p className="text-2xl mb-2">📝</p>
            <p className="font-medium">Mark Attendance</p>
          </a>
          <a
            href="/dashboard-admin/leaves"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <p className="text-2xl mb-2">✅</p>
            <p className="font-medium">Approve Leaves</p>
          </a>
          <a
            href="/dashboard-admin/salary"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <p className="text-2xl mb-2">💵</p>
            <p className="font-medium">Manage Salary</p>
          </a>
        </div>
      </div>
    </div>
  );
}
