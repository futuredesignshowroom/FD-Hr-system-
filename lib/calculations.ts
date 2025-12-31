// lib/calculations.ts - Salary and Leave Calculations

import { Allowance, Deduction } from '@/types/salary';
import { LeaveRequest } from '@/types/leave';

export class SalaryCalculator {
  /**
   * Calculate per-day salary
   * perDaySalary = baseSalary / workingDays
   */
  static calculatePerDaySalary(
    baseSalary: number,
    workingDaysPerMonth: number = 26
  ): number {
    return baseSalary / workingDaysPerMonth;
  }

  /**
   * Calculate total allowances
   */
  static calculateTotalAllowances(allowances: Allowance[]): number {
    return allowances.reduce((total, allowance) => {
      return total + allowance.amount;
    }, 0);
  }

  /**
   * Calculate leave deductions
   * deduction = unpaidLeaves * perDaySalary
   */
  static calculateLeaveDeduction(
    unpaidLeaves: number,
    perDaySalary: number
  ): number {
    return unpaidLeaves * perDaySalary;
  }

  /**
   * Calculate total deductions
   */
  static calculateTotalDeductions(deductions: Deduction[]): number {
    return deductions.reduce((total, deduction) => {
      return total + deduction.amount;
    }, 0);
  }

  /**
   * Calculate net salary
   * netSalary = baseSalary + allowances - deductions
   */
  static calculateNetSalary(
    baseSalary: number,
    totalAllowances: number,
    totalDeductions: number
  ): number {
    return baseSalary + totalAllowances - totalDeductions;
  }

  /**
   * Full salary calculation
   */
  static calculateFullSalary(
    baseSalary: number,
    allowances: Allowance[],
    deductions: Deduction[],
    workingDaysPerMonth: number = 26
  ): {
    perDaySalary: number;
    totalAllowances: number;
    totalDeductions: number;
    netSalary: number;
  } {
    const perDaySalary = this.calculatePerDaySalary(
      baseSalary,
      workingDaysPerMonth
    );
    const totalAllowances = this.calculateTotalAllowances(allowances);
    const totalDeductions = this.calculateTotalDeductions(deductions);
    const netSalary = this.calculateNetSalary(
      baseSalary,
      totalAllowances,
      totalDeductions
    );

    return {
      perDaySalary,
      totalAllowances,
      totalDeductions,
      netSalary,
    };
  }
}

export class AttendanceCalculator {
  /**
   * Calculate attendance percentage
   * attendancePercentage = (presentDays / totalDays) * 100
   */
  static calculateAttendancePercentage(
    presentDays: number,
    totalDays: number
  ): number {
    if (totalDays === 0) return 0;
    return (presentDays / totalDays) * 100;
  }

  /**
   * Calculate absent deduction
   */
  static calculateAbsentDeduction(
    absentDays: number,
    perDaySalary: number
  ): number {
    return absentDays * perDaySalary;
  }

  /**
   * Calculate half-day deduction
   */
  static calculateHalfDayDeduction(
    halfDays: number,
    perDaySalary: number
  ): number {
    return (halfDays / 2) * perDaySalary;
  }
}

export class LeaveCalculator {
  /**
   * Calculate leaves used
   */
  static calculateLeavesUsed(leaveRequests: LeaveRequest[]): number {
    return leaveRequests
      .filter((request) => request.status === 'approved')
      .reduce((total, request) => {
        const days =
          Math.ceil(
            (request.endDate.getTime() - request.startDate.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;
        return total + days;
      }, 0);
  }

  /**
   * Calculate remaining leaves
   * remaining = allowed - used
   */
  static calculateRemainingLeaves(
    allowedDays: number,
    usedDays: number
  ): number {
    return Math.max(0, allowedDays - usedDays);
  }

  /**
   * Check if leave balance available
   */
  static hasLeaveBalance(
    leaveDays: number,
    remainingBalance: number
  ): boolean {
    return leaveDays <= remainingBalance;
  }
}
