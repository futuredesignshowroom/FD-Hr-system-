// services/notification.service.ts - Real-time Notification Service

import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  limit,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'attendance_checkin' | 'attendance_checkout' | 'system';
  isRead: boolean;
  createdAt: Date;
  data?: any; // Additional data like leave request ID, etc.
}

export class NotificationService {
  private static readonly COLLECTION = 'notifications';

  /**
   * Create a new notification
   */
  static async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    if (!db) {
      console.error('Firebase not initialized');
      throw new Error('Firebase not available');
    }

    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...notification,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
    if (!db) {
      console.error('Firebase not initialized');
      return [];
    }

    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Notification[];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    if (!db) {
      console.error('Firebase not initialized');
      return;
    }

    try {
      const notificationRef = doc(db, this.COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    if (!db) {
      console.error('Firebase not initialized');
      return;
    }

    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc =>
        updateDoc(doc.ref, { isRead: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time notifications for a user
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (!db) {
      console.error('Firebase not initialized');
      return () => {};
    }

    const q = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Notification[];

        callback(notifications);
      },
      (error) => {
        console.error('Error listening to notifications:', error);
        if (onError) {
          onError(error);
        }
      }
    );

    return unsubscribe;
  }

  /**
   * Get all admin user IDs
   */
  static async getAdminUsers(): Promise<string[]> {
    if (!db) {
      console.error('Firebase not initialized');
      return [];
    }

    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }
  static async createLeaveRequestNotification(leaveRequest: any, employeeName: string): Promise<void> {
    try {
      // Get all admin users
      const adminUsers = await this.getAdminUsers();

      const notificationPromises = adminUsers.map(adminId =>
        this.createNotification({
          userId: adminId,
          title: 'New Leave Request',
          message: `${employeeName} has requested leave from ${leaveRequest.startDate} to ${leaveRequest.endDate}`,
          type: 'leave_request',
          isRead: false,
          data: {
            leaveRequestId: leaveRequest.id,
            employeeName,
            startDate: leaveRequest.startDate,
            endDate: leaveRequest.endDate,
            leaveType: leaveRequest.leaveType,
          },
        })
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error creating leave request notification:', error);
      throw error;
    }
  }

  /**
   * Create attendance notification for admin
   */
  static async createAttendanceNotification(attendance: any, employeeName: string, action: 'checkin' | 'checkout'): Promise<void> {
    try {
      const adminUsers = ['admin'];

      const notificationPromises = adminUsers.map(adminId =>
        this.createNotification({
          userId: adminId,
          title: action === 'checkin' ? 'Employee Check-in' : 'Employee Check-out',
          message: `${employeeName} has ${action === 'checkin' ? 'checked in' : 'checked out'} at ${new Date().toLocaleTimeString()}`,
          type: action === 'checkin' ? 'attendance_checkin' : 'attendance_checkout',
          isRead: false,
          data: {
            attendanceId: attendance.id,
            employeeName,
            action,
            timestamp: new Date(),
          },
        })
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error creating attendance notification:', error);
      throw error;
    }
  }
}