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
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Check if already checked in today (one check-in per day)
      const todayAttendance = await this.getAttendanceByDate(userId, now);
      if (todayAttendance) {
        throw new Error('Already checked in for today. One check-in per day allowed.');
      }

      // If already checked in and checked out, allow re-check-in (maybe they forgot to check out)
      // But create a new record or update existing one?

      // Get current location - mandatory for check-in
      const location: LocationData = await getCurrentLocation();
      if (!location) {
        throw new Error('Location access is required for check-in. Please enable location services and try again.');
      }

      const attendance: Attendance = {
        id: '',
        userId,
        date: now,
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
   * Record check-out (requires check-in record to exist, but independent of check-in status)
   */
  static async checkOut(userId: string): Promise<void> {
    try {
      const now = new Date();

      // Get current location - required for check-out
      const location: LocationData = await getCurrentLocation();
      if (!location) {
        throw new Error('Location access is required for check-out. Please enable location services and try again.');
      }

      // Try to find existing check-in record for today
      const todayAttendance = await this.getAttendanceByDate(userId, now);

      if (todayAttendance && todayAttendance.id) {
        // If there's already a record for today, update it with check-out
        if (todayAttendance.checkOutTime) {
          throw new Error('Already checked out for today.');
        }

        const updateData: any = {
          checkOutTime: now,
          checkOutLocation: location,
          updatedAt: now,
        };

        await FirestoreDB.updateDocument(this.COLLECTION, todayAttendance.id, updateData);

        // Create notification for admin
        try {
          const employee = await EmployeeService.getEmployeeProfile(userId);
          const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';

          await NotificationService.createAttendanceNotification(todayAttendance, employeeName, 'checkout');
        } catch (notificationError) {
          console.error('Error creating check-out notification:', notificationError);
          // Don't fail the check-out if notification fails
        }
      } else {
        // No check-in record found for today - require check-in first
        throw new Error('No check-in record found for today. Please check in first.');
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
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const targetDateStr = targetDate.toDateString();

      const matchingRecord = records.find((record) => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.toDateString() === targetDateStr;
      });

      return matchingRecord || null;
    } catch (error) {
      console.error('Error getting attendance by date:', error);
      return null;
    }
  }
  /**
   * Get the current active check-in record (most recent without check-out)
   */
  static async getCurrentCheckIn(userId: string): Promise<Attendance | null> {
    try {
      // Get recent records to find the active check-in
      const records = await FirestoreDB.queryCollection<Attendance>(
        this.COLLECTION,
        [
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(5) // Check last 5 records
        ]
      );

      // Find the most recent record that has check-in but no check-out
      const activeRecord = records.find((record) =>
        record.checkInTime && !record.checkOutTime
      );

      return activeRecord || null;
    } catch (error) {
      console.error('Error getting current check-in:', error);
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
