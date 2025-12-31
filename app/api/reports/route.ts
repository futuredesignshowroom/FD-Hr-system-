// app/api/reports/route.ts - Reports and Analytics API Routes

import { NextRequest, NextResponse } from 'next/server';
import { ReportsService } from '@/services/reports.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    switch (metric) {
      case 'dashboard':
        const metrics = await ReportsService.getDashboardMetrics();
        return NextResponse.json(metrics, { status: 200 });

      case 'departments':
        const departments = await ReportsService.getDepartmentSummary();
        return NextResponse.json(departments, { status: 200 });

      case 'attendance':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate required' },
            { status: 400 }
          );
        }
        const attendance = await ReportsService.getAttendanceSummary(
          startDate,
          endDate
        );
        return NextResponse.json(attendance, { status: 200 });

      case 'performance':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId required' },
            { status: 400 }
          );
        }
        const performance = await ReportsService.getEmployeePerformance(
          userId
        );
        return NextResponse.json(performance, { status: 200 });

      default:
        return NextResponse.json(
          { error: 'Invalid metric' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
