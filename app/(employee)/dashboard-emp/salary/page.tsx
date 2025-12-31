'use client';

export default function EmployeeSalaryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Salary</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Select Month</h2>
        <select className="border border-gray-300 rounded px-3 py-2">
          <option>December 2025</option>
          <option>November 2025</option>
          <option>October 2025</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Salary Breakdown</h2>
        <div className="space-y-4">
          <div className="flex justify-between border-b pb-4">
            <span>Base Salary</span>
            <span className="font-semibold">$5,000</span>
          </div>
          <div className="flex justify-between border-b pb-4">
            <span>Allowances</span>
            <span className="font-semibold">$500</span>
          </div>
          <div className="flex justify-between border-b pb-4">
            <span>Deductions</span>
            <span className="font-semibold text-red-600">-$200</span>
          </div>
          <div className="flex justify-between pt-4 bg-blue-50 p-4 rounded">
            <span className="font-bold">Net Salary</span>
            <span className="font-bold text-lg">$5,300</span>
          </div>
        </div>
      </div>
    </div>
  );
}
