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

      // Check if already checked in and not checked out
      const currentCheckIn = await this.getCurrentCheckIn(userId);
      if (currentCheckIn) {
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
   * Record check-out (works independently of check-in date)
   */
  static async checkOut(userId: string): Promise<void> {
    try {
      const now = new Date();

      // Get current location - required for check-out
      const location: LocationData = await getCurrentLocation();
      if (!location) {
        throw new Error('Location access is required for check-out. Please enable location services and try again.');
      }

      // Find the most recent check-in record that doesn't have check-out yet
      const currentCheckIn = await this.getCurrentCheckIn(userId);

      if (currentCheckIn && currentCheckIn.id) {
        // If there's an active check-in, update it with check-out
        const updatedRecord = {
          ...currentCheckIn,
          checkOutTime: now,
          checkOutLocation: location,
          updatedAt: now,
          status: 'present'
        };

        await FirestoreDB.addDocument(this.COLLECTION, updatedRecord, currentCheckIn.id);

        // Create notification for admin
        try {
          const employee = await EmployeeService.getEmployeeProfile(userId);
          const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';

          await NotificationService.createAttendanceNotification(currentCheckIn, employeeName, 'checkout');
        } catch (notificationError) {
          console.error('Error creating check-out notification:', notificationError);
          // Don't fail the check-out if notification fails
        }
      } else {
        // If no active check-in exists, create a new record with only check-out
        const attendance: Attendance = {
          id: '',
          userId,
          date: now,
          checkOutTime: now,
          checkOutLocation: location,
          status: 'present', // Assume present if checking out
          createdAt: now,
          updatedAt: now,
        };

        const docRef = await FirestoreDB.addDocument(
          this.COLLECTION,
          attendance
        );
        attendance.id = docRef.id;

        // Create notification for admin
        try {
          const employee = await EmployeeService.getEmployeeProfile(userId);
          const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';

          await NotificationService.createAttendanceNotification(attendance, employeeName, 'checkout');
        } catch (notificationError) {
          console.error('Error creating check-out notification:', notificationError);
          // Don't fail the check-out if notification fails
        }
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
      // Get today's records first, then sort and find active check-in
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayRecords = await FirestoreDB.queryCollection<Attendance>(
        this.COLLECTION,
        [
          where('userId', '==', userId),
          where('date', '>=', today),
          where('date', '<', tomorrow)
        ]
      );

      // Sort by createdAt descending
      todayRecords.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      // Find the most recent record that has check-in but no check-out
      const activeRecord = todayRecords.find((record) => {
        return record.checkInTime && 
               (record.checkOutTime === null || 
                record.checkOutTime === undefined || 
                record.checkOutTime === '');
      });

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
