'use client';

import { useState, useEffect } from 'react';
import { LeaveService } from '@/services/leave.service';
import { EmployeeService } from '@/services/employee.service';
import { LeaveRequest } from '@/types/leave';
import { Employee } from '@/types/employee';
import Loader from '@/components/ui/Loader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/auth.store';

export default function AdminLeavesPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requests, emps] = await Promise.all([
        LeaveService.getAllLeaveRequests(),
        EmployeeService.getAllEmployees(),
      ]);
      setLeaveRequests(requests);
      setEmployees(emps);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (userId: string) => {
    const employee = employees.find((emp) => emp.userId === userId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  };

  const getEmployeeDetails = (userId: string) => {
    return employees.find((emp) => emp.userId === userId);
  };

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    try {
      await LeaveService.approveLeave(requestId, user?.id);
      await loadData();
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Failed to approve leave request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;

    setProcessing(selectedRequest.id);
    try {
      await LeaveService.rejectLeave(selectedRequest.id, rejectionReason.trim());
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      await loadData();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Failed to reject leave request');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

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

  const calculateDays = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All ({leaveRequests.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'primary' : 'secondary'}
            onClick={() => setFilter('pending')}
          >
            Pending ({leaveRequests.filter(r => r.status === 'pending').length})
          </Button>
          <Button
            variant={filter === 'approved' ? 'primary' : 'secondary'}
            onClick={() => setFilter('approved')}
          >
            Approved ({leaveRequests.filter(r => r.status === 'approved').length})
          </Button>
          <Button
            variant={filter === 'rejected' ? 'primary' : 'secondary'}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({leaveRequests.filter(r => r.status === 'rejected').length})
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Total Requests</h3>
          <p className="text-2xl font-bold">{leaveRequests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {leaveRequests.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Approved</h3>
          <p className="text-2xl font-bold text-green-600">
            {leaveRequests.filter(r => r.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Rejected</h3>
          <p className="text-2xl font-bold text-red-600">
            {leaveRequests.filter(r => r.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Employee</th>
                <th className="px-6 py-3 text-left font-semibold">Type</th>
                <th className="px-6 py-3 text-left font-semibold">Duration</th>
                <th className="px-6 py-3 text-left font-semibold">Days</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Applied Date</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{getEmployeeName(request.userId)}</div>
                      <div className="text-sm text-gray-500">
                        {getEmployeeDetails(request.userId)?.position}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize font-medium">{request.leaveType}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>{request.startDate.toDateString()}</div>
                      <div className="text-gray-500">to</div>
                      <div>{request.endDate.toDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{calculateDays(request.startDate, request.endDate)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4">
                    {request.createdAt.toDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApprove(request.id)}
                            disabled={processing === request.id}
                          >
                            {processing === request.id ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => openRejectModal(request)}
                            disabled={processing === request.id}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedRequest(request)}
                      >
                        View Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRequests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No leave requests found for the selected filter
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && !showRejectModal && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="Leave Request Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <p className="mt-1 text-sm">{getEmployeeName(selectedRequest.userId)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <p className="mt-1 text-sm">{getEmployeeDetails(selectedRequest.userId)?.position}</p>
              </div>
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
                <p className="mt-1 text-sm font-medium">{calculateDays(selectedRequest.startDate, selectedRequest.endDate)}</p>
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
                <p className="mt-1 text-sm bg-red-50 p-3 rounded text-red-800">{selectedRequest.rejectionReason}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
          setSelectedRequest(null);
        }}
        title="Reject Leave Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 h-24"
              placeholder="Please provide a reason for rejecting this leave request..."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
                setSelectedRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing === selectedRequest?.id}
            >
              {processing === selectedRequest?.id ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
