// services/employee.service.ts - Employee Management Service

import { where } from 'firebase/firestore';
import { FirestoreDB } from '@/lib/firestore';
import { Employee, EmployeeFilter } from '@/types/employee';

export class EmployeeService {
  private static readonly COLLECTION = 'employees';

  /**
   * Create employee record
   */
  static async createEmployee(employee: Employee): Promise<void> {
    try {
      // Use user's UID as document ID when available so security rules can allow user-created documents
      const docId = employee.userId || undefined;
      // Ensure the employee.id field matches the document ID for consistency
      if (docId) {
        employee.id = docId;
      }
      await FirestoreDB.addDocument(this.COLLECTION, employee, docId);
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   */
  static async getEmployee(employeeId: string): Promise<Employee | null> {
    try {
      return await FirestoreDB.getDocument<Employee>(
        this.COLLECTION,
        employeeId
      );
    } catch (error) {
      console.error('Error getting employee:', error);
      throw error;
    }
  }

  /**
   * Get all employees
   */
  static async getAllEmployees(): Promise<Employee[]> {
    try {
      return await FirestoreDB.getCollection<Employee>(this.COLLECTION);
    } catch (error) {
      console.error('Error getting all employees:', error);
      // Return empty array instead of throwing to prevent infinite retries
      return [];
    }
  }

  /**
   * Search employees with filters
   */
  static async searchEmployees(filters: EmployeeFilter): Promise<Employee[]> {
    try {
      let employees = await this.getAllEmployees();

      // Filter by department
      if (filters.department) {
        employees = employees.filter(
          (emp) => emp.department === filters.department
        );
      }

      // Filter by status
      if (filters.status) {
        employees = employees.filter((emp) => emp.status === filters.status);
      }

      // Search by name or email
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        employees = employees.filter(
          (emp) =>
            emp.firstName.toLowerCase().includes(term) ||
            emp.lastName.toLowerCase().includes(term) ||
            emp.email.toLowerCase().includes(term) ||
            emp.employeeId.toLowerCase().includes(term)
        );
      }

      // Pagination
      const limit = filters.limit || 10;
      const page = filters.page || 1;
      const start = (page - 1) * limit;
      const end = start + limit;

      return employees.slice(start, end);
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  }

  /**
   * Update employee
   */
  static async updateEmployee(
    employeeId: string,
    updates: Partial<Employee>
  ): Promise<void> {
    try {
      await FirestoreDB.updateDocument(this.COLLECTION, employeeId, updates);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  /**
   * Delete employee
   */
  static async deleteEmployee(employeeId: string): Promise<void> {
    try {
      await FirestoreDB.deleteDocument(this.COLLECTION, employeeId);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  /**
   * Get employees by department
   */
  static async getEmployeesByDepartment(
    department: string
  ): Promise<Employee[]> {
    try {
      return await FirestoreDB.queryCollection<Employee>(
        this.COLLECTION,
        [where('department', '==', department)]
      );
    } catch (error) {
      console.error('Error getting employees by department:', error);
      throw error;
    }
  }

  /**
   * Get employee profile by user ID
   */
  static async getEmployeeProfile(userId: string): Promise<Employee> {
    try {
      const employees = await FirestoreDB.queryCollection<Employee>(
        this.COLLECTION,
        [where('userId', '==', userId)]
      );
      if (employees.length === 0) {
        throw new Error('Employee profile not found');
      }
      return employees[0];
    } catch (error) {
      console.error('Error getting employee profile:', error);
      throw error; // Re-throw to allow profile page to handle creation
    }
  }

  /**
   * Update employee profile
   */
  static async updateEmployeeProfile(employeeId: string, updates: Partial<Employee>): Promise<void> {
    try {
      await FirestoreDB.updateDocument(this.COLLECTION, employeeId, updates);
    } catch (error) {
      console.error('Error updating employee profile:', error);
      throw error;
    }
  }

  /**
   * Subscribe to all employees changes in real-time
   */
  static subscribeToAllEmployees(
    callback: (employees: Employee[]) => void,
    onError?: (error: any) => void
  ): () => void {
    try {
      return FirestoreDB.subscribeCollection<Employee>(
        this.COLLECTION,
        [],
        callback,
        onError
      );
    } catch (error) {
      console.error('Error subscribing to all employees:', error);
      if (onError) onError(error);
      return () => {};
    }
  }

  /**
   * Subscribe to profile changes in real-time for a single user
   */
  static subscribeToProfileChanges(
    userId: string,
    callback: (employee: Employee | null) => void,
    onError?: (error: any) => void
  ): () => void {
    try {
      return FirestoreDB.subscribeCollection<Employee>(
        this.COLLECTION,
        [where('userId', '==', userId)],
        (employees) => {
          callback(employees.length > 0 ? employees[0] : null);
        },
        onError
      );
    } catch (error) {
      console.error('Error subscribing to profile changes:', error);
      if (onError) onError(error);
      return () => {};
    }
  }
}
