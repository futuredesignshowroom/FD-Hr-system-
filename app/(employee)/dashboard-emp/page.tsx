'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { ReportsService } from '@/services/reports.service';
import { AttendanceService } from '@/services/attendance.service';
import Loader from '@/components/ui/Loader';
import ProgressBar from '@/components/ui/ProgressBar';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EmployeePerformance {
  attendance: { presentDays: number; totalDays: number; percentage: number };
  leaves: { approvedDays: number; totalBalance: number; used: number; remaining: number };
  salary: number;
}

interface Activity {
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export default function EmployeeDashboard() {
  const { user, hydrate } = useAuthStore();
  const [performance, setPerformance] = useState<EmployeePerformance | null>(
    null
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const router = useRouter();

  // Function to fetch performance data
  const fetchPerformance = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [performanceData, activitiesData] = await Promise.all([
        ReportsService.getEmployeePerformance(user.id),
        ReportsService.getEmployeeRecentActivities(user.id),
      ]);
      setPerformance(performanceData);
      setActivities(activitiesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load performance'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    const unsubscribe = onAuthStateChanged(auth!, (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login');
        return;
      }

      // Check if user is authenticated in store
      if (!user) {
        router.push('/login');
        return;
      }

      fetchPerformance();

      // Set up real-time listeners for employee's own data
      if (!db) {
        setError('Firebase not initialized');
        setLoading(false);
        return;
      }

      // Real-time listener for user's attendance
      const attendanceQuery = query(collection(db, 'attendance'), where('userId', '==', user.id));
      const unsubscribeAttendance = onSnapshot(attendanceQuery, () => {
        fetchPerformance();
      }, (error) => {
        console.error('Error listening to attendance:', error);
      });

      // Real-time listener for user's leaves
      const leavesQuery = query(collection(db, 'leaves'), where('userId', '==', user.id));
      const unsubscribeLeaves = onSnapshot(leavesQuery, () => {
        fetchPerformance();
      }, (error) => {
        console.error('Error listening to leaves:', error);
      });

      // Real-time listener for user's salary
      const salaryQuery = query(collection(db, 'salary'), where('userId', '==', user.id));
      const unsubscribeSalary = onSnapshot(salaryQuery, () => {
        fetchPerformance();
      }, (error) => {
        console.error('Error listening to salary:', error);
      });

      // Real-time listener for leave config changes (when admin updates policies)
      const configQuery = query(collection(db, 'leaveConfig'));
      const unsubscribeConfig = onSnapshot(configQuery, () => {
        fetchPerformance();
      }, (error) => {
        console.error('Error listening to leave config:', error);
      });

      // Real-time listener for user's leave balance changes (when admin updates balances)
      const balanceQuery = query(collection(db, 'leaveBalance'), where('userId', '==', user.id));
      const unsubscribeBalance = onSnapshot(balanceQuery, () => {
        fetchPerformance();
      }, (error) => {
        console.error('Error listening to leave balance:', error);
      });

      return () => {
        unsubscribeAttendance();
        unsubscribeLeaves();
        unsubscribeSalary();
        unsubscribeConfig();
        unsubscribeBalance();
      };
    });

    return () => unsubscribe();
  }, [user, router, fetchPerformance]); // Removed hydrate from dependencies

  const handleCheckIn = async () => {
    if (!user) return;

    try {
      setCheckingIn(true);
      await AttendanceService.checkIn(user.id);
      setLastCheckIn(new Date());
      // Refresh performance data
      if (performance) {
        setPerformance({
          ...performance,
          attendance: {
            ...performance.attendance,
            presentDays: performance.attendance.presentDays + 1
          }
        });
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      setError('Failed to check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;

    try {
      setCheckingOut(true);
      // Find today's check-in record from database
      const todayRecord = await AttendanceService.getTodaysCheckIn(user.id);

      if (todayRecord && todayRecord.id && !todayRecord.checkOutTime) {
        await AttendanceService.checkOut(todayRecord.id);
        // Refresh performance data
        if (performance) {
          fetchPerformance();
        }
      } else if (todayRecord && todayRecord.checkOutTime) {
        setError('Already checked out for today.');
      } else {
        setError('No check-in record found for today.');
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      setError('Failed to check out. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 lg:space-y-8 p-4 lg:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 lg:p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-green-100 text-sm lg:text-base">{user?.department} • Employee Dashboard</p>
            <p className="text-green-200 text-xs lg:text-sm mt-2">Here&apos;s your performance overview</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {performance && (
        <>
          {/* Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Attendance */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 lg:p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Attendance Rate</p>
                  <p className="text-3xl font-bold mt-1">
                    {performance.attendance.percentage}%
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <ProgressBar
                value={performance.attendance.presentDays}
                max={performance.attendance.totalDays}
                color="bg-white"
                label=""
              />
              <p className="text-blue-200 text-xs mt-2">
                {performance.attendance.presentDays}/{performance.attendance.totalDays} days this month
              </p>
            </div>

            {/* Leaves Used */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-4 lg:p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Leaves Used</p>
                  <p className="text-3xl font-bold mt-1">
                    {performance.leaves.used}
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <ProgressBar
                value={performance.leaves.used}
                max={performance.leaves.totalBalance}
                color="bg-white"
                label=""
              />
              <p className="text-orange-200 text-xs mt-2">
                {performance.leaves.remaining} days remaining this year
              </p>
            </div>

            {/* Current Salary */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 lg:p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-green-100 text-sm font-medium">Current Salary</p>
                  <p className="text-3xl font-bold mt-1">
                    ${(performance.salary / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-green-200 text-xs mt-2">
                Monthly gross salary
              </p>
            </div>

            {/* Status */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-4 lg:p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Status</p>
                  <p className="text-3xl font-bold mt-1">Active</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-emerald-200 text-xs mt-2">
                All systems operational
              </p>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Goals */}
            <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Monthly Goals</h3>
              <div className="space-y-4">
                <div>
                  <ProgressBar
                    value={performance.attendance.presentDays}
                    max={22}
                    color="bg-blue-500"
                    label="Attendance Target"
                  />
                  <p className="text-xs text-gray-500 mt-1">Aim for 95% attendance</p>
                </div>
                <div>
                  <ProgressBar
                    value={performance.leaves.approvedDays}
                    max={2}
                    color="bg-orange-500"
                    label="Leave Balance"
                  />
                  <p className="text-xs text-gray-500 mt-1">Keep leaves under control</p>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Activities</h3>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <div key={index} className={`flex items-center space-x-3 p-3 bg-${activity.color}-50 rounded-lg`}>
                      <div className={`w-8 h-8 bg-${activity.color}-100 rounded-full flex items-center justify-center`}>
                        {activity.icon === 'check' && (
                          <svg className={`w-4 h-4 text-${activity.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        )}
                        {activity.icon === 'dollar' && (
                          <svg className={`w-4 h-4 text-${activity.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {activity.icon === 'calendar' && (
                          <svg className={`w-4 h-4 text-${activity.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
            
            {/* Check In/Out Buttons */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Attendance</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {checkingIn ? 'Checking In...' : 'Check In'}
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={checkingOut}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {checkingOut ? 'Checking Out...' : 'Check Out'}
                </button>
              </div>
              {lastCheckIn && (
                <p className="text-sm text-gray-600 mt-2">
                  Last check-in: {lastCheckIn.toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a
                href="/dashboard-emp/attendance"
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 text-center transition-all duration-300 transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700 group-hover:text-blue-700">Check Attendance</p>
              </a>
              <a
                href="/dashboard-emp/leaves"
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 text-center transition-all duration-300 transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700 group-hover:text-orange-700">Apply Leave</p>
              </a>
              <a
                href="/dashboard-emp/salary"
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 text-center transition-all duration-300 transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700 group-hover:text-green-700">View Salary</p>
              </a>
              <a
                href="/dashboard-emp/messages"
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 text-center transition-all duration-300 transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700 group-hover:text-purple-700">Messages</p>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
