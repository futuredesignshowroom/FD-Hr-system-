// services/leave.service.ts - Leave Management Service

import { where } from 'firebase/firestore';
import { FirestoreDB } from '@/lib/firestore';
import { LeaveCalculator } from '@/lib/calculations';
import { NotificationService } from './notification.service';
import { EmployeeService } from './employee.service';
import {
  LeaveRequest,
  LeavePolicy,
  LeaveBalance,
  LeaveStatus,
  LeaveType,
} from '@/types/leave';

export class LeaveService {
  private static readonly COLLECTION = 'leaves';
  private static readonly POLICY_COLLECTION = 'leavePolicy';
  private static readonly BALANCE_COLLECTION = 'leaveBalance';

  /**
   * Apply for leave
   */
  static async applyLeave(leaveRequest: Omit<LeaveRequest, 'id'>): Promise<string> {
    try {
      const docRef = await FirestoreDB.addDocument(this.COLLECTION, leaveRequest);
      const leaveId = docRef.id;

      // Create notification for admin
      try {
        const employee = await EmployeeService.getEmployeeProfile(leaveRequest.userId);
        const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';

        await NotificationService.createLeaveRequestNotification(
          { ...leaveRequest, id: leaveId },
          employeeName
        );
      } catch (notificationError) {
        console.error('Error creating leave request notification:', notificationError);
        // Don't fail the leave application if notification fails
      }

      return leaveId;
    } catch (error) {
      console.error('Error applying for leave:', error);
      throw error;
    }
  }

  /**
   * Get leave requests for a user
   */
  static async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    try {
      return await FirestoreDB.queryCollection<LeaveRequest>(
        this.COLLECTION,
        [where('userId', '==', userId)]
      );
    } catch (error) {
      console.error('Error getting user leave requests:', error);
      throw error;
    }
  }

  /**
   * Get all leave requests (Admin only)
   */
  static async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    try {
      return await FirestoreDB.getCollection<LeaveRequest>(this.COLLECTION);
    } catch (error) {
      console.error('Error getting all leave requests:', error);
      throw error;
    }
  }

  /**
   * Get all pending leave requests (Admin only)
   */
  static async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    try {
      return await FirestoreDB.queryCollection<LeaveRequest>(
        this.COLLECTION,
        [where('status', '==', 'pending')]
      );
    } catch (error) {
      console.error('Error getting pending leave requests:', error);
      throw error;
    }
  }

  /**
   * Approve leave request (Admin only)
   */
  static async approveLeave(
    docId: string,
    adminId?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status: 'approved' as LeaveStatus,
        updatedAt: new Date(),
      };
      if (adminId) {
        updateData.approvedBy = adminId;
        updateData.approvedDate = new Date();
      }
      await FirestoreDB.updateDocument(this.COLLECTION, docId, updateData);
    } catch (error) {
      console.error('Error approving leave:', error);
      throw error;
    }
  }

  /**
   * Reject leave request (Admin only)
   */
  static async rejectLeave(
    docId: string,
    rejectionReason: string
  ): Promise<void> {
    try {
      await FirestoreDB.updateDocument(this.COLLECTION, docId, {
        status: 'rejected' as LeaveStatus,
        rejectionReason,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error rejecting leave:', error);
      throw error;
    }
  }

  /**
   * Create or update leave policy (Admin only)
   */
  static async setLeavePolicy(policy: LeavePolicy): Promise<void> {
    try {
      await FirestoreDB.addDocument(this.POLICY_COLLECTION, policy);
    } catch (error) {
      console.error('Error setting leave policy:', error);
      throw error;
    }
  }

  /**
   * Get leave policy for a type
   */
  static async getLeavePolicy(leaveType: LeaveType): Promise<LeavePolicy | null> {
    try {
      const [policy] = await FirestoreDB.queryCollection<LeavePolicy>(
        this.POLICY_COLLECTION,
        [where('leaveType', '==', leaveType)]
      );
      return policy || null;
    } catch (error) {
      console.error('Error getting leave policy:', error);
      throw error;
    }
  }

  /**
   * Get leave balance for user
   */
  static async getLeaveBalance(
    userId: string,
    leaveType: LeaveType,
    year: number
  ): Promise<LeaveBalance | null> {
    try {
      const [balance] = await FirestoreDB.queryCollection<LeaveBalance>(
        this.BALANCE_COLLECTION,
        [
          where('userId', '==', userId),
          where('leaveType', '==', leaveType),
          where('year', '==', year),
        ]
      );
      return balance || null;
    } catch (error) {
      console.error('Error getting leave balance:', error);
      throw error;
    }
  }

  /**
   * Calculate and update leave balance
   */
  static async updateLeaveBalance(
    userId: string,
    leaveType: LeaveType,
    year: number
  ): Promise<LeaveBalance> {
    try {
      const leaveRequests = await this.getUserLeaveRequests(userId);
      const usedDays = LeaveCalculator.calculateLeavesUsed(
        leaveRequests.filter((r) => r.leaveType === leaveType)
      );

      const policy = await this.getLeavePolicy(leaveType);
      const allowedDays = policy?.allowedDaysPerYear || 0;
      const remaining = LeaveCalculator.calculateRemainingLeaves(
        allowedDays,
        usedDays
      );

      const balance: LeaveBalance = {
        userId,
        leaveType,
        totalAllowed: allowedDays,
        used: usedDays,
        remaining,
        carryForward: policy?.carryForwardDays || 0,
        year,
      };

      return balance;
    } catch (error) {
      console.error('Error updating leave balance:', error);
      throw error;
    }
  }

  /**
   * Approve leave request (Admin only) - Convenience method
   */
  static async approveLeaveRequest(leaveRequestId: string, adminId?: string): Promise<void> {
    return this.approveLeave(leaveRequestId, adminId);
  }

  /**
   * Reject leave request (Admin only) - Convenience method
   */
  static async rejectLeaveRequest(leaveRequestId: string, reason: string): Promise<void> {
    return this.rejectLeave(leaveRequestId, reason);
  }
}
