'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { ReportsService } from '@/services/reports.service';
import Loader from '@/components/ui/Loader';

interface EmployeePerformance {
  attendance: { presentDays: number; totalDays: number; percentage: number };
  leaves: { approvedDays: number };
  salary: number;
}

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const [performance, setPerformance] = useState<EmployeePerformance | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPerformance = async () => {
      if (!user?.id) return;

      try {
        const data = await ReportsService.getEmployeePerformance(user.id);
        setPerformance(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load performance'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [user?.id]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-gray-600">{user?.department}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Attendance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Attendance Rate</p>
                <p className="text-3xl font-bold text-blue-600">
                  {performance.attendance.percentage}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {performance.attendance.presentDays}/
                  {performance.attendance.totalDays} days
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          {/* Leaves Used */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Leaves Used</p>
                <p className="text-3xl font-bold text-orange-600">
                  {performance.leaves.approvedDays}
                </p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏖️</span>
              </div>
            </div>
          </div>

          {/* Current Salary */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Current Salary</p>
                <p className="text-3xl font-bold text-green-600">
                  ${(performance.salary / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <p className="text-3xl font-bold text-green-600">Active</p>
                <p className="text-xs text-gray-500 mt-1">All systems go</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
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
            href="/dashboard-emp/attendance"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <p className="text-2xl mb-2">📝</p>
            <p className="font-medium">Check Attendance</p>
          </a>
          <a
            href="/dashboard-emp/leaves"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <p className="text-2xl mb-2">✈️</p>
            <p className="font-medium">Apply Leave</p>
          </a>
          <a
            href="/dashboard-emp/salary"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <p className="text-2xl mb-2">💵</p>
            <p className="font-medium">View Salary</p>
          </a>
          <a
            href="/dashboard-emp/messages"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <p className="text-2xl mb-2">💬</p>
            <p className="font-medium">Messages</p>
          </a>
        </div>
      </div>
    </div>
  );
}
