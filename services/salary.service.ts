// services/salary.service.ts - Salary Management Service

import { where } from 'firebase/firestore';
import { FirestoreDB } from '@/lib/firestore';
import { SalaryCalculator } from '@/lib/calculations';
import { Salary, SalaryConfig, Allowance, Deduction } from '@/types/salary';

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
      await FirestoreDB.addDocument(this.CONFIG_COLLECTION, config);
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
      const calculations = SalaryCalculator.calculateFullSalary(
        baseSalary,
        allowances,
        deductions
      );

      const salary: Salary = {
        id: '',
        userId,
        baseSalary,
        allowances,
        deductions,
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
}
