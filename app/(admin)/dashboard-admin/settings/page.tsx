'use client';

import { useState } from 'react';

export default function AdminSettingsPage() {
  const [currency, setCurrency] = useState('PKR');
  const [companyName, setCompanyName] = useState('Your Company');
  const [workingDays, setWorkingDays] = useState(26);
  const [casualLeaves, setCasualLeaves] = useState(10);
  const [sickLeaves, setSickLeaves] = useState(5);
  const [earnedLeaves, setEarnedLeaves] = useState(12);

  const handleSaveSettings = () => {
    // Save settings logic here
    console.log('Settings saved:', {
      currency,
      companyName,
      workingDays,
      casualLeaves,
      sickLeaves,
      earnedLeaves
    });
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Currency Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Default Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full max-w-xs"
            >
              <option value="PKR">Pakistani Rupee (PKR)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="GBP">British Pound (GBP)</option>
              <option value="INR">Indian Rupee (INR)</option>
            </select>
          </div>
          <p className="text-sm text-gray-600">
            This currency will be used for all salary calculations and displays throughout the system.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Leave Policies</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Casual Leaves per Year</label>
            <input
              type="number"
              value={casualLeaves}
              onChange={(e) => setCasualLeaves(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sick Leaves per Year</label>
            <input
              type="number"
              value={sickLeaves}
              onChange={(e) => setSickLeaves(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Earned Leaves per Year</label>
            <input
              type="number"
              value={earnedLeaves}
              onChange={(e) => setEarnedLeaves(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Company Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Working Days per Month</label>
            <input
              type="number"
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveSettings}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Save Settings
      </button>
    </div>
  );
}
