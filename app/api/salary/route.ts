// app/api/salary/route.ts - Salary API Routes

import { NextRequest, NextResponse } from 'next/server';
import { SalaryService } from '@/services/salary.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    if (month && year) {
      const salary = await SalaryService.getSalary(
        userId,
        parseInt(month),
        parseInt(year)
      );
      return NextResponse.json(salary, { status: 200 });
    }

    // Get current month salary
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentSalary = await SalaryService.getSalary(
      userId,
      currentMonth,
      currentYear
    );
    return NextResponse.json(currentSalary, { status: 200 });
  } catch (error) {
    console.error('Salary API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch salary' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userId, baseSalary, allowances, deductions, month, year } =
      await request.json();

    switch (action) {
      case 'setSalaryConfig':
        const configResult = await SalaryService.setSalaryConfig({
          baseSalary,
          allowances,
          deductions,
        } as any);
        return NextResponse.json(configResult, { status: 201 });

      case 'createSalary':
        const createResult = await SalaryService.createSalary({
          month,
          year,
          baseSalary,
          allowances,
          deductions,
          netSalary: 0,
          userId,
          createdAt: new Date(),
        } as any);
        return NextResponse.json(createResult, { status: 201 });

      case 'calculateAndCreate':
        const calculateResult =
          await SalaryService.calculateAndCreateSalary(
            userId,
            month,
            year,
            baseSalary,
            allowances || [],
            deductions || []
          );
        return NextResponse.json(calculateResult, { status: 201 });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Salary API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process salary' },
      { status: 500 }
    );
  }
}
