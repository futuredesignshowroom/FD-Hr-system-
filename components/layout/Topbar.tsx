// components/layout/Topbar.tsx - Topbar Component

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import HamburgerMenu from './HamburgerMenu';
import Avatar from '../ui/Avatar';
import { useAuthStore } from '@/store/auth.store';
import { NotificationService, Notification } from '@/services/notification.service';
import { LeaveService } from '@/services/leave.service';

interface TopbarProps {
  userRole: 'admin' | 'employee';
  userName?: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export default function Topbar({ userRole, userName = 'User', onMenuToggle, isMenuOpen }: TopbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processingLeave, setProcessingLeave] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Real-time notifications subscription
  useEffect(() => {
    if (!user) return;

    const unsubscribe = NotificationService.subscribeToNotifications(
      user.id,
      (newNotifications) => {
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.isRead).length);
      },
      (error) => {
        console.error('Notification subscription error:', error);
      }
    );

    return unsubscribe;
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotificationOpen(false);
  };

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    if (userRole === 'employee') {
      router.push('/dashboard-emp/profile');
    } else {
      router.push('/dashboard-admin/profile');
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    router.push('/login');
  };

  const handleApproveLeave = async (notification: Notification) => {
    if (!notification.data?.leaveRequestId) return;

    try {
      setProcessingLeave(notification.data.leaveRequestId);
      await LeaveService.approveLeaveRequest(notification.data.leaveRequestId);

      // Mark notification as read
      await NotificationService.markAsRead(notification.id);

      // Create success notification for employee
      await NotificationService.createNotification({
        userId: notification.data.userId, // This should be the employee who requested leave
        title: 'Leave Approved',
        message: `Your leave request from ${notification.data.startDate} to ${notification.data.endDate} has been approved.`,
        type: 'leave_approved',
        isRead: false,
        data: {
          leaveRequestId: notification.data.leaveRequestId,
        },
      });

      // Refresh notifications
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Failed to approve leave request. Please try again.');
    } finally {
      setProcessingLeave(null);
    }
  };

  const handleRejectLeave = async (notification: Notification) => {
    if (!notification.data?.leaveRequestId) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setProcessingLeave(notification.data.leaveRequestId);
      await LeaveService.rejectLeaveRequest(notification.data.leaveRequestId, reason);

      // Mark notification as read
      await NotificationService.markAsRead(notification.id);

      // Create rejection notification for employee
      await NotificationService.createNotification({
        userId: notification.data.userId,
        title: 'Leave Rejected',
        message: `Your leave request from ${notification.data.startDate} to ${notification.data.endDate} has been rejected. Reason: ${reason}`,
        type: 'leave_rejected',
        isRead: false,
        data: {
          leaveRequestId: notification.data.leaveRequestId,
        },
      });

      // Refresh notifications
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Failed to reject leave request. Please try again.');
    } finally {
      setProcessingLeave(null);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4 lg:p-6">
        <div className="flex items-center space-x-4">
          {onMenuToggle && (
            <HamburgerMenu isOpen={isMenuOpen || false} onToggle={onMenuToggle} />
          )}
          <div className="lg:hidden">
            <h1 className="text-xl font-bold text-gray-800">HRMS</h1>
          </div>
          <div className="hidden lg:block">
            <SearchBar userRole={userRole} />
          </div>
        </div>
        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          {/* Notifications Bell */}
          {userRole === 'admin' && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5h5l-5 5v-5zM4 12h8m0 0v-2a2 2 0 00-2-2H4a2 2 0 00-2 2v2m8 0v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2m8 0H4" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-500">{unreadCount} unread</p>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notification.createdAt)}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {notification.type === 'leave_request' && userRole === 'admin' && (
                                <>
                                  <button
                                    onClick={() => handleApproveLeave(notification)}
                                    disabled={processingLeave === notification.data?.leaveRequestId}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                                  >
                                    {processingLeave === notification.data?.leaveRequestId ? '...' : 'Approve'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectLeave(notification)}
                                    disabled={processingLeave === notification.data?.leaveRequestId}
                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                                  >
                                    {processingLeave === notification.data?.leaveRequestId ? '...' : 'Reject'}
                                  </button>
                                </>
                              )}
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
          <button onClick={handleAvatarClick} className="focus:outline-none">
            <Avatar name={userName} size={40} />
          </button>

          {/* User Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-2">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 pb-4">
        <SearchBar userRole={userRole} />
      </div>
    </header>
  );
}
