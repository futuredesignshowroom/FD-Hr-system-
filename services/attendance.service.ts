// services/attendance.service.ts - Attendance Management Service

import { where, orderBy, limit } from 'firebase/firestore';
import { FirestoreDB } from '@/lib/firestore';
import { AttendanceCalculator } from '@/lib/calculations';
import { NotificationService } from './notification.service';
import { EmployeeService } from './employee.service';
import { Attendance, AttendanceRecord, AttendanceStatus } from '@/types/attendance';
import { getCurrentLocation, LocationData } from '@/utils/location';

export class AttendanceService {
  private static readonly COLLECTION = 'attendance';

  /**
   * Record check-in
   */
  static async checkIn(userId: string): Promise<Attendance> {
    try {
      const now = new Date();

      // Check if already checked in and not checked out (prevent multiple active sessions)
      const currentIncompleteRecord = await this.getLastIncompleteRecord(userId);
      if (currentIncompleteRecord) {
        throw new Error('Already checked in. Please check out first before checking in again.');
      }

      // Get current location - mandatory for check-in
      const location: LocationData = await getCurrentLocation();
      if (!location) {
        throw new Error('Location access is required for check-in. Please enable location services and try again.');
      }

      const attendance: Attendance = {
        id: '',
        userId,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate()), // Store date without time
        checkInTime: now,
        status: 'present',
        createdAt: now,
        updatedAt: now,
      };

      // Only add location if we got it
      attendance.checkInLocation = location;

      const docRef = await FirestoreDB.addDocument(
        this.COLLECTION,
        attendance
      );
      attendance.id = docRef.id;

      // Create notification for admin
      try {
        const employee = await EmployeeService.getEmployeeProfile(userId);
        const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';

        await NotificationService.createAttendanceNotification(attendance, employeeName, 'checkin');
      } catch (notificationError) {
        console.error('Error creating check-in notification:', notificationError);
        // Don't fail the check-in if notification fails
      }

      return attendance;
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  }

  /**
   * Record check-out (works independently of check-in date)
   */
  static async checkOut(userId: string): Promise<void> {
    try {
      console.log('checkOut called for userId:', userId);

      const now = new Date();

      // Get current location - required for check-out
      const location: LocationData = await getCurrentLocation();
      if (!location) {
        throw new Error('Location access is required for check-out. Please enable location services and try again.');
      }

      // Find the last record for the current user where check_out is null or undefined
      const lastIncompleteRecord = await this.getLastIncompleteRecord(userId);
      console.log('checkOut - lastIncompleteRecord:', lastIncompleteRecord?.id || 'null');

      if (!lastIncompleteRecord || !lastIncompleteRecord.id) {
        throw new Error('No active check-in found. Please check in first before checking out.');
      }

      // Update the existing record with check-out time and location
      const updateData = {
        checkOutTime: now,
        checkOutLocation: location,
        updatedAt: now,
        status: 'present'
      };

      console.log('checkOut - Updating record', lastIncompleteRecord.id, 'with data:', updateData);
      await FirestoreDB.updateDocument(this.COLLECTION, lastIncompleteRecord.id, updateData);

      // Create notification for admin
      try {
        const employee = await EmployeeService.getEmployeeProfile(userId);
        const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';

        await NotificationService.createAttendanceNotification(lastIncompleteRecord, employeeName, 'checkout');
      } catch (notificationError) {
        console.error('Error creating check-out notification:', notificationError);
        // Don't fail the check-out if notification fails
      }
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  }

  /**
   * Get attendance for a specific date
   */
  static async getAttendanceByDate(
    userId: string,
    date: Date
  ): Promise<Attendance | null> {
    try {
      // Get recent attendance records for the user (ordered by createdAt desc, limit 30)
      const records = await FirestoreDB.queryCollection<Attendance>(
        this.COLLECTION,
        [
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(30)
        ]
      );

      // Find the record for the specific date
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()); // Normalize target date
      const targetDateStr = targetDate.toDateString();

      const matchingRecord = records.find((record) => {
        let recordDate: Date;
        if (record.date && typeof (record.date as any).toDate === 'function') {
          // Firestore Timestamp
          recordDate = (record.date as any).toDate();
        } else {
          // Regular Date
          recordDate = new Date(record.date);
        }
        const recordDateNormalized = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
        const recordDateStr = recordDateNormalized.toDateString();
        return recordDateStr === targetDateStr;
      });

      return matchingRecord || null;
    } catch (error) {
      console.error('Error getting attendance by date:', error);
      return null;
    }
  }
  /**
   * Get the last incomplete attendance record (has check-in but no check-out)
   */
  static async getLastIncompleteRecord(userId: string): Promise<Attendance | null> {
    try {
      console.log('getLastIncompleteRecord called for userId:', userId);

      // Get recent records for the user (last 30 days to be safe)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentRecords = await FirestoreDB.queryCollection<Attendance>(
        this.COLLECTION,
        [
          where('userId', '==', userId),
          where('createdAt', '>=', thirtyDaysAgo),
          orderBy('createdAt', 'desc'),
          limit(50) // Get more records to be safe
        ]
      );

      console.log('getLastIncompleteRecord - Found', recentRecords.length, 'recent records for user:', userId);

      // Find records that have check-in but no check-out
      // Treat null/undefined/empty string and explicit 'N/A' as missing check-out
      const incompleteRecords = recentRecords.filter((record) => {
        const hasCheckIn = !!record.checkInTime;
        const co = record.checkOutTime;
        let hasCheckOut = false;
        if (co === null || co === undefined) {
          hasCheckOut = false;
        } else if (typeof co === 'string') {
          hasCheckOut = co !== '' && co !== 'N/A';
        } else {
          // Assume non-string (Date) is a valid check-out
          hasCheckOut = true;
        }
        console.log('Record', record.id, '- hasCheckIn:', hasCheckIn, 'hasCheckOut:', hasCheckOut, 'checkOutTime:', record.checkOutTime);
        return hasCheckIn && !hasCheckOut;
      });

      console.log('getLastIncompleteRecord - Found', incompleteRecords.length, 'incomplete records');

      // Prefer an incomplete record for today if present
      const today = new Date();
      const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toDateString();
      const todayIncomplete = incompleteRecords.find((record) => {
        if (!record.date) return false;
        const recordDate = (record.date && typeof (record.date as any).toDate === 'function') ? (record.date as any).toDate() : new Date(record.date);
        return new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate()).toDateString() === todayStr;
      });

      const result = todayIncomplete || (incompleteRecords.length > 0 ? incompleteRecords[0] : null);
      console.log('getLastIncompleteRecord - Returning record:', result?.id || 'null');
      return result;
    } catch (error) {
      console.error('Error getting last incomplete record:', error);
      return null;
    }
  }

  /**
   * Get monthly attendance record
   */
  static async getMonthlyAttendance(
    userId: string,
    month: number,
    year: number
  ): Promise<AttendanceRecord> {
    try {
      const allRecords = await FirestoreDB.queryCollection<Attendance>(
        this.COLLECTION,
        [where('userId', '==', userId)]
      );

      const monthRecords = allRecords.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === month && recordDate.getFullYear() === year
        );
      });

      const totalDays = monthRecords.length;
      const presentDays = monthRecords.filter(
        (r) => r.status === 'present'
      ).length;
      const absentDays = monthRecords.filter(
        (r) => r.status === 'absent'
      ).length;
      const halfDays = monthRecords.filter(
        (r) => r.status === 'half-day'
      ).length;
      const lateDays = monthRecords.filter(
        (r) => r.status === 'late'
      ).length;

      const attendancePercentage =
        AttendanceCalculator.calculateAttendancePercentage(
          presentDays + halfDays,
          totalDays
        );

      return {
        userId,
        month,
        year,
        totalDays,
        presentDays,
        absentDays,
        halfDays,
        lateDays,
        attendancePercentage,
      };
    } catch (error) {
      console.error('Error getting monthly attendance:', error);
      throw error;
    }
  }

  /**
   * Get all attendance records for a user
   */
  static async getUserAttendance(userId: string): Promise<Attendance[]> {
    try {
      return await FirestoreDB.queryCollection<Attendance>(
        this.COLLECTION,
        [where('userId', '==', userId)]
      );
    } catch (error) {
      console.error('Error getting user attendance:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Get all attendance records (Admin only)
   */
  static async getAllAttendance(): Promise<Attendance[]> {
    try {
      return await FirestoreDB.getCollection<Attendance>(this.COLLECTION);
    } catch (error) {
      console.error('Error getting all attendance:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Mark attendance manually (Admin only)
   */
  static async markAttendance(
    userId: string,
    date: Date,
    status: AttendanceStatus,
    remarks?: string
  ): Promise<Attendance> {
    try {
      const attendance: Attendance = {
        id: '',
        userId,
        date,
        status,
        remarks,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await FirestoreDB.addDocument(
        this.COLLECTION,
        attendance
      );
      attendance.id = docRef.id;

      return attendance;
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

}
