// store/user.store.ts - User Data Store (Zustand)

import { create } from 'zustand';
import { Employee } from '@/types/employee';
import { AttendanceRecord } from '@/types/attendance';
import { Salary } from '@/types/salary';

interface UserStore {
  employeeData: Employee | null;
  attendance: AttendanceRecord | null;
  salary: Salary | null;
  setEmployeeData: (data: Employee | null) => void;
  setAttendance: (data: AttendanceRecord | null) => void;
  setSalary: (data: Salary | null) => void;
  clearUserData: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  employeeData: null,
  attendance: null,
  salary: null,
  setEmployeeData: (employeeData) => set({ employeeData }),
  setAttendance: (attendance) => set({ attendance }),
  setSalary: (salary) => set({ salary }),
  clearUserData: () =>
    set({ employeeData: null, attendance: null, salary: null }),
}));
