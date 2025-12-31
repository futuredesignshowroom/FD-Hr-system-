'use client';

import { useState, useEffect } from 'react';
import { LeaveService } from '@/services/leave.service';
import { LeaveConfigService } from '@/services/leave-config.service';
import { useAuthStore } from '@/store/auth.store';
import { LeaveRequest, LeaveType, LeaveBalance } from '@/types/leave';
import Loader from '@/components/ui/Loader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function EmployeeLeavesPage() {
  const { user } = useAuthStore();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [formData, setFormData] = useState({
    leaveType: 'casual' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [requests, balances] = await Promise.all([
        LeaveService.getUserLeaveRequests(user.id),
        LeaveConfigService.getUserLeaveBalance(user.id)
      ]);
      setLeaveRequests(requests);
      setLeaveBalances(balances);
    } catch (error) {
      console.error('Error loading leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      alert('Start date cannot be in the past.');
      return;
    }

    if (end < start) {
      alert('End date must be after start date.');
      return;
    }

    if (!formData.reason.trim()) {
      alert('Please provide a reason for the leave.');
      return;
    }

    // Check leave balance
    const balance = leaveBalances.find(b => b.leaveType === formData.leaveType);
    const requestedDays = calculateDays(start, end);

    if (balance && balance.remaining < requestedDays) {
      alert(`Insufficient leave balance. You have ${balance.remaining} days remaining for ${formData.leaveType} leave.`);
      return;
    }

    setSubmitting(true);
    try {
      const leaveRequest: LeaveRequest = {
        id: '',
        userId: user.id,
        leaveType: formData.leaveType,
        startDate: start,
        endDate: end,
        reason: formData.reason.trim(),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await LeaveService.applyLeave(leaveRequest);
      setFormData({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
      });
      await loadData(); // Refresh the list
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

  const calculateDays = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getLeaveTypeOptions = () => {
    return leaveBalances.map(balance => ({
      value: balance.leaveType,
      label: `${balance.leaveType.charAt(0).toUpperCase() + balance.leaveType.slice(1)} Leave (${balance.remaining} days remaining)`,
      disabled: balance.remaining <= 0
    }));
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Leaves</h1>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {leaveBalances.map((balance) => (
          <div key={balance.leaveType} className="bg-white rounded-lg shadow p-4">
            <h3 className="text-gray-500 text-sm font-semibold mb-2 capitalize">
              {balance.leaveType}
            </h3>
            <div className="space-y-1">
              <p className="text-lg font-bold">{balance.remaining}</p>
              <p className="text-xs text-gray-500">
                Used: {balance.used}/{balance.totalAllowed}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Total Balance</h3>
          <p className="text-2xl font-bold">
            {leaveBalances.reduce((total, balance) => total + balance.remaining, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Used This Year</h3>
          <p className="text-2xl font-bold text-orange-600">
            {leaveBalances.reduce((total, balance) => total + balance.used, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Pending Requests</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {leaveRequests.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Approved This Year</h3>
          <p className="text-2xl font-bold text-green-600">
            {leaveRequests.filter(r => r.status === 'approved').length}
          </p>
        </div>
      </div>

      {/* Apply for Leave Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Leave Type</label>
              <select
                value={formData.leaveType}
                onChange={(e) => handleInputChange('leaveType', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {getLeaveTypeOptions().map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div></div>
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Total Days:</strong> {calculateDays(new Date(formData.startDate), new Date(formData.endDate))}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Reason for Leave</label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Please provide a detailed reason for your leave request..."
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto"
          >
            {submitting ? 'Submitting Request...' : 'Submit Leave Request'}
          </Button>
        </form>
      </div>

      {/* Leave History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Leave History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Duration</th>
                <th className="px-4 py-2 text-left">Days</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Applied Date</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 capitalize font-medium">{request.leaveType}</td>
                  <td className="px-4 py-2">
                    <div className="text-sm">
                      <div>{request.startDate.toDateString()}</div>
                      <div className="text-gray-500">to</div>
                      <div>{request.endDate.toDateString()}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {calculateDays(request.startDate, request.endDate)}
                  </td>
                  <td className="px-4 py-2">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-4 py-2">
                    {request.createdAt.toDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedRequest(request)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leaveRequests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No leave requests found. Apply for your first leave above.
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="Leave Request Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                <p className="mt-1 text-sm capitalize">{selectedRequest.leaveType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Date</label>
                <p className="mt-1 text-sm">{selectedRequest.startDate.toDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">To Date</label>
                <p className="mt-1 text-sm">{selectedRequest.endDate.toDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Days</label>
                <p className="mt-1 text-sm font-medium">
                  {calculateDays(selectedRequest.startDate, selectedRequest.endDate)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Applied Date</label>
                <p className="mt-1 text-sm">{selectedRequest.createdAt.toDateString()}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <p className="mt-1 text-sm bg-gray-50 p-3 rounded">{selectedRequest.reason}</p>
            </div>
            {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                <p className="mt-1 text-sm bg-red-50 p-3 rounded text-red-800">
                  {selectedRequest.rejectionReason}
                </p>
              </div>
            )}
            {selectedRequest.status === 'approved' && (
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-green-800">
                  ✅ Your leave request has been approved. Enjoy your time off!
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
