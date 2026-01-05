// services/leave-config.service.ts - Leave Configuration Service

import { where } from 'firebase/firestore';
import { FirestoreDB } from '@/lib/firestore';
import { LeavePolicy, LeaveBalance } from '@/types/leave';

export class LeaveConfigService {
  private static readonly POLICY_COLLECTION = 'leaveConfig';
  private static readonly BALANCE_COLLECTION = 'leaveBalance';

  /**
   * Get leave policies for all leave types
   */
  static async getLeavePolicies(): Promise<LeavePolicy[]> {
    try {
      return await FirestoreDB.getCollection<LeavePolicy>(this.POLICY_COLLECTION);
    } catch (error) {
      console.error('Error getting leave policies:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Set leave policy for a leave type
   */
  static async setLeavePolicy(policy: LeavePolicy): Promise<void> {
    try {
      await FirestoreDB.addDocument(this.POLICY_COLLECTION, policy, policy.id);
    } catch (error) {
      console.error('Error setting leave policy:', error);
      throw error;
    }
  }

  /**
   * Get leave balance for a user
   */
  static async getUserLeaveBalance(userId: string, year: number = new Date().getFullYear()): Promise<LeaveBalance[]> {
    try {
      const balances = await FirestoreDB.queryCollection<LeaveBalance>(
        this.BALANCE_COLLECTION,
        [
          where('userId', '==', userId),
          where('year', '==', year)
        ]
      );
      return balances;
    } catch (error) {
      console.error('Error getting user leave balance:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Set leave balance for a user
   */
  static async setUserLeaveBalance(balance: LeaveBalance): Promise<void> {
    try {
      const docId = `${balance.userId}_${balance.leaveType}_${balance.year}`;
      await FirestoreDB.addDocument(this.BALANCE_COLLECTION, balance, docId);
    } catch (error) {
      console.error('Error setting user leave balance:', error);
      throw error;
    }
  }

  /**
   * Initialize default leave policies if not exist
   */
  static async initializeDefaultPolicies(): Promise<void> {
    try {
      const existingPolicies = await this.getLeavePolicies();
      if (existingPolicies.length === 0) {
        const defaultPolicies: LeavePolicy[] = [
          {
            id: 'sick',
            leaveType: 'sick',
            allowedDaysPerYear: 6,
            carryForwardDays: 3,
            requiresApproval: true,
          },
          {
            id: 'casual',
            leaveType: 'casual',
            allowedDaysPerYear: 12,
            carryForwardDays: 0,
            requiresApproval: true,
          },
        ];

        for (const policy of defaultPolicies) {
          await this.setLeavePolicy(policy);
        }
      }
    } catch (error) {
      console.error('Error initializing default policies:', error);
      throw error;
    }
  }

  /**
   * Initialize leave balances for a new user
   */
  static async initializeUserLeaveBalances(userId: string): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();
      const existingBalances = await this.getUserLeaveBalance(userId, currentYear);
      
      if (existingBalances.length === 0) {
        // Get leave policies
        const policies = await this.getLeavePolicies();
        
        // Create balances based on policies
        for (const policy of policies) {
          const balance: LeaveBalance = {
            userId,
            leaveType: policy.leaveType,
            year: currentYear,
            totalAllowed: policy.allowedDaysPerYear,
            used: 0,
            remaining: policy.allowedDaysPerYear,
            carryForward: 0,
          };
          
          await this.setUserLeaveBalance(balance);
        }
      }
    } catch (error) {
      console.error('Error initializing user leave balances:', error);
      throw error;
    }
  }
}