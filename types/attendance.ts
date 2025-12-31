export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'late';

export interface Attendance {
  id: string;
  userId: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: AttendanceStatus;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  userId: string;
  month: number;
  year: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  lateDays: number;
  attendancePercentage: number;
}
