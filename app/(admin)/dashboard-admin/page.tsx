'use client';

import { useEffect, useState } from 'react';
import { ReportsService, DashboardMetrics, RecentActivity } from '@/services/reports.service';
import Loader from '@/components/ui/Loader';
import BarChart from '@/components/ui/BarChart';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const { user, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Hydrate auth state once on mount
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    // Check if Firebase auth is available
    if (!auth) {
      setError('Firebase authentication not available');
      setLoading(false);
      return;
    }

    // Check Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login');
        return;
      }

      // Check if user is authenticated in store
      if (!user) {
        router.push('/login');
        return;
      }

      const fetchMetrics = async () => {
        try {
          const data = await ReportsService.getDashboardMetrics();
          setMetrics(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load metrics');
        }
      };

      // Set up real-time listeners
      if (!db) {
        setError('Firebase not initialized');
        setLoading(false);
        return;
      }

      // Real-time listener for employees
      const employeesQuery = query(collection(db, 'employees'));
      const unsubscribeEmployees = onSnapshot(employeesQuery, () => {
        fetchMetrics();
      }, (error) => {
        console.error('Error listening to employees:', error);
      });

      // Real-time listener for attendance
      const attendanceQuery = query(collection(db, 'attendance'));
      const unsubscribeAttendance = onSnapshot(attendanceQuery, () => {
        fetchMetrics();
      }, (error) => {
        console.error('Error listening to attendance:', error);
      });

      // Real-time listener for leaves
      const leavesQuery = query(collection(db, 'leaves'));
      const unsubscribeLeaves = onSnapshot(leavesQuery, () => {
        fetchMetrics();
      }, (error) => {
        console.error('Error listening to leaves:', error);
      });

      // Real-time listener for salaries
      const salariesQuery = query(collection(db, 'salary'));
      const unsubscribeSalaries = onSnapshot(salariesQuery, () => {
        fetchMetrics();
      }, (error) => {
        console.error('Error listening to salaries:', error);
      });

      // Initial fetch
      fetchMetrics();

      // Fetch attendance chart data
      const fetchChartData = async () => {
        try {
          // Fetch last 7 days attendance data for chart
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const attendanceSummary = await ReportsService.getAttendanceSummary(startDate, endDate);

          // Convert to chart format
          const chartData = attendanceSummary.slice(-5).map((summary, index) => {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const date = new Date(summary.date);
            return {
              label: days[date.getDay()],
              value: summary.attendancePercentage,
              color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
            };
          });
          setAttendanceData(chartData);
        } catch (err) {
          console.error('Error fetching chart data:', err);
        }
      };

      fetchChartData();

      // Fetch recent activities
      const fetchActivities = async () => {
        try {
          const activities = await ReportsService.getAdminRecentActivities();
          setRecentActivities(activities);
        } catch (err) {
          console.error('Error fetching activities:', err);
        }
      };

      fetchActivities();

      return () => {
        unsubscribeEmployees();
        unsubscribeAttendance();
        unsubscribeLeaves();
        unsubscribeSalaries();
      };
    });

    return () => unsubscribe();
  }, [user, router]); // Removed hydrate from dependencies

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 lg:space-y-8 p-4 lg:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-blue-100 text-sm lg:text-base">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {metrics && (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Employees */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 lg:p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Employees</p>
                  <p className="text-3xl font-bold mt-1">
                    {metrics.totalEmployees}
                  </p>
                  <p className="text-blue-200 text-xs mt-2">Active workforce</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 lg:p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Departments</p>
                  <p className="text-3xl font-bold mt-1">
                    {metrics.totalDepartments}
                  </p>
                  <p className="text-green-200 text-xs mt-2">Organizational units</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Today Attendance */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 lg:p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Today's Attendance</p>
                  <p className="text-3xl font-bold mt-1">
                    {metrics.todayAttendance}
                  </p>
                  <p className="text-purple-200 text-xs mt-2">Present today</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pending Leaves */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-4 lg:p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending Leaves</p>
                  <p className="text-3xl font-bold mt-1">
                    {metrics.pendingLeaves}
                  </p>
                  <p className="text-orange-200 text-xs mt-2">Awaiting approval</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Attendance */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-4 lg:p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Avg Attendance %</p>
                  <p className="text-3xl font-bold mt-1">
                    {metrics.averageAttendance}%
                  </p>
                  <p className="text-indigo-200 text-xs mt-2">Monthly average</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Payroll */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-4 lg:p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Total Payroll</p>
                  <p className="text-3xl font-bold mt-1">
                    ${(metrics.totalPayroll / 1000).toFixed(1)}K
                  </p>
                  <p className="text-emerald-200 text-xs mt-2">Monthly expenditure</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Chart */}
            <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Weekly Attendance Trend</h3>
              <BarChart data={attendanceData} />
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Activities</h3>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className={`flex items-center space-x-3 p-3 bg-${activity.color}-50 rounded-lg`}>
                      <div className={`w-8 h-8 bg-${activity.color}-100 rounded-full flex items-center justify-center`}>
                        {activity.icon === 'user' && (
                          <svg className={`w-4 h-4 text-${activity.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                        {activity.icon === 'check' && (
                          <svg className={`w-4 h-4 text-${activity.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {activity.icon === 'dollar' && (
                          <svg className={`w-4 h-4 text-${activity.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a
                href="/dashboard-admin/employees"
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 text-center transition-all duration-300 transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700 group-hover:text-blue-700">Manage Employees</p>
              </a>
              <a
                href="/dashboard-admin/attendance"
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 text-center transition-all duration-300 transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700 group-hover:text-green-700">Mark Attendance</p>
              </a>
              <a
                href="/dashboard-admin/leaves"
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 text-center transition-all duration-300 transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700 group-hover:text-orange-700">Approve Leaves</p>
              </a>
              <a
                href="/dashboard-admin/salary"
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 text-center transition-all duration-300 transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700 group-hover:text-purple-700">Manage Salary</p>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
