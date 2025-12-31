export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = 'sick' | 'casual' | 'earned' | 'unpaid' | 'maternity' | 'paternity';

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  status: LeaveStatus;
  reason: string;
  approvedBy?: string;
  approvedDate?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeavePolicy {
  id: string;
  leaveType: LeaveType;
  allowedDaysPerYear: number;
  carryForwardDays: number;
  requiresApproval: boolean;
}

export interface LeaveBalance {
  userId: string;
  leaveType: LeaveType;
  totalAllowed: number;
  used: number;
  remaining: number;
  carryForward: number;
  year: number;
}
