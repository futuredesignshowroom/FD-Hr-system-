'use client';

import { useState, useEffect, useCallback } from 'react';
import { SettingsService } from '@/services/settings.service';
import { useAuthStore } from '@/store/auth.store';
import Loader from '@/components/ui/Loader';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaningData, setCleaningData] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const toast = useToast();

  // Local state for form inputs
  const [currency, setCurrency] = useState('PKR');
  const [companyName, setCompanyName] = useState('Your Company');
  const [workingDays, setWorkingDays] = useState(26);
  const [casualLeaves, setCasualLeaves] = useState(12);
  const [sickLeaves, setSickLeaves] = useState(12);
  const [earnedLeaves, setEarnedLeaves] = useState(30);

  // Load settings from database
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      let settingsData = await SettingsService.getSettings();

      // Initialize default settings if not exist
      if (!settingsData) {
        await SettingsService.initializeDefaultSettings();
        settingsData = await SettingsService.getSettings();
      }

      if (settingsData) {
        setCurrency(settingsData.currency);
        setCompanyName(settingsData.companyName);
        setWorkingDays(settingsData.workingDays);
        setCasualLeaves(settingsData.casualLeaves);
        setSickLeaves(settingsData.sickLeaves);
        setEarnedLeaves(settingsData.earnedLeaves);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.show('Failed to load settings', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      await SettingsService.saveSettings({
        currency,
        companyName,
        workingDays,
        casualLeaves,
        sickLeaves,
        earnedLeaves,
        updatedBy: user.id,
      });

      toast.show('Settings saved successfully!', { type: 'success', duration: 3000 });
      // Reload settings to ensure state is updated
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.show('Failed to save settings', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCleanData = async () => {
    if (!confirm('Are you sure you want to clean ALL data? This action cannot be undone!')) {
      return;
    }

    setCleaningData(true);
    try {
      const response = await fetch('/api/clean-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.show('Data cleaned successfully', { type: 'success' });
        console.log('Clean results:', result.results);
      } else {
        throw new Error(result.error || 'Failed to clean data');
      }
    } catch (error) {
      console.error('Error cleaning data:', error);
      toast.show('Failed to clean data', { type: 'error' });
    } finally {
      setCleaningData(false);
    }
  };

  const handleInitializeDefaults = async () => {
    setInitializing(true);
    try {
      // Initialize leave policies
      await fetch('/api/leave-policies/init', { method: 'POST' });

      // Initialize salary configs for existing employees
      await fetch('/api/salary-configs/init', { method: 'POST' });

      toast.show('Default data initialized successfully', { type: 'success' });
    } catch (error) {
      console.error('Error initializing defaults:', error);
      toast.show('Failed to initialize defaults', { type: 'error' });
    } finally {
      setInitializing(false);
    }
  };

  if (loading) return <Loader />;

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

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6 text-red-600">⚠️ Data Management (Development Only)</h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            These options are only available in development mode and will permanently delete data.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={handleCleanData}
              disabled={cleaningData}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cleaningData ? 'Cleaning...' : 'Clean All Data'}
            </Button>
            <Button
              onClick={handleInitializeDefaults}
              disabled={initializing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {initializing ? 'Initializing...' : 'Initialize Defaults'}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Clean All Data: Removes all attendance, leave, salary, and employee records.<br/>
            Initialize Defaults: Sets up default leave policies and salary configurations.
          </p>
        </div>
      </div>

      <Button
        onClick={handleSaveSettings}
        disabled={saving}
        className="w-full md:w-auto"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
