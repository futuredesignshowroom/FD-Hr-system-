// app/api/leaves/route.ts - Leave API Routes

import { NextRequest, NextResponse } from 'next/server';
import { LeaveService } from '@/services/leave.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    // TODO: Implement getLeavesByUserId and getLeavesByStatus in LeaveService
    return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
  } catch (error) {
    console.error('Leave API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch leaves' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, leaveDocId, userId, startDate, endDate, leaveType, reason, adminId } =
      await request.json();

    switch (action) {
      case 'apply':
        const docId = await LeaveService.applyLeave({
          userId,
          startDate,
          endDate,
          leaveType,
          reason,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return NextResponse.json({ id: docId, message: 'Leave request submitted successfully' }, { status: 201 });

      case 'approve':
        await LeaveService.approveLeave(leaveDocId, adminId);
        return NextResponse.json(
          { message: 'Leave approved' },
          { status: 200 }
        );

      case 'reject':
        await LeaveService.rejectLeave(leaveDocId, reason);
        return NextResponse.json(
          { message: 'Leave rejected' },
          { status: 200 }
        );

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Leave API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process leave' },
      { status: 500 }
    );
  }
}
