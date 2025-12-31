'use client';

import { useState, useEffect } from 'react';
import { EmployeeService } from '@/services/employee.service';
import { Employee } from '@/types/employee';
import Loader from '@/components/ui/Loader';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await EmployeeService.getAllEmployees();
      setEmployees(data);
    } catch (err) {
      setError('Failed to load employees');
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee({ ...employee });
    setShowEditModal(true);
  };

  const handleDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      await EmployeeService.deleteEmployee(employeeToDelete.id);
      setEmployees(employees.filter(emp => emp.id !== employeeToDelete.id));
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (err) {
      setError('Failed to delete employee');
      console.error('Error deleting employee:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;

    try {
      await EmployeeService.updateEmployee(editingEmployee.id, editingEmployee);
      setEmployees(employees.map(emp =>
        emp.id === editingEmployee.id ? editingEmployee : emp
      ));
      setShowEditModal(false);
      setEditingEmployee(null);
    } catch (err) {
      setError('Failed to update employee');
      console.error('Error updating employee:', err);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const fullName = ((employee.firstName || '') + ' ' + (employee.lastName || '')).trim();
    return (
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.department || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadEmployees}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Employees</h1>

      <div className="flex space-x-4">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-4 py-2"
        />
        <button
          onClick={loadEmployees}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Name</th>
              <th className="px-6 py-3 text-left font-semibold">Email</th>
              <th className="px-6 py-3 text-left font-semibold">Department</th>
              <th className="px-6 py-3 text-left font-semibold">Join Date</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{(employee.firstName + ' ' + employee.lastName).trim()}</td>
                <td className="px-6 py-4">{employee.email}</td>
                <td className="px-6 py-4">{employee.department}</td>
                <td className="px-6 py-4">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => handleEdit(employee)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(employee)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'No employees found matching your search.' : 'No employees registered yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Employee"
      >
        {editingEmployee && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={editingEmployee.firstName || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                value={editingEmployee.lastName || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, lastName: e.target.value })}
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={editingEmployee.email || ''}
              onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
            />
            <Input
              label="Department"
              value={editingEmployee.department || ''}
              onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
            />
            <Input
              label="Position"
              value={editingEmployee.position || ''}
              onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Employee"
      >
        {employeeToDelete && (
          <div className="space-y-4">
            <p>Are you sure you want to delete <strong>{employeeToDelete.firstName} {employeeToDelete.lastName}</strong>?</p>
            <p className="text-sm text-gray-600">This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                variant="danger"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
