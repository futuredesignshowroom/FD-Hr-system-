'use client';

import { useState, useEffect } from 'react';
import { LeaveService } from '@/services/leave.service';
import { useAuthStore } from '@/store/auth.store';
import { LeaveRequest, LeaveType } from '@/types/leave';
import Loader from '@/components/ui/Loader';

export default function EmployeeLeavesPage() {
  const { user } = useAuthStore();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'casual' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    if (user) {
      loadLeaveRequests();
    }
  }, [user]);

  const loadLeaveRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const requests = await LeaveService.getUserLeaveRequests(user.id);
      setLeaveRequests(requests);
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const leaveRequest: LeaveRequest = {
        id: '',
        userId: user.id,
        type: formData.type,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        reason: formData.reason,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await LeaveService.applyLeave(leaveRequest);
      setFormData({
        type: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
      });
      await loadLeaveRequests(); // Refresh the list
      alert('Leave request submitted successfully!');
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Failed to submit leave request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Leaves</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Total Allowed
          </h3>
          <p className="text-2xl font-bold">12</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Used
          </h3>
          <p className="text-2xl font-bold">
            {leaveRequests.filter(r => r.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Remaining
          </h3>
          <p className="text-2xl font-bold">
            {12 - leaveRequests.filter(r => r.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Pending
          </h3>
          <p className="text-2xl font-bold">
            {leaveRequests.filter(r => r.status === 'pending').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Leave Type</label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="earned">Earned Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={4}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Leave History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">From</th>
                <th className="px-4 py-2 text-left">To</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request.id} className="border-b">
                  <td className="px-4 py-2 capitalize">{request.type}</td>
                  <td className="px-4 py-2">
                    {request.startDate.toDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {request.endDate.toDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        request.status === 'approved'
                          ? 'bg-green-200 text-green-800'
                          : request.status === 'rejected'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{request.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
