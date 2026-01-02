// services/salary.service.ts - Salary Management Service

import { where } from 'firebase/firestore';
import { FirestoreDB } from '@/lib/firestore';
import { SalaryCalculator } from '@/lib/calculations';
import { Salary, SalaryConfig, Allowance, Deduction } from '@/types/salary';
import { NotificationService } from './notification.service';

export class SalaryService {
  private static readonly COLLECTION = 'salary';
  private static readonly CONFIG_COLLECTION = 'salaryConfig';

  /**
   * Create salary for an employee
   */
  static async createSalary(salary: Salary): Promise<void> {
    try {
      await FirestoreDB.addDocument(this.COLLECTION, salary);
    } catch (error) {
      console.error('Error creating salary:', error);
      throw error;
    }
  }

  /**
   * Get salary for a specific month and year
   */
  static async getSalary(
    userId: string,
    month: number,
    year: number
  ): Promise<Salary | null> {
    try {
      const [salary] = await FirestoreDB.queryCollection<Salary>(
        this.COLLECTION,
        [
          where('userId', '==', userId),
          where('month', '==', month),
          where('year', '==', year),
        ]
      );
      return salary || null;
    } catch (error) {
      console.error('Error getting salary:', error);
      // Return null instead of throwing
      return null;
    }
  }

