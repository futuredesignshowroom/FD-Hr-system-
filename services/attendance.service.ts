// services/attendance.service.ts - Attendance Management Service

import { where } from 'firebase/firestore';
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

      // Check if already checked in today
      const existingAttendance = await this.getAttendanceByDate(userId, today);
      if (existingAttendance && existingAttendance.checkInTime) {
        throw new Error('Already checked in for today. You can only check out.');
      }

      // Get current location
      let location: LocationData | undefined;
      try {
        location = await getCurrentLocation();
      } catch (locationError) {
        console.warn('Could not get location for check-in:', locationError);
        // For now, continue without location, but user wants proper capture
        // TODO: Make location mandatory to prevent foul play
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
      if (location) {
        attendance.checkInLocation = location;
      }

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
   * Record check-out
   */
  static async checkOut(attendanceId: string): Promise<void> {
    try {
      // Get the attendance record first to get user info
      const attendance = await FirestoreDB.getDocument<Attendance>(this.COLLECTION, attendanceId);
      if (!attendance) {
        throw new Error('Attendance record not found');
      }

      // Check if already checked out
      if (attendance.checkOutTime) {
        throw new Error('Already checked out for today.');
      }

      const now = new Date();

      // Get current location
      let location: LocationData | undefined;
      try {
        location = await getCurrentLocation();
      } catch (locationError) {
        console.warn('Could not get location for check-out:', locationError);
        // Continue without location if permission denied
      }

      const updateData: any = {
        checkOutTime: now,
        updatedAt: now,
      };

      // Only add location if we got it
      if (location) {
        updateData.checkOutLocation = location;
      }

      await FirestoreDB.updateDocument(this.COLLECTION, attendanceId, updateData);

      // Create notification for admin
      try {
        const employee = await EmployeeService.getEmployeeProfile(attendance.userId);
        const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';

        await NotificationService.createAttendanceNotification(attendance, employeeName, 'checkout');
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
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const records = await FirestoreDB.queryCollection<Attendance>(
        this.COLLECTION,
        [where('userId', '==', userId)]
      );

      // Find record for the specific date
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      return (
        records.find((r) => {
          const recordDate = new Date(r.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate.toDateString() === targetDate.toDateString();
        }) || null
      );
    } catch (error) {
      console.error('Error getting attendance by date:', error);
      throw error;
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
