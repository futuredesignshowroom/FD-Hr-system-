// utils/search.ts - Search Utilities

import { Employee } from '@/types/employee';
import { Attendance } from '@/types/attendance';
import { LeaveRequest } from '@/types/leave';
import { Salary } from '@/types/salary';

export const searchEmployees = (
  employees: Employee[],
  searchTerm: string
): Employee[] => {
  const term = searchTerm.toLowerCase();
  return employees.filter(
    (emp) =>
      emp.firstName.toLowerCase().includes(term) ||
      emp.lastName.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.employeeId.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term)
  );
};

export const searchAttendance = (
  records: Attendance[],
  searchTerm: string
): Attendance[] => {
  const term = searchTerm.toLowerCase();
  return records.filter((record) =>
    record.status.toLowerCase().includes(term)
  );
};

export const searchLeaves = (
  leaves: LeaveRequest[],
  searchTerm: string
): LeaveRequest[] => {
  const term = searchTerm.toLowerCase();
  return leaves.filter(
    (leave) =>
      leave.leaveType.toLowerCase().includes(term) ||
      leave.status.toLowerCase().includes(term) ||
      leave.reason.toLowerCase().includes(term)
  );
};

export const searchSalaries = (
  salaries: Salary[],
  searchTerm: string
): Salary[] => {
  const term = searchTerm.toLowerCase();
  return salaries.filter(
    (salary) =>
      salary.userId.toLowerCase().includes(term) ||
      salary.month.toString().includes(term)
  );
};