  /**
   * Get all salaries for an employee
   */
  static async getEmployeeSalaries(userId: string): Promise<Salary[]> {
    try {
      return await FirestoreDB.queryCollection<Salary>(this.COLLECTION, [
        where('userId', '==', userId),
      ]);
    } catch (error) {
      console.error('Error getting employee salaries:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Update salary
   */
  static async updateSalary(docId: string, updates: Partial<Salary>): Promise<void> {
    try {
      await FirestoreDB.updateDocument(this.COLLECTION, docId, updates);
    } catch (error) {
      console.error('Error updating salary:', error);
      throw error;
    }
  }

  /**
   * Set salary configuration for employee (Admin only)
   */
  static async setSalaryConfig(config: SalaryConfig): Promise<void> {
    try {
      // Store config under doc id = userId so updates overwrite instead of creating duplicates
      await FirestoreDB.addDocument(this.CONFIG_COLLECTION, config, config.userId);

      // After updating config, upsert current month's salary and notify the user
      try {
        const now = new Date();
        await this.calculateAndUpsertCurrentMonthSalary(config.userId, now.getMonth() + 1, now.getFullYear(), config);

        await NotificationService.createNotification({
          userId: config.userId,
          title: 'Salary Rules Updated',
          message: 'Your salary rules were updated by admin. Your current month salary has been recalculated.',
          type: 'system',
          isRead: false,
          data: { type: 'salary_rules_updated' },
        });
      } catch (notifyErr) {
        console.error('Error recalculating salary or notifying user after config update:', notifyErr);
      }
    } catch (error) {
      console.error('Error setting salary config:', error);
      throw error;
    }
  }

  /**
   * Get salary configuration for employee
   */
  static async getSalaryConfig(userId: string): Promise<SalaryConfig | null> {
    try {
      // Try direct document fetch (we store config with docId = userId)
      const doc = await FirestoreDB.getDocument<SalaryConfig>(this.CONFIG_COLLECTION, userId);
      if (doc) return doc;

      // Fallback to query if doc isn't present
      const [config] = await FirestoreDB.queryCollection<SalaryConfig>(
        this.CONFIG_COLLECTION,
        [where('userId', '==', userId)]
      );
      return config || null;
    } catch (error) {
      console.error('Error getting salary config:', error);
      // Return null instead of throwing
      return null;
    }
  }

  /**
   * Calculate and create salary for a month
   */
  static async calculateAndCreateSalary(
    userId: string,
    month: number,
    year: number,
    baseSalary: number,
    allowances: Allowance[],
    deductions: Deduction[]
  ): Promise<Salary> {
    try {
      // Get attendance for the month to calculate deductions
      const attendanceService = await import('./attendance.service');
      const attendanceRecord = await attendanceService.AttendanceService.getMonthlyAttendance(userId, month - 1, year); // month is 0-based in getMonthlyAttendance

      // Calculate working days in month
      const daysInMonth = new Date(year, month, 0).getDate();
      const workingDays = Math.min(26, daysInMonth); // Assume 26 working days or actual days if less

      // Calculate absent days (total working days - present days)
      const absentDays = workingDays - attendanceRecord.presentDays;

      // Calculate per day salary
      const perDaySalary = baseSalary / workingDays;

      // Add deduction for absent days
      const absentDeduction: Deduction = {
        id: 'absent-deduction',
        name: 'Absent Days Deduction',
        amount: absentDays * perDaySalary,
        reason: 'absent',
      };

      // Combine provided deductions with attendance deductions
      const allDeductions = [...deductions, absentDeduction];

      const calculations = SalaryCalculator.calculateFullSalary(
        baseSalary,
        allowances,
        allDeductions
      );

      const salary: Salary = {
        id: '',
        userId,
        baseSalary,
        allowances,
        deductions: allDeductions,
        month,
        year,
        perDaySalary: calculations.perDaySalary,
        totalAllowances: calculations.totalAllowances,
        totalDeductions: calculations.totalDeductions,
        netSalary: calculations.netSalary,
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await FirestoreDB.addDocument(this.COLLECTION, salary);
      salary.id = docRef.id;

      return salary;
    } catch (error) {
      console.error('Error calculating and creating salary:', error);
      throw error;
    }
  }

  /**
   * Update salary payment status
   */
  static async updatePaymentStatus(
    docId: string,
    paymentStatus: 'pending' | 'paid' | 'overdue',
    paymentDate?: Date
  ): Promise<void> {
    try {
      const updates: Partial<Salary> = {
        paymentStatus,
        updatedAt: new Date(),
      };

      if (paymentDate) {
        updates.paymentDate = paymentDate;
      }

      await FirestoreDB.updateDocument(this.COLLECTION, docId, updates);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Get salaries by payment status
   */
  static async getSalariesByStatus(
    paymentStatus: 'pending' | 'paid' | 'overdue'
  ): Promise<Salary[]> {
    try {
      return await FirestoreDB.queryCollection<Salary>(this.COLLECTION, [
        where('paymentStatus', '==', paymentStatus),
      ]);
    } catch (error) {
      console.error('Error getting salaries by status:', error);
      return [];
    }
  }

  /**
   * Get all salaries for payroll management (Admin only)
   */
  static async getAllSalaries(): Promise<Salary[]> {
    try {
      return await FirestoreDB.getCollection<Salary>(this.COLLECTION);
    } catch (error) {
      console.error('Error getting all salaries:', error);
      return [];
    }
  }

  /**
   * Subscribe to salaries collection in real-time
   */
  static subscribeSalaries(
    callback: (salaries: Salary[]) => void,
    onError?: (error: any) => void
  ): () => void {
    try {
      return FirestoreDB.subscribeCollection<Salary>(this.COLLECTION, [], callback, onError);
    } catch (error) {
      console.error('Error subscribing to salaries:', error);
      return () => {};
    }
  }

  /**
   * Subscribe to salary config for a specific user (real-time)
   */
  static subscribeSalaryConfig(
    userId: string,
    callback: (config: SalaryConfig | null) => void,
    onError?: (error: any) => void
  ): () => void {
    try {
      // Use document subscription since config docId == userId
      return FirestoreDB.subscribeDocument<SalaryConfig>(this.CONFIG_COLLECTION, userId, (doc) => {
        callback(doc || null);
      }, onError);
    } catch (error) {
      console.error('Error subscribing to salary config:', error);
      return () => {};
    }
  }

  /**
   * Calculate salary for current month and update or create the salary record
   */
  static async calculateAndUpsertCurrentMonthSalary(
    userId: string,
    month: number,
    year: number,
    config: SalaryConfig
  ): Promise<void> {
    try {
      const existing = await this.getSalary(userId, month, year);

      // Get attendance for the month to calculate deductions
      const attendanceService = await import('./attendance.service');
      const attendanceRecord = await attendanceService.AttendanceService.getMonthlyAttendance(userId, month - 1, year);

      // Calculate working days in month
      const daysInMonth = new Date(year, month, 0).getDate();
      const workingDays = Math.min(26, daysInMonth);

      // Calculate absent days
      const absentDays = workingDays - attendanceRecord.presentDays;

      // Calculate per day salary
      const perDaySalary = config.baseSalary / workingDays;

      // Add deduction for absent days
      const absentDeduction: Deduction = {
        id: 'absent-deduction',
        name: 'Absent Days Deduction',
        amount: absentDays * perDaySalary,
        reason: 'absent',
      };

      const deductions = [absentDeduction];

      const calculations = SalaryCalculator.calculateFullSalary(
        config.baseSalary,
        config.allowances,
        deductions
      );

      if (existing) {
        await this.updateSalary(existing.id, {
          baseSalary: config.baseSalary,
          allowances: config.allowances,
          deductions,
          perDaySalary: calculations.perDaySalary,
          totalAllowances: calculations.totalAllowances,
          totalDeductions: calculations.totalDeductions,
          netSalary: calculations.netSalary,
          updatedAt: new Date(),
        });
      } else {
        await this.calculateAndCreateSalary(
          userId,
          month,
          year,
          config.baseSalary,
          config.allowances,
          []
        );
      }
    } catch (error) {
      console.error('Error upserting current month salary:', error);
      throw error;
    }
  }
}

