export interface Salary {
  id: string;
  userId: string;
  baseSalary: number;
  allowances: Allowance[];
  deductions: Deduction[];
  perDaySalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  month: number;
  year: number;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Allowance {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
}

export interface Deduction {
  id: string;
  name: string;
  amount: number;
  reason?: 'leave' | 'absent' | 'advance' | 'tax' | 'insurance' | 'other';
}

export interface SalaryConfig {
  userId: string;
  baseSalary: number;
  allowances: Allowance[];
  deductions?: Deduction[];
  totalLeavesAllowed: number;
  workingDaysPerMonth: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryBreakdown {
  baseSalary: number;
  allowances: {
    name: string;
    amount: number;
  }[];
  deductions: {
    name: string;
    amount: number;
    reason?: string;
  }[];
  netSalary: number;
}
