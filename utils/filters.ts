// utils/filters.ts - Filter Utilities

import { Employee } from '@/types/employee';
import { Attendance, AttendanceStatus } from '@/types/attendance';
import { LeaveRequest, LeaveStatus } from '@/types/leave';

export const filterEmployeesByDepartment = (
  employees: Employee[],
  department: string
): Employee[] => {
  return employees.filter((emp) => emp.department === department);
};

export const filterEmployeesByStatus = (
  employees: Employee[],
  status: string
): Employee[] => {
  return employees.filter((emp) => emp.status === status);
};

export const filterAttendanceByStatus = (
  records: Attendance[],
  status: AttendanceStatus
): Attendance[] => {
  return records.filter((record) => record.status === status);
};

export const filterLeavesByStatus = (
  leaves: LeaveRequest[],
  status: LeaveStatus
): LeaveRequest[] => {
  return leaves.filter((leave) => leave.status === status);
};

export const filterLeavesByType = (
  leaves: LeaveRequest[],
  type: string
): LeaveRequest[] => {
  return leaves.filter((leave) => leave.leaveType === type);
};

export const filterByDateRange = (
  items: any[],
  startDate: Date,
  endDate: Date,
  dateField: string = 'createdAt'
): any[] => {
  return items.filter((item) => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= startDate && itemDate <= endDate;
  });
};
