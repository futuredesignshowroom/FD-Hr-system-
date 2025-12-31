'use client';

import { useState, useEffect } from 'react';
import { EmployeeService } from '@/services/employee.service';
import { SalaryService } from '@/services/salary.service';
import { Employee } from '@/types/employee';
import { SalaryConfig } from '@/types/salary';
import Loader from '@/components/ui/Loader';

interface EmployeeWithSalary extends Employee {
  salaryConfig?: SalaryConfig;
  currentSalary?: {
    baseSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
  };
}

export default function AdminSalaryPage() {
  const [employees, setEmployees] = useState<EmployeeWithSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithSalary | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [generatingSalary, setGeneratingSalary] = useState<string | null>(null);
  const [rulesForm, setRulesForm] = useState({
    baseSalary: 0,
    allowances: [] as { name: string; amount: number; type: 'fixed' | 'percentage' }[],
    totalLeavesAllowed: 30,
    workingDaysPerMonth: 26,
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeeData = await EmployeeService.getAllEmployees();

      // Load salary configs and current salary for each employee
      const employeesWithSalary = await Promise.all(
        employeeData.map(async (emp) => {
          try {
            const config = await SalaryService.getSalaryConfig(emp.id);
            const currentDate = new Date();
            const currentSalary = await SalaryService.getSalary(
              emp.id,
              currentDate.getMonth() + 1,
              currentDate.getFullYear()
            );
            return { 
              ...emp, 
              salaryConfig: config ?? undefined,
              currentSalary: currentSalary ? {
                baseSalary: currentSalary.baseSalary,
                allowances: currentSalary.totalAllowances,
                deductions: currentSalary.totalDeductions,
                netSalary: currentSalary.netSalary,
              } : undefined
            };
          } catch {
            return { ...emp, salaryConfig: undefined, currentSalary: undefined };
          }
        })
      );

      setEmployees(employeesWithSalary as EmployeeWithSalary[]);
    } catch (err) {
      setError('Failed to load employees');
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetRules = (employee: EmployeeWithSalary) => {
    setSelectedEmployee(employee);
    if (employee.salaryConfig) {
      setRulesForm({
        baseSalary: employee.salaryConfig.baseSalary,
        allowances: employee.salaryConfig.allowances,
        totalLeavesAllowed: employee.salaryConfig.totalLeavesAllowed,
        workingDaysPerMonth: employee.salaryConfig.workingDaysPerMonth,
      });
    } else {
      setRulesForm({
        baseSalary: 30000, // Default
        allowances: [],
        totalLeavesAllowed: 30,
        workingDaysPerMonth: 26,
      });
    }
    setShowRulesModal(true);
  };

  const handleSaveRules = async () => {
    if (!selectedEmployee) return;

    try {
      const config: SalaryConfig = {
        userId: selectedEmployee.id,
        baseSalary: rulesForm.baseSalary,
        allowances: rulesForm.allowances.map((a, i) => ({
          id: (a.name || 'allowance') + '-' + i,
          name: a.name,
          amount: a.amount,
          type: a.type as 'fixed' | 'percentage',
        })),
        totalLeavesAllowed: rulesForm.totalLeavesAllowed,
        workingDaysPerMonth: rulesForm.workingDaysPerMonth,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await SalaryService.setSalaryConfig(config);
      setShowRulesModal(false);
      setSelectedEmployee(null);
      await loadEmployees(); // Reload to show updated config
    } catch (err) {
      console.error('Error saving salary rules:', err);
      alert('Failed to save salary rules');
    }
  };

  const addAllowance = () => {
    setRulesForm(prev => ({
      ...prev,
      allowances: [...prev.allowances, { name: '', amount: 0, type: 'fixed' }]
    }));
  };

  const updateAllowance = (index: number, field: string, value: any) => {
    setRulesForm(prev => ({
      ...prev,
      allowances: prev.allowances.map((allowance, i) =>
        i === index ? { ...allowance, [field]: value } : allowance
      )
    }));
  };

  const removeAllowance = (index: number) => {
    setRulesForm(prev => ({
      ...prev,
      allowances: prev.allowances.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateSalary = async (employee: EmployeeWithSalary) => {
    if (!employee.salaryConfig) {
      alert('Please set salary rules first');
      return;
    }

    setGeneratingSalary(employee.id);
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Check if salary already exists for this month
      const existingSalary = await SalaryService.getSalary(employee.id, currentMonth, currentYear);
      if (existingSalary) {
        alert('Salary already generated for this month');
        return;
      }

      // Generate salary based on config
      await SalaryService.calculateAndCreateSalary(
        employee.id,
        currentMonth,
        currentYear,
        employee.salaryConfig.baseSalary,
        employee.salaryConfig.allowances,
        [] // No deductions for now
      );

      alert('Salary generated successfully for ' + (employee.firstName + ' ' + employee.lastName).trim());
      await loadEmployees(); // Refresh to show updated data
    } catch (error) {
      console.error('Error generating salary:', error);
      alert('Failed to generate salary');
    } finally {
      setGeneratingSalary(null);
    }
  };

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Salary Management</h1>
        <button
          onClick={loadEmployees}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Employee</th>
              <th className="px-6 py-3 text-left font-semibold">Department</th>
              <th className="px-6 py-3 text-left font-semibold">Base Salary</th>
              <th className="px-6 py-3 text-left font-semibold">Current Month Salary</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{(employee.firstName + ' ' + employee.lastName).trim()}</div>
                    <div className="text-gray-500 text-xs">{employee.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">{employee.department}</td>
                <td className="px-6 py-4">
                  {employee.salaryConfig ? (
                    <span className="font-semibold">
                      PKR {employee.salaryConfig.baseSalary.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-500">Not Set</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {employee.currentSalary ? (
                    <div>
                      <div className="font-semibold text-green-600">
                        PKR {employee.currentSalary.netSalary.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Generated
                      </div>
                    </div>
                  ) : (
                    <span className="text-orange-600">Not Generated</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {employee.salaryConfig ? (
                    <span className="text-green-600 font-medium">Rules Set</span>
                  ) : (
                    <span className="text-orange-600 font-medium">Rules Not Set</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSetRules(employee)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Set Rules
                    </button>
                    {employee.salaryConfig && (
                      <button
                        onClick={() => handleGenerateSalary(employee)}
                        disabled={generatingSalary === employee.id}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {generatingSalary === employee.id ? 'Generating...' : 'Generate Salary'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Salary Rules Modal */}
      {showRulesModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              Set Salary Rules for {(selectedEmployee.firstName + ' ' + selectedEmployee.lastName).trim()}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Salary (PKR)
                </label>
                <input
                  type="number"
                  value={rulesForm.baseSalary}
                  onChange={(e) => setRulesForm(prev => ({ ...prev, baseSalary: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter base salary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Working Days Per Month
                </label>
                <input
                  type="number"
                  value={rulesForm.workingDaysPerMonth}
                  onChange={(e) => setRulesForm(prev => ({ ...prev, workingDaysPerMonth: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Leaves Allowed Per Year
                </label>
                <input
                  type="number"
                  value={rulesForm.totalLeavesAllowed}
                  onChange={(e) => setRulesForm(prev => ({ ...prev, totalLeavesAllowed: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Allowances
                  </label>
                  <button
                    onClick={addAllowance}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Add Allowance
                  </button>
                </div>
                <div className="space-y-2">
                  {rulesForm.allowances.map((allowance, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Allowance name"
                        value={allowance.name}
                        onChange={(e) => updateAllowance(index, 'name', e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={allowance.amount}
                        onChange={(e) => updateAllowance(index, 'amount', Number(e.target.value))}
                        className="w-24 border border-gray-300 rounded px-3 py-2"
                      />
                      <select
                        value={allowance.type}
                        onChange={(e) => updateAllowance(index, 'type', e.target.value)}
                        className="w-24 border border-gray-300 rounded px-3 py-2"
                      >
                        <option value="fixed">Fixed</option>
                        <option value="percentage">%</option>
                      </select>
                      <button
                        onClick={() => removeAllowance(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRules}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Rules
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Salary Management Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Set base salary and allowances for each employee</li>
          <li>• Configure working days and leave allowances</li>
          <li>• Allowances can be fixed amounts or percentages</li>
          <li>• Salary calculations will be based on these rules</li>
          <li>• Employees will see their salary details in their dashboard</li>
        </ul>
      </div>
    </div>
  );
}
