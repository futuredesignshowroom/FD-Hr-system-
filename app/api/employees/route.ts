// app/api/employees/route.ts - Employee API Routes

import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService } from '@/services/employee.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    const filters = {
      search: search || undefined,
      department: department || undefined,
      page: parseInt(page || '1'),
      limit: parseInt(limit || '10'),
    };

    const result = await EmployeeService.searchEmployees(filters);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Employee API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const employeeData = await request.json();
    const result = await EmployeeService.createEmployee(employeeData);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create employee' },
      { status: 500 }
    );
  }
}
