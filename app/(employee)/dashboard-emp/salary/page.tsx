'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import Loader from '@/components/ui/Loader';
import { FirestoreDB } from '@/lib/firestore';
import { where } from 'firebase/firestore';
import { Salary, SalaryConfig } from '@/types/salary';

interface SalaryData {
  baseSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number; reason?: string }[];
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  paymentDate?: Date;
  month: number;
  year: number;
}

export default function EmployeeSalaryPage() {
  const [salaries, setSalaries] = useState<SalaryData[]>([]);
  const [allSalaries, setAllSalaries] = useState<Salary[]>([]);
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = FirestoreDB.subscribeCollection<Salary>(
      'salary',
      [where('userId', '==', user.id)],
      (allSalariesData) => {
        setAllSalaries(allSalariesData);
        
        // Find salary for selected month/year
        const salary = allSalariesData.find(s => s.month === selectedMonth && s.year === selectedYear);
        if (salary) {
          setSalaries([{
            baseSalary: salary.baseSalary,
            allowances: salary.allowances.map(a => ({ name: a.name, amount: a.amount })),
            deductions: salary.deductions.map(d => ({ name: d.name, amount: d.amount, reason: d.reason })),
            totalAllowances: salary.totalAllowances,
            totalDeductions: salary.totalDeductions,
            netSalary: salary.netSalary,
            paymentStatus: salary.paymentStatus || 'pending',
            paymentDate: salary.paymentDate,
            month: salary.month,
            year: salary.year,
          }]);
        } else {
          setSalaries([]);
        }
        setLoading(false);
        setError('');
      },
      (error) => {
        console.error('Error subscribing to salaries:', error);
        setError('Failed to load salary data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, selectedMonth, selectedYear]);

  // Subscribe to salary configuration changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = FirestoreDB.subscribeCollection<SalaryConfig>(
      'salaryConfig',
      [where('userId', '==', user.id)],
      (configs) => {
        if (configs.length > 0) {
          setSalaryConfig(configs[0]);
        } else {
          setSalaryConfig(null);
        }
      },
      (error) => {
        console.error('Error subscribing to salary config:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      options.push({
        value: `${date.getMonth() + 1}-${date.getFullYear()}`,
        label: `${getMonthName(date.getMonth() + 1)} ${date.getFullYear()}`
      });
    }
    return options;
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const currentSalary = salaries[0];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Salary</h1>

      {/* Current Salary Configuration */}
      {salaryConfig && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-green-600">Current Salary Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Salary:</span>
                  <span className="font-semibold">PKR {salaryConfig.baseSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Working Days/Month:</span>
                  <span className="font-semibold">{salaryConfig.workingDaysPerMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Leaves Allowed:</span>
                  <span className="font-semibold">{salaryConfig.totalLeavesAllowed}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Allowances</h3>
              {salaryConfig.allowances && salaryConfig.allowances.length > 0 ? (
                <div className="space-y-2">
                  {salaryConfig.allowances.map((allowance, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{allowance.name}:</span>
                      <span className="font-semibold">
                        {allowance.type === 'percentage'
                          ? `${allowance.amount}% of base`
                          : `PKR ${allowance.amount.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No allowances configured</p>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is your current salary configuration. Your actual monthly salary may vary based on attendance, deductions, and other factors.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Select Month</h2>
        <select
          value={`${selectedMonth}-${selectedYear}`}
          onChange={(e) => {
            const [month, year] = e.target.value.split('-').map(Number);
            setSelectedMonth(month);
            setSelectedYear(year);
          }}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {generateMonthOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {currentSalary ? (
        <div className="space-y-6">
          {/* Current Salary Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Salary Breakdown - {getMonthName(selectedMonth)} {selectedYear}
              </h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentSalary.paymentStatus === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : currentSalary.paymentStatus === 'overdue'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {currentSalary.paymentStatus.charAt(0).toUpperCase() + currentSalary.paymentStatus.slice(1)}
                {currentSalary.paymentDate && (
                  <span className="block text-xs">
                    {new Date(currentSalary.paymentDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-4">
                <span>Base Salary</span>
                <span className="font-semibold">PKR {currentSalary.baseSalary.toLocaleString()}</span>
              </div>

              {currentSalary.allowances.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2">Allowances</h3>
                  {currentSalary.allowances.map((allowance, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{allowance.name}</span>
                      <span>PKR {allowance.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                    <span>Total Allowances</span>
                    <span>PKR {currentSalary.totalAllowances.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {currentSalary.deductions.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2 text-red-600">Deductions</h3>
                  {currentSalary.deductions.map((deduction, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{deduction.name} {deduction.reason && `(${deduction.reason})`}</span>
                      <span className="text-red-600">-PKR {deduction.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold mt-2 pt-2 border-t text-red-600">
                    <span>Total Deductions</span>
                    <span>-PKR {currentSalary.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 bg-blue-50 p-4 rounded">
                <span className="font-bold">Net Salary</span>
                <span className="font-bold text-lg">PKR {currentSalary.netSalary.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Salary History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Salary History</h2>
            <div className="space-y-3">
              {allSalaries
                .sort((a, b) => {
                  if (a.year !== b.year) return b.year - a.year;
                  return b.month - a.month;
                })
                .slice(0, 6) // Show last 6 months
                .map((salary) => (
                  <div key={`${salary.month}-${salary.year}`} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <span className="font-medium">{getMonthName(salary.month)} {salary.year}</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        salary.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : salary.paymentStatus === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {salary.paymentStatus}
                      </span>
                    </div>
                    <span className="font-semibold">PKR {salary.netSalary.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No salary data available for {getMonthName(selectedMonth)} {selectedYear}</p>
          <p className="text-sm text-gray-400 mt-2">Salary will be calculated and displayed once processed by admin.</p>
        </div>
      )}
    </div>
  );
}
