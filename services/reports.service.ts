// services/reports.service.ts - Reports and Analytics Service

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
} from 'firebase/firestore';

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

export class ReportsService {
  /**
   * Get admin dashboard metrics
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Count total employees
      const employeesRef = collection(db, 'users');
      const employeesSnapshot = await getCountFromServer(
        query(employeesRef, where('role', '==', 'employee'))
      );
      const totalEmployees = employeesSnapshot.data().count;

      // Count total departments
      const usersSnapshot = await getDocs(employeesRef);
      const departments = new Set(
        usersSnapshot.docs
          .map((doc: any) => doc.data().department)
          .filter(Boolean)
      );
      const totalDepartments = departments.size;

      // Count today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceRef = collection(db, 'attendance');
      const todayAttendanceSnapshot = await getCountFromServer(
        query(attendanceRef, where('date', '==', today))
      );
      const todayAttendance = todayAttendanceSnapshot.data().count;

      // Count pending leaves
      const leavesRef = collection(db, 'leaves');
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
      const salariesRef = collection(db, 'salary');
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
      throw error;
    }
  }

  /**
   * Get department-wise summary
   */
  static async getDepartmentSummary(): Promise<DepartmentSummary[]> {
    try {
      const departmentMap = new Map<string, DepartmentSummary>();

      // Get all employees
      const usersRef = collection(db, 'users');
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
      const attendanceRef = collection(db, 'attendance');
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
      const leavesRef = collection(db, 'leaves');
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
      const salariesRef = collection(db, 'salary');
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
    try {
      const summaries: { [key: string]: AttendanceSummary } = {};

      const attendanceRef = collection(db, 'attendance');
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
      throw error;
    }
  }

  /**
   * Get leave summary for a month
   */
  static async getLeaveSummary(year: number, month: number): Promise<LeaveSummary> {
    try {
      const startDate = new Date(year, month - 1, 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const leavesRef = collection(db, 'leaves');
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
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const monthStart = new Date(currentYear, currentMonth - 1, 1)
        .toISOString()
        .split('T')[0];
      const monthEnd = new Date(currentYear, currentMonth, 0)
        .toISOString()
        .split('T')[0];

      // Get attendance for current month
      const attendanceRef = collection(db, 'attendance');
      const monthAttendance = await getDocs(
        query(
          attendanceRef,
          where('userId', '==', userId),
          where('date', '>=', monthStart),
          where('date', '<=', monthEnd)
        )
      );

      const presentDays = monthAttendance.docs.filter(
        (doc: any) => doc.data().status === 'present'
      ).length;
      const totalDays = monthAttendance.size;
      const attendancePercentage =
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Get leaves for current month
      const leavesRef = collection(db, 'leaves');
      const monthLeaves = await getDocs(
        query(
          leavesRef,
          where('userId', '==', userId),
          where('status', '==', 'approved'),
          where('startDate', '>=', monthStart),
          where('startDate', '<=', monthEnd)
        )
      );

      let approvedLeaveDays = 0;
      monthLeaves.forEach((doc: any) => {
        approvedLeaveDays += doc.data().totalDays || 1;
      });

      // Get salary for current month
      const salaryRef = collection(db, 'salary');
      const currentSalary = await getDocs(
        query(
          salaryRef,
          where('userId', '==', userId),
          where('month', '==', currentMonth),
          where('year', '==', currentYear)
        )
      );

      const salary = currentSalary.empty
        ? 0
        : currentSalary.docs[0].data().netSalary;

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
        },
        salary,
      };
    } catch (error) {
      console.error('Error getting employee performance:', error);
      throw error;
    }
  }
}
