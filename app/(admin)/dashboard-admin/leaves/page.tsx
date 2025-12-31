'use client';

import { useState, useEffect } from 'react';
import { LeaveService } from '@/services/leave.service';
import { EmployeeService } from '@/services/employee.service';
import { LeaveRequest } from '@/types/leave';
import { Employee } from '@/types/employee';
import Loader from '@/components/ui/Loader';

export default function AdminLeavesPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

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

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    try {
      await LeaveService.approveLeave(requestId);
      await loadData();
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Failed to approve leave request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return; // Cancelled

    setProcessing(requestId);
    try {
      await LeaveService.rejectLeave(requestId, reason);
      await loadData();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Failed to reject leave request');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Leave Management</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Employee</th>
              <th className="px-6 py-3 text-left font-semibold">Type</th>
              <th className="px-6 py-3 text-left font-semibold">From</th>
              <th className="px-6 py-3 text-left font-semibold">To</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.map((request) => (
              <tr key={request.id} className="border-b">
                <td className="px-6 py-4">{getEmployeeName(request.userId)}</td>
                <td className="px-6 py-4 capitalize">{request.type}</td>
                <td className="px-6 py-4">
                  {request.startDate.toDateString()}
                </td>
                <td className="px-6 py-4">
                  {request.endDate.toDateString()}
                </td>
                <td className="px-6 py-4">
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
                <td className="px-6 py-4 space-x-2">
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processing === request.id}
                        className="text-green-600 hover:underline disabled:opacity-50"
                      >
                        {processing === request.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processing === request.id}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        {processing === request.id ? 'Processing...' : 'Reject'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leaveRequests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No leave requests found
          </div>
        )}
      </div>
    </div>
  );
}
