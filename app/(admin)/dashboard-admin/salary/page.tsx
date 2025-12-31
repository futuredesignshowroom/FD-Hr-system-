'use client';

import { useState } from 'react';

interface EmployeeSalary {
  id: string;
  name: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
}

export default function AdminSalaryPage() {
  const [employees, setEmployees] = useState<EmployeeSalary[]>([
    {
      id: '1',
      name: 'John Doe',
      baseSalary: 50000,
      allowances: 5000,
      deductions: 2000,
      netSalary: 53000,
    },
    {
      id: '2',
      name: 'Jane Smith',
      baseSalary: 45000,
      allowances: 4000,
      deductions: 1500,
      netSalary: 47500,
    },
    {
      id: '3',
      name: 'Ali Ahmed',
      baseSalary: 40000,
      allowances: 3500,
      deductions: 1200,
      netSalary: 42300,
    },
  ]);

  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    baseSalary: 0,
    allowances: 0,
    deductions: 0,
  });

  const handleEdit = (employee: EmployeeSalary) => {
    setEditingEmployee(employee.id);
    setEditForm({
      baseSalary: employee.baseSalary,
      allowances: employee.allowances,
      deductions: employee.deductions,
    });
  };

  const handleSave = () => {
    if (!editingEmployee) return;

    const netSalary = editForm.baseSalary + editForm.allowances - editForm.deductions;

    setEmployees(prev =>
      prev.map(emp =>
        emp.id === editingEmployee
          ? {
              ...emp,
              baseSalary: editForm.baseSalary,
              allowances: editForm.allowances,
              deductions: editForm.deductions,
              netSalary,
            }
          : emp
      )
    );

    setEditingEmployee(null);
  };

  const handleCalculateSalaries = () => {
    // In a real app, this would trigger salary calculation for all employees
    alert('Salaries calculated and updated for all employees!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Salary Management</h1>
        <button
          onClick={handleCalculateSalaries}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Calculate Salaries
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Employee</th>
              <th className="px-6 py-3 text-left font-semibold">Base Salary (PKR)</th>
              <th className="px-6 py-3 text-left font-semibold">Allowances (PKR)</th>
              <th className="px-6 py-3 text-left font-semibold">Deductions (PKR)</th>
              <th className="px-6 py-3 text-left font-semibold">Net Salary (PKR)</th>
              <th className="px-6 py-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{employee.name}</td>
                {editingEmployee === employee.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editForm.baseSalary}
                        onChange={(e) => setEditForm(prev => ({ ...prev, baseSalary: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editForm.allowances}
                        onChange={(e) => setEditForm(prev => ({ ...prev, allowances: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editForm.deductions}
                        onChange={(e) => setEditForm(prev => ({ ...prev, deductions: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      PKR {(editForm.baseSalary + editForm.allowances - editForm.deductions).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={handleSave}
                        className="text-green-600 hover:underline"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingEmployee(null)}
                        className="text-gray-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">PKR {employee.baseSalary.toLocaleString()}</td>
                    <td className="px-6 py-4">PKR {employee.allowances.toLocaleString()}</td>
                    <td className="px-6 py-4">PKR {employee.deductions.toLocaleString()}</td>
                    <td className="px-6 py-4 font-semibold">PKR {employee.netSalary.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Salary Management Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Base salary is the core monthly compensation</li>
          <li>• Allowances include transportation, medical, or other benefits</li>
          <li>• Deductions may include taxes, insurance, or leave penalties</li>
          <li>• Net salary is automatically calculated as: Base + Allowances - Deductions</li>
          <li>• Use "Calculate Salaries" to process payroll for the current month</li>
        </ul>
      </div>
    </div>
  );
}
