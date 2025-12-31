// app/api/attendance/route.ts - Attendance API Routes

import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService } from '@/services/attendance.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    if (date) {
      const attendance = await AttendanceService.getAttendanceByDate(
        userId,
        new Date(date)
      );
      return NextResponse.json(attendance, { status: 200 });
    }

    // Get current month attendance
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const attendance = await AttendanceService.getMonthlyAttendance(
      userId,
      month,
      year
    );
    return NextResponse.json(attendance, { status: 200 });
  } catch (error) {
    console.error('Attendance API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userId, status, timestamp } = await request.json();

    switch (action) {
      case 'checkin':
        const checkinResult = await AttendanceService.checkIn(userId);
        return NextResponse.json(checkinResult, { status: 201 });

      case 'checkout':
        const checkoutResult = await AttendanceService.checkOut(userId);
        return NextResponse.json(checkoutResult, { status: 201 });

      case 'mark':
        const markResult = await AttendanceService.markAttendance(
          userId,
          timestamp,
          status
        );
        return NextResponse.json(markResult, { status: 201 });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Attendance API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process attendance' },
      { status: 500 }
    );
  }
}
