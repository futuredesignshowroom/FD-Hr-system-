export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'late';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: Date;
}

export interface Attendance {
  id: string;
  userId: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  checkInLocation?: LocationData;
  checkOutLocation?: LocationData;
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
