'use client';

import { useState } from 'react';
import { ReportsService } from '@/services/reports.service';
import { SalaryService } from '@/services/salary.service';
import { LeaveConfigService } from '@/services/leave-config.service';
import { EmployeeService } from '@/services/employee.service';

interface ReportData {
  attendance: any[];
  salaries: any[];
  leaveBalances: any[];
  employees: any[];
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const generateReport = async (reportType: string) => {
    setLoading(true);
    setSelectedReport(reportType);

    try {
      let data: any = null;

      switch (reportType) {
        case 'attendance':
          data = await ReportsService.getAllEmployeesMonthlyAttendance(selectedYear, selectedMonth);
          break;
        case 'salary':
          data = await SalaryService.getAllSalaries();
          // Filter by selected month/year
          data = data.filter((salary: any) =>
            salary.month === selectedMonth && salary.year === selectedYear
          );
          break;
        case 'leave':
          data = await LeaveConfigService.getUserLeaveBalance('', selectedYear);
          break;
        case 'employee':
          data = await EmployeeService.getAllEmployees();
          break;
      }

      setReportData(prev => ({
        attendance: reportType === 'attendance' ? data : (prev?.attendance || []),
        salaries: reportType === 'salary' ? data : (prev?.salaries || []),
        leaveBalances: reportType === 'leave' ? data : (prev?.leaveBalances || []),
        employees: reportType === 'employee' ? data : (prev?.employees || []),
      }));

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>

        {/* Month/Year Selector */}
        <div className="flex gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {months.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-2">Attendance Report</h3>
          <p className="text-gray-600 mb-4">View monthly attendance summary for {months[selectedMonth - 1]} {selectedYear}</p>
          <button
            onClick={() => generateReport('attendance')}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && selectedReport === 'attendance' ? 'Generating...' : 'Generate'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-2">Salary Report</h3>
          <p className="text-gray-600 mb-4">View payroll and salary details for {months[selectedMonth - 1]} {selectedYear}</p>
          <button
            onClick={() => generateReport('salary')}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && selectedReport === 'salary' ? 'Generating...' : 'Generate'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-2">Leave Report</h3>
          <p className="text-gray-600 mb-4">View leave allocation and usage for {selectedYear}</p>
          <button
            onClick={() => generateReport('leave')}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && selectedReport === 'leave' ? 'Generating...' : 'Generate'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-2">Employee Report</h3>
          <p className="text-gray-600 mb-4">View employee details and status</p>
          <button
            onClick={() => generateReport('employee')}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && selectedReport === 'employee' ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Report Data Display */}
      {reportData && (
        <div className="bg-white rounded-lg shadow p-6">
          {selectedReport === 'attendance' && reportData.attendance.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Attendance Report - {months[selectedMonth - 1]} {selectedYear}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Employee</th>
                      <th className="px-4 py-2 text-left">Department</th>
                      <th className="px-4 py-2 text-center">Present Days</th>
                      <th className="px-4 py-2 text-center">Total Working Days</th>
                      <th className="px-4 py-2 text-center">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.attendance.map((record: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{record.employeeName}</td>
                        <td className="px-4 py-2">{record.department}</td>
                        <td className="px-4 py-2 text-center">{record.presentDays}</td>
                        <td className="px-4 py-2 text-center">{record.totalWorkingDays}</td>
                        <td className="px-4 py-2 text-center">{record.attendancePercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedReport === 'salary' && reportData.salaries.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Salary Report - {months[selectedMonth - 1]} {selectedYear}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Employee</th>
                      <th className="px-4 py-2 text-left">Base Salary</th>
                      <th className="px-4 py-2 text-left">Allowances</th>
                      <th className="px-4 py-2 text-left">Deductions</th>
                      <th className="px-4 py-2 text-left">Net Salary</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.salaries.map((salary: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{salary.userId}</td>
                        <td className="px-4 py-2">PKR {salary.baseSalary?.toLocaleString()}</td>
                        <td className="px-4 py-2">PKR {salary.totalAllowances?.toLocaleString()}</td>
                        <td className="px-4 py-2">PKR {salary.totalDeductions?.toLocaleString()}</td>
                        <td className="px-4 py-2 font-semibold">PKR {salary.netSalary?.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            salary.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            salary.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {salary.paymentStatus || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedReport === 'leave' && reportData.leaveBalances.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Leave Report - {selectedYear}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Employee</th>
                      <th className="px-4 py-2 text-left">Leave Type</th>
                      <th className="px-4 py-2 text-center">Total Allowed</th>
                      <th className="px-4 py-2 text-center">Used</th>
                      <th className="px-4 py-2 text-center">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.leaveBalances.map((balance: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{balance.userId}</td>
                        <td className="px-4 py-2 capitalize">{balance.leaveType}</td>
                        <td className="px-4 py-2 text-center">{balance.totalAllowed}</td>
                        <td className="px-4 py-2 text-center">{balance.used}</td>
                        <td className="px-4 py-2 text-center">{balance.remaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedReport === 'employee' && reportData.employees.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Employee Report</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Department</th>
                      <th className="px-4 py-2 text-left">Position</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.employees.map((employee: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{employee.firstName} {employee.lastName}</td>
                        <td className="px-4 py-2">{employee.email}</td>
                        <td className="px-4 py-2">{employee.department}</td>
                        <td className="px-4 py-2">{employee.position}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            employee.status === 'active' ? 'bg-green-100 text-green-800' :
                            employee.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {employee.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {((selectedReport === 'attendance' && reportData.attendance.length === 0) ||
            (selectedReport === 'salary' && reportData.salaries.length === 0) ||
            (selectedReport === 'leave' && reportData.leaveBalances.length === 0) ||
            (selectedReport === 'employee' && reportData.employees.length === 0)) && (
            <div className="text-center py-8">
              <p className="text-gray-500">No data available for the selected period.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
