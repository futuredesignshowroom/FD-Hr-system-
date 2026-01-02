// services/reports.service.ts - Reports and Analytics Service

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  Firestore,
  orderBy,
  limit,
} from 'firebase/firestore';
import { LeaveConfigService } from './leave-config.service';

// Helper function to ensure db is available
function ensureDb(): Firestore {
  if (!db) {
    throw new Error('Firebase not initialized. Please check your environment variables.');
  }
  return db;
}

export interface DashboardMetrics {
  totalEmployees: number;
  totalDepartments: number;
  todayAttendance: number;
  pendingLeaves: number;
  averageAttendance: number;
  totalPayroll: number;
}

export interface DepartmentSummary {
  department: string;
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  pendingLeaves: number;
  totalSalary: number;
}

export interface AttendanceSummary {
  date: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendancePercentage: number;
}

export interface LeaveSummary {
  month: string;
  approved: number;
  pending: number;
  rejected: number;
  totalDays: number;
}

export interface RecentActivity {
  id: string;
  type: 'new_employee' | 'leave_approved' | 'salary_processed';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export class ReportsService {
  /**
   * Get admin dashboard metrics
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const firestore = ensureDb();
    try {
      // Count total employees
      const employeesRef = collection(firestore, 'employees');
      const employeesSnapshot = await getCountFromServer(employeesRef);
      const totalEmployees = employeesSnapshot.data().count;

      // Count total departments
      const employeesDocs = await getDocs(employeesRef);
      const departments = new Set(
        employeesDocs.docs
          .map((doc: any) => doc.data().department)
          .filter(Boolean)
      );
      const totalDepartments = departments.size;

      // Count today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceRef = collection(firestore, 'attendance');
      const todayAttendanceSnapshot = await getCountFromServer(
        query(attendanceRef, where('date', '==', today))
      );
      const todayAttendance = todayAttendanceSnapshot.data().count;

      // Count pending leaves
      const leavesRef = collection(firestore, 'leaves');
      const pendingLeavesSnapshot = await getCountFromServer(
        query(leavesRef, where('status', '==', 'pending'))
      );
      const pendingLeaves = pendingLeavesSnapshot.data().count;

      // Calculate average attendance percentage
      const allAttendance = await getDocs(attendanceRef);
      const presentCount = allAttendance.docs.filter(
        (doc: any) => doc.data().status === 'present'
      ).length;
      const averageAttendance =
        allAttendance.size > 0
          ? Math.round((presentCount / allAttendance.size) * 100)
          : 0;

      // Calculate total payroll
      const salariesRef = collection(firestore, 'salary');
      const salariesSnapshot = await getDocs(salariesRef);
      let totalPayroll = 0;
      salariesSnapshot.forEach((doc: any) => {
        totalPayroll += doc.data().netSalary || 0;
      });

      return {
        totalEmployees,
        totalDepartments,
        todayAttendance,
        pendingLeaves,
        averageAttendance,
        totalPayroll,
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      // Return default metrics instead of throwing to prevent infinite retries
      return {
        totalEmployees: 0,
        totalDepartments: 0,
        todayAttendance: 0,
        pendingLeaves: 0,
        averageAttendance: 0,
        totalPayroll: 0,
      };
    }
  }

  /**
   * Get department-wise summary
   */
  static async getDepartmentSummary(): Promise<DepartmentSummary[]> {
    const firestore = ensureDb();
    try {
      const departmentMap = new Map<string, DepartmentSummary>();

      // Get all employees
      const usersRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(
        query(usersRef, where('role', '==', 'employee'))
      );

      // Initialize department summaries
      usersSnapshot.forEach((doc: any) => {
        const dept = doc.data().department || 'Unassigned';
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, {
            department: dept,
            totalEmployees: 0,
            presentToday: 0,
            absentToday: 0,
            pendingLeaves: 0,
            totalSalary: 0,
          });
        }
        const summary = departmentMap.get(dept)!;
        summary.totalEmployees += 1;
      });

      // Get today's attendance by department
      const today = new Date().toISOString().split('T')[0];
      const attendanceRef = collection(firestore, 'attendance');
      const todayAttendance = await getDocs(
        query(attendanceRef, where('date', '==', today))
      );

      for (const dept of departmentMap.keys()) {
        const deptAttendance = todayAttendance.docs.filter((doc: any) => {
          const userId = doc.data().userId;
          const userDoc = usersSnapshot.docs.find((u: any) => u.id === userId);
          return userDoc?.data().department === dept;
        });

        const summary = departmentMap.get(dept)!;
        summary.presentToday = deptAttendance.filter(
          (doc: any) => doc.data().status === 'present'
        ).length;
        summary.absentToday = deptAttendance.filter(
          (doc: any) => doc.data().status === 'absent'
        ).length;
      }

      // Get pending leaves by department
      const leavesRef = collection(firestore, 'leaves');
      const pendingLeaves = await getDocs(
        query(leavesRef, where('status', '==', 'pending'))
      );

      for (const leave of pendingLeaves.docs) {
        const userId = leave.data().userId;
        const userDoc = usersSnapshot.docs.find((u: any) => u.id === userId);
        const dept = userDoc?.data().department || 'Unassigned';
        const summary = departmentMap.get(dept);
        if (summary) {
          summary.pendingLeaves += 1;
        }
      }

      // Get salary totals by department
      const salariesRef = collection(firestore, 'salary');
      const allSalaries = await getDocs(salariesRef);

      for (const salary of allSalaries.docs) {
        const userId = salary.data().userId;
        const userDoc = usersSnapshot.docs.find((u: any) => u.id === userId);
        const dept = userDoc?.data().department || 'Unassigned';
        const summary = departmentMap.get(dept);
        if (summary) {
          summary.totalSalary += salary.data().netSalary || 0;
        }
      }

      return Array.from(departmentMap.values());
    } catch (error) {
      console.error('Error getting department summary:', error);
      throw error;
    }
  }

  /**
   * Get attendance summary for a date range
   */
  static async getAttendanceSummary(
    startDate: string,
    endDate: string
  ): Promise<AttendanceSummary[]> {
    const firestore = ensureDb();
    try {
      const summaries: { [key: string]: AttendanceSummary } = {};

      const attendanceRef = collection(firestore, 'attendance');
      const attendanceDocs = await getDocs(
        query(
          attendanceRef,
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        )
      );

      attendanceDocs.forEach((doc: any) => {
        const data = doc.data();
        const date = data.date;

        if (!summaries[date]) {
          summaries[date] = {
            date,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            attendancePercentage: 0,
          };
        }

        const summary = summaries[date];
        if (data.status === 'present') summary.presentCount += 1;
        else if (data.status === 'absent') summary.absentCount += 1;
        else if (data.status === 'late') summary.lateCount += 1;
      });

      // Calculate attendance percentage
      for (const date in summaries) {
        const summary = summaries[date];
        const total =
          summary.presentCount + summary.absentCount + summary.lateCount;
        if (total > 0) {
          summary.attendancePercentage = Math.round(
            ((summary.presentCount + summary.lateCount) / total) * 100
          );
        }
      }

      return Object.values(summaries).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    } catch (error) {
      console.error('Error getting attendance summary:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Get leave summary for a month
   */
  static async getLeaveSummary(year: number, month: number): Promise<LeaveSummary> {
    const firestore = ensureDb();
    try {
      const startDate = new Date(year, month - 1, 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const leavesRef = collection(firestore, 'leaves');
      const leaves = await getDocs(
        query(
          leavesRef,
          where('startDate', '>=', startDate),
          where('endDate', '<=', endDate)
        )
      );

      let approved = 0;
      let pending = 0;
      let rejected = 0;
      let totalDays = 0;

      leaves.forEach((doc: any) => {
        const data = doc.data();
        const days = data.totalDays || 1;

        if (data.status === 'approved') {
          approved += 1;
          totalDays += days;
        } else if (data.status === 'pending') {
          pending += 1;
        } else if (data.status === 'rejected') {
          rejected += 1;
        }
      });

      return {
        month: `${year}-${String(month).padStart(2, '0')}`,
        approved,
        pending,
        rejected,
        totalDays,
      };
    } catch (error) {
      console.error('Error getting leave summary:', error);
      throw error;
    }
  }

  /**
   * Get employee performance summary
   */
  static async getEmployeePerformance(userId: string): Promise<any> {
    const firestore = ensureDb();
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    try {
      const monthStart = new Date(currentYear, currentMonth - 1, 1)
        .toISOString()
        .split('T')[0];
      const monthEnd = new Date(currentYear, currentMonth, 0)
        .toISOString()
        .split('T')[0];

      // Get attendance for current month
      const attendanceRef = collection(firestore, 'attendance');
      let presentDays = 0;
      let totalDays = 0;
      let attendancePercentage = 0;

      try {
        const monthAttendance = await getDocs(
          query(
            attendanceRef,
            where('userId', '==', userId),
            where('date', '>=', monthStart),
            where('date', '<=', monthEnd)
          )
        );

        presentDays = monthAttendance.docs.filter(
          (doc: any) => doc.data().status === 'present'
        ).length;
        totalDays = monthAttendance.size;
        attendancePercentage =
          totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      } catch (attendanceError: any) {
        console.warn('Attendance query failed (may need index):', attendanceError);
        // Fallback: get all attendance for user and filter in memory
        const allAttendance = await getDocs(
          query(attendanceRef, where('userId', '==', userId))
        );
        const monthAttendance = allAttendance.docs.filter((doc: any) => {
          const date = doc.data().date;
          return date >= monthStart && date <= monthEnd;
        });
        presentDays = monthAttendance.filter(
          (doc: any) => doc.data().status === 'present'
        ).length;
        totalDays = monthAttendance.length;
        attendancePercentage =
          totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      }

      let approvedLeaveDays = 0;

      try {
        // Get leaves for current month
        const leavesRef = collection(firestore, 'leaves');
        const monthLeaves = await getDocs(
          query(
            leavesRef,
            where('userId', '==', userId),
            where('status', '==', 'approved'),
            where('startDate', '>=', monthStart),
            where('startDate', '<=', monthEnd)
          )
        );

        monthLeaves.forEach((doc: any) => {
          approvedLeaveDays += doc.data().totalDays || 1;
        });
      } catch (leavesError: any) {
        console.warn('Leaves query failed (may need index):', leavesError);
        // Fallback: get all approved leaves for user and filter in memory
        const leavesRef = collection(firestore, 'leaves');
        const allLeaves = await getDocs(
          query(leavesRef, where('userId', '==', userId), where('status', '==', 'approved'))
        );
        const monthLeaves = allLeaves.docs.filter((doc: any) => {
          const startDate = doc.data().startDate;
          return startDate >= monthStart && startDate <= monthEnd;
        });
        monthLeaves.forEach((doc: any) => {
          approvedLeaveDays += doc.data().totalDays || 1;
        });
      }

      // Get salary for current month
      const salaryRef = collection(firestore, 'salary');
      let salary = 0;

      try {
        const currentSalary = await getDocs(
          query(
            salaryRef,
            where('userId', '==', userId),
            where('month', '==', currentMonth),
            where('year', '==', currentYear)
          )
        );

        salary = currentSalary.empty
          ? 0
          : currentSalary.docs[0].data().netSalary;
      } catch (salaryError: any) {
        console.warn('Salary query failed (may need index):', salaryError);
        // Fallback: get all salaries for user and filter in memory
        const allSalaries = await getDocs(
          query(salaryRef, where('userId', '==', userId))
        );
        const currentSalary = allSalaries.docs.find((doc: any) => {
          const data = doc.data();
          return data.month === currentMonth && data.year === currentYear;
        });
        salary = currentSalary ? currentSalary.data().netSalary : 0;
      }

      // Get leave balances for current year
      const leaveBalances = await LeaveConfigService.getUserLeaveBalance(userId, currentYear);
      const totalLeaveBalance = leaveBalances.reduce((total, balance) => total + balance.totalAllowed, 0);
      const usedLeaves = leaveBalances.reduce((total, balance) => total + balance.used, 0);
      const remainingLeaves = leaveBalances.reduce((total, balance) => total + balance.remaining, 0);

      return {
        userId,
        month: currentMonth,
        year: currentYear,
        attendance: {
          presentDays,
          totalDays,
          percentage: attendancePercentage,
        },
        leaves: {
          approvedDays: approvedLeaveDays,
          totalBalance: totalLeaveBalance,
          used: usedLeaves,
          remaining: remainingLeaves,
        },
        salary,
      };
    } catch (error) {
      console.error('Error getting employee performance:', error);
      // Return default performance data instead of throwing
      return {
        userId,
        month: currentMonth,
        year: currentYear,
        attendance: {
          presentDays: 0,
          totalDays: 0,
          percentage: 0,
        },
        leaves: {
          approvedDays: 0,
          totalBalance: 0,
          used: 0,
          remaining: 0,
        },
        salary: 0,
      };
    }
  }

  /**
   * Get recent activities for an employee
   */
  static async getEmployeeRecentActivities(userId: string): Promise<any[]> {
    const firestore = ensureDb();
    try {
      const activities: any[] = [];

      // Get recent attendance (last 5)
      const attendanceRef = collection(firestore, 'attendance');
      const recentAttendance = await getDocs(
        query(
          attendanceRef,
          where('userId', '==', userId),
          orderBy('date', 'desc'),
          limit(3)
        )
      );

      recentAttendance.forEach((doc: any) => {
        const data = doc.data();
        activities.push({
          type: 'attendance',
          title: 'Attendance marked',
          description: `${data.date} at ${data.checkInTime ? new Date(data.checkInTime.seconds * 1000).toLocaleTimeString() : 'N/A'}`,
          icon: 'check',
          color: 'green',
        });
      });

      // Get recent salary (last 1)
      const salaryRef = collection(firestore, 'salary');
      const recentSalary = await getDocs(
        query(
          salaryRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
      );

      if (!recentSalary.empty) {
        const salaryData = recentSalary.docs[0].data();
        activities.push({
          type: 'salary',
          title: 'Salary credited',
          description: `${salaryData.month}/${salaryData.year}`,
          icon: 'dollar',
          color: 'blue',
        });
      }

      // Get recent approved leaves (last 2)
      const leavesRef = collection(firestore, 'leaves');
      const recentLeaves = await getDocs(
        query(
          leavesRef,
          where('userId', '==', userId),
          where('status', '==', 'approved'),
          orderBy('updatedAt', 'desc'),
          limit(2)
        )
      );

      recentLeaves.forEach((doc: any) => {
        const data = doc.data();
        const days = Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        activities.push({
          type: 'leave',
          title: 'Leave approved',
          description: `${days} days ${data.leaveType} leave`,
          icon: 'calendar',
          color: 'purple',
        });
      });

      // Sort by some logic (recent first) and limit to 5
      return activities.slice(0, 5);
    } catch (error) {
      console.error('Error getting employee recent activities:', error);
      return [];
    }
  }

  /**
   * Get recent activities for admin dashboard
   */
  static async getAdminRecentActivities(): Promise<RecentActivity[]> {
    const firestore = ensureDb();
    try {
      const activities: RecentActivity[] = [];

      // Get recent new employees (last 2)
      const usersRef = collection(firestore, 'users');
      const recentEmployees = await getDocs(
        query(
          usersRef,
          where('role', '==', 'employee'),
          orderBy('createdAt', 'desc'),
          limit(2)
        )
      );

      recentEmployees.forEach((doc: any) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'new_employee',
          title: 'New employee joined',
          description: `${data.firstName} ${data.lastName} - ${data.department || 'Department'}`,
          timestamp: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
          icon: 'user',
          color: 'blue',
        });
      });

      // Get recent approved leaves (last 2)
      const leavesRef = collection(firestore, 'leaves');
      const recentLeaves = await getDocs(
        query(
          leavesRef,
          where('status', '==', 'approved'),
          orderBy('updatedAt', 'desc'),
          limit(2)
        )
      );

      for (const doc of recentLeaves.docs) {
        const data = doc.data();
        // Get employee name
        const employeeDoc = await getDocs(
          query(usersRef, where('id', '==', data.userId))
        );
        const employeeName = employeeDoc.docs.length > 0 
          ? `${employeeDoc.docs[0].data().firstName} ${employeeDoc.docs[0].data().lastName}`
          : 'Unknown Employee';
        
        const days = Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        activities.push({
          id: doc.id,
          type: 'leave_approved',
          title: 'Leave approved',
          description: `${employeeName} - ${days} days`,
          timestamp: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date(),
          icon: 'check',
          color: 'green',
        });
      }

      // Get recent salary processing (last 1)
      const salaryRef = collection(firestore, 'salary');
      const recentSalaries = await getDocs(
        query(
          salaryRef,
          orderBy('createdAt', 'desc'),
          limit(1)
        )
      );

      if (!recentSalaries.empty) {
        const salaryData = recentSalaries.docs[0].data();
        const monthName = new Date(salaryData.createdAt.seconds * 1000).toLocaleString('default', { month: 'long' });
        const year = new Date(salaryData.createdAt.seconds * 1000).getFullYear();
        
        activities.push({
          id: recentSalaries.docs[0].id,
          type: 'salary_processed',
          title: 'Salary processed',
          description: `${monthName} ${year} payroll`,
          timestamp: salaryData.createdAt ? new Date(salaryData.createdAt.seconds * 1000) : new Date(),
          icon: 'dollar',
          color: 'orange',
        });
      }

      // Sort by timestamp (most recent first) and limit to 5
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting admin recent activities:', error);
      return [];
    }
  }
}
