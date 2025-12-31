'use client';

import { useState, useEffect } from 'react';
import { LeaveConfigService } from '@/services/leave-config.service';
import { EmployeeService } from '@/services/employee.service';
import { LeavePolicy, LeaveBalance, LeaveType } from '@/types/leave';
import { Employee } from '@/types/employee';
import Loader from '@/components/ui/Loader';

export default function LeaveConfigPage() {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employeeBalances, setEmployeeBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [policyData, employeeData] = await Promise.all([
        LeaveConfigService.getLeavePolicies(),
        EmployeeService.getAllEmployees()
      ]);

      // Initialize default policies if none exist
      if (policyData.length === 0) {
        await LeaveConfigService.initializeDefaultPolicies();
        const updatedPolicies = await LeaveConfigService.getLeavePolicies();
        setPolicies(updatedPolicies);
      } else {
        setPolicies(policyData);
      }

      setEmployees(employeeData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeBalances = async (employeeId: string) => {
    try {
      const balances = await LeaveConfigService.getUserLeaveBalance(employeeId);
      
      // Ensure all leave types have balances, initialize defaults if missing
      const leaveTypes: LeaveType[] = ['sick', 'casual', 'earned', 'unpaid', 'maternity', 'paternity'];
      const currentYear = new Date().getFullYear();
      
      const completeBalances = leaveTypes.map(leaveType => {
        const existing = balances.find(b => b.leaveType === leaveType && b.year === currentYear);
        if (existing) {
          return existing;
        } else {
          return {
            userId: employeeId,
            leaveType,
            totalAllowed: 0, // Default to 0, admin can set
            used: 0,
            remaining: 0,
            carryForward: 0,
            year: currentYear,
          };
        }
      });
      
      setEmployeeBalances(completeBalances);
    } catch (error) {
      console.error('Error loading employee balances:', error);
    }
  };

  const updateEmployeeBalance = async (leaveType: string, totalAllowed: number) => {
    if (!selectedEmployee) return;

    setSaving(true);
    try {
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) return;

      const balance: LeaveBalance = {
        userId: selectedEmployee,
        leaveType: leaveType as any,
        totalAllowed,
        used: 0, // Will be calculated from approved leaves
        remaining: totalAllowed,
        carryForward: 0,
        year: new Date().getFullYear(),
      };

      await LeaveConfigService.setUserLeaveBalance(balance);
      await loadEmployeeBalances(selectedEmployee);
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Failed to update leave balance');
    } finally {
      setSaving(false);
    }
  };

  const getEmployeeBalance = (leaveType: string) => {
    const balance = employeeBalances.find(b => b.leaveType === leaveType);
    return balance?.totalAllowed || 0;
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Configuration</h1>
      </div>

      {/* Employee Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Select Employee</h2>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select an employee...</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.firstName} {employee.lastName} - {employee.email}
            </option>
          ))}
        </select>
      </div>

      {/* Leave Policies */}
      {selectedEmployee && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Leave Configuration for Selected Employee</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Leave Type</th>
                  <th className="px-4 py-2 text-left">Default Policy</th>
                  <th className="px-4 py-2 text-left">Employee Allowance</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id} className="border-b">
                    <td className="px-4 py-2 capitalize font-medium">
                      {policy.leaveType}
                    </td>
                    <td className="px-4 py-2">
                      {policy.allowedDaysPerYear} days/year
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={getEmployeeBalance(policy.leaveType)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          const updatedBalances = employeeBalances.map(b =>
                            b.leaveType === policy.leaveType
                              ? { ...b, totalAllowed: value }
                              : b
                          );
                          setEmployeeBalances(updatedBalances);
                        }}
                        className="w-20 p-1 border border-gray-300 rounded"
                      />
                      <span className="ml-2">days</span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => updateEmployeeBalance(policy.leaveType, getEmployeeBalance(policy.leaveType))}
                        disabled={saving}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Update'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Total Leave Allowance:</h3>
            <p className="text-lg">
              {employeeBalances.reduce((total, balance) => total + balance.totalAllowed, 0)} days per year
            </p>
          </div>
        </div>
      )}

      {/* General Policies */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">General Leave Policies</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Leave Type</th>
                <th className="px-4 py-2 text-left">Days Per Year</th>
                <th className="px-4 py-2 text-left">Carry Forward</th>
                <th className="px-4 py-2 text-left">Requires Approval</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id} className="border-b">
                  <td className="px-4 py-2 capitalize font-medium">
                    {policy.leaveType}
                  </td>
                  <td className="px-4 py-2">
                    {policy.allowedDaysPerYear}
                  </td>
                  <td className="px-4 py-2">
                    {policy.carryForwardDays}
                  </td>
                  <td className="px-4 py-2">
                    {policy.requiresApproval ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}