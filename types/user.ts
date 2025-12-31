export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  profileImage?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUser extends User {
  role: 'admin';
  permissions: AdminPermission[];
}

export interface EmployeeUser extends User {
  role: 'employee';
  employeeId: string;
  dateOfJoining: Date;
  reportingManager?: string;
}

export type AdminPermission = 
  | 'manage_employees' 
  | 'manage_salary' 
  | 'manage_attendance' 
  | 'manage_leaves' 
  | 'generate_reports' 
  | 'manage_settings';
