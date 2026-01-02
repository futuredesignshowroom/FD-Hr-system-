'use client';

import { useState, useEffect } from 'react';
import { SalaryService } from '@/services/salary.service';
import { EmployeeService } from '@/services/employee.service';
import { Salary } from '@/types/salary';
import { Employee } from '@/types/employee';
import Loader from '@/components/ui/Loader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface SalaryWithEmployee extends Salary {
  employee?: Employee;
}

export default function AdminPayrollPage() {
  const [salaries, setSalaries] = useState<SalaryWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<SalaryWithEmployee | null>(null);
  const [newStatus, setNewStatus] = useState<'paid' | 'overdue'>('paid');

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const init = async () => {
      try {
        setLoading(true);
        const employees = await EmployeeService.getAllEmployees();
        const employeeMap = new Map(employees.map(emp => [emp.id, emp]));

        unsubscribe = SalaryService.subscribeSalaries((salaryData) => {
          const salariesWithEmployees = salaryData.map(salary => ({
            ...salary,
            employee: employeeMap.get(salary.userId),
          }));

          salariesWithEmployees.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          });

          setSalaries(salariesWithEmployees);
          setLoading(false);
        }, (err) => {
          console.error('Realtime salaries subscription error:', err);
          setError('Failed to subscribe to payroll data');
          setLoading(false);
        });
      } catch (err) {
        console.error('Error initializing payroll subscription:', err);
        setError('Failed to load payroll data');
        setLoading(false);
      }
    };

    init();

    return () => unsubscribe();
  }, []);

  const loadSalaries = async () => {
    try {
      setLoading(true);
      const salaryData = await SalaryService.getAllSalaries();

      // Get all employees to map names
      const employees = await EmployeeService.getAllEmployees();
      const employeeMap = new Map(employees.map(emp => [emp.id, emp]));

      // Combine salaries with employee data
      const salariesWithEmployees = salaryData.map(salary => ({
        ...salary,
        employee: employeeMap.get(salary.userId),
      }));

      // Sort by year, month descending (most recent first)
      salariesWithEmployees.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      setSalaries(salariesWithEmployees);
    } catch (err) {
      setError('Failed to load payroll data');
      console.error('Error loading salaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (salary: SalaryWithEmployee, status: 'paid' | 'overdue') => {
    setSelectedSalary(salary);
    setNewStatus(status);
    setShowConfirmModal(true);
  };

  const confirmUpdateStatus = async () => {
    if (!selectedSalary) return;

    setUpdatingStatus(selectedSalary.id);
    try {
      const paymentDate = newStatus === 'paid' ? new Date() : undefined;
      await SalaryService.updatePaymentStatus(selectedSalary.id, newStatus, paymentDate);

      // Update local state
      setSalaries(prev =>
        prev.map(s =>
          s.id === selectedSalary.id
            ? { ...s, paymentStatus: newStatus, paymentDate, updatedAt: new Date() }
            : s
        )
      );

      setShowConfirmModal(false);
      setSelectedSalary(null);
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Failed to update payment status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredSalaries = salaries.filter(salary => {
    if (filterStatus === 'all') return true;
    return salary.paymentStatus === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Paid</span>;
      case 'overdue':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Overdue</span>;
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>;
    }
  };

  const formatMonthYear = (month: number, year: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadSalaries}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <button
          onClick={loadSalaries}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'pending', 'paid', 'overdue'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded capitalize ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800">Total Salaries</h3>
          <p className="text-2xl font-bold text-blue-600">{salaries.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {salaries.filter(s => s.paymentStatus === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800">Paid</h3>
          <p className="text-2xl font-bold text-green-600">
            {salaries.filter(s => s.paymentStatus === 'paid').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800">Overdue</h3>
          <p className="text-2xl font-bold text-red-600">
            {salaries.filter(s => s.paymentStatus === 'overdue').length}
          </p>
        </div>
      </div>

      {/* Salaries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Employee</th>
                <th className="px-6 py-3 text-left font-semibold">Period</th>
                <th className="px-6 py-3 text-left font-semibold">Net Salary</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Payment Date</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalaries.map((salary) => (
                <tr key={salary.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">
                        {salary.employee
                          ? `${salary.employee.firstName} ${salary.employee.lastName}`.trim()
                          : 'Unknown Employee'
                        }
                      </div>
                      <div className="text-gray-500 text-xs">
                        {salary.employee?.department || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {formatMonthYear(salary.month, salary.year)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">
                      PKR {salary.netSalary.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(salary.paymentStatus || 'pending')}
                  </td>
                  <td className="px-6 py-4">
                    {salary.paymentDate ? (
                      <span className="text-sm">
                        {new Date(salary.paymentDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {(!salary.paymentStatus || salary.paymentStatus === 'pending') && (
                        <>
                          <button
                            onClick={() => handleUpdatePaymentStatus(salary, 'paid')}
                            disabled={updatingStatus === salary.id}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleUpdatePaymentStatus(salary, 'overdue')}
                            disabled={updatingStatus === salary.id}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            Mark Overdue
                          </button>
                        </>
                      )}
                      {salary.paymentStatus === 'overdue' && (
                        <button
                          onClick={() => handleUpdatePaymentStatus(salary, 'paid')}
                          disabled={updatingStatus === salary.id}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSalaries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No salaries found for the selected filter.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Payment Status Update"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to mark the salary for{' '}
            <strong>
              {selectedSalary?.employee
                ? `${selectedSalary.employee.firstName} ${selectedSalary.employee.lastName}`.trim()
                : 'Unknown Employee'
              }
            </strong>{' '}
            for {selectedSalary ? formatMonthYear(selectedSalary.month, selectedSalary.year) : ''} as{' '}
            <strong className={newStatus === 'paid' ? 'text-green-600' : 'text-red-600'}>
              {newStatus.toUpperCase()}
            </strong>
            ?
          </p>

          {newStatus === 'paid' && (
            <p className="text-sm text-gray-600">
              This will set the payment date to today.
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowConfirmModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUpdateStatus}
              disabled={updatingStatus !== null}
              className={newStatus === 'paid' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {updatingStatus ? 'Updating...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Payroll Management Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Review salaries before marking as paid</li>
          <li>• Use filters to focus on pending or overdue payments</li>
          <li>• Payment date is automatically set when marking as paid</li>
          <li>• Employees can see their payment status in their dashboard</li>
          <li>• Overdue status helps track delayed payments</li>
        </ul>
      </div>
    </div>
  );
}