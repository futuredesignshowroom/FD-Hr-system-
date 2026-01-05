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
      const leaveTypes: LeaveType[] = ['sick', 'casual'];
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

  const handleEmployeeSelect = async (employeeId: string) => {
    setSelectedEmployee(employeeId);
    if (employeeId) {
      await loadEmployeeBalances(employeeId);
    } else {
      setEmployeeBalances([]);
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
          onChange={(e) => handleEmployeeSelect(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md text-lg"
        >
          <option value="">Select an employee...</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.firstName} {employee.lastName} - {employee.position} - {employee.email}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <>
          {/* Employee Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Employee Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={employees.find(e => e.id === selectedEmployee)?.employeeId || ''}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={employees.find(e => e.id === selectedEmployee)?.firstName || ''}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={employees.find(e => e.id === selectedEmployee)?.lastName || ''}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={employees.find(e => e.id === selectedEmployee)?.position || ''}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={employees.find(e => e.id === selectedEmployee)?.department || ''}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={employees.find(e => e.id === selectedEmployee)?.email || ''}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                <input
                  type="text"
                  value={employees.find(e => e.id === selectedEmployee)?.dateOfJoining?.toDateString() || ''}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <input
                  type="text"
                  value={employees.find(e => e.id === selectedEmployee)?.status || ''}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Leave Allowances Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Leave Allowances Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {employeeBalances.map((balance) => (
                <div key={balance.leaveType} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold capitalize mb-3 text-blue-600">
                    {balance.leaveType} Leave
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Allowed
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={balance.totalAllowed}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const updatedBalances = employeeBalances.map(b =>
                              b.leaveType === balance.leaveType
                                ? { ...b, totalAllowed: value, remaining: value - b.used }
                                : b
                            );
                            setEmployeeBalances(updatedBalances);
                          }}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Used
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={balance.used}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const updatedBalances = employeeBalances.map(b =>
                              b.leaveType === balance.leaveType
                                ? { ...b, used: value, remaining: b.totalAllowed - value }
                                : b
                            );
                            setEmployeeBalances(updatedBalances);
                          }}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Carry Forward
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={balance.carryForward}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const updatedBalances = employeeBalances.map(b =>
                              b.leaveType === balance.leaveType
                                ? { ...b, carryForward: value, remaining: b.totalAllowed + value - b.used }
                                : b
                            );
                            setEmployeeBalances(updatedBalances);
                          }}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Remaining
                        </label>
                        <input
                          type="number"
                          value={balance.remaining}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => updateEmployeeBalance(balance.leaveType, balance.totalAllowed)}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? 'Saving...' : 'Update'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-3 text-blue-800">Leave Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {employeeBalances.reduce((total, balance) => total + balance.totalAllowed, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Allowed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {employeeBalances.reduce((total, balance) => total + balance.used, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {employeeBalances.reduce((total, balance) => total + balance.remaining, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Remaining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Additional Leave Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Year
                </label>
                <input
                  type="number"
                  value={new Date().getFullYear()}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Current leave year</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-carry Forward
                </label>
                <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="yes">Enabled</option>
                  <option value="no">Disabled</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Automatically carry forward unused leaves</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Settings
                </label>
                <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All notifications</option>
                  <option value="important">Important only</option>
                  <option value="none">No notifications</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Leave-related notifications</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Any special notes about this employee's leave policy..."
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* General Policies Reference */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">General Leave Policies Reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Leave Type</th>
                <th className="px-4 py-2 text-left">Default Days/Year</th>
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