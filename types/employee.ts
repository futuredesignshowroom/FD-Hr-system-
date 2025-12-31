export interface Employee {
  id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  dateOfJoining: Date;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bio?: string;
  avatar?: string;
  reportingManager?: string;
  status: 'active' | 'inactive' | 'on-leave' | 'terminated';
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeFilter {
  department?: string;
  status?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
}
