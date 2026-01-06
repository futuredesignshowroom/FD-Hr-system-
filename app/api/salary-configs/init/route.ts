// app/api/salary-configs/init/route.ts - Initialize salary configurations for employees

import { NextResponse } from 'next/server';
import { SalaryService } from '@/services/salary.service';
import { EmployeeService } from '@/services/employee.service';
import { SalaryConfig } from '@/types/salary';

export async function POST() {
  try {
    // Only allow in development or with proper authentication
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Salary config initialization not allowed in production' },
        { status: 403 }
      );
    }

    console.log('Initializing salary configurations for all employees...');

    // Get all employees
    const employees = await EmployeeService.getAllEmployees();
    let configsCreated = 0;

    for (const employee of employees) {
      console.log(`Processing employee: ${employee.firstName} ${employee.lastName}`);

      // Check if salary config already exists
      const existingConfig = await SalaryService.getSalaryConfig(employee.id);

      if (existingConfig) {
        console.log(`Salary config already exists for ${employee.firstName} ${employee.lastName}`);
        continue;
      }

      // Create default salary config
      const salaryConfig: SalaryConfig = {
        userId: employee.id,
        baseSalary: 30000, // Default base salary
        allowances: [
          {
            id: 'conveyance-' + employee.id,
            name: 'Conveyance Allowance',
            amount: 5000,
            type: 'fixed' as const
          },
          {
            id: 'medical-' + employee.id,
            name: 'Medical Allowance',
            amount: 3000,
            type: 'fixed' as const
          }
        ],
        totalLeavesAllowed: 30,
        workingDaysPerMonth: 26,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await SalaryService.setSalaryConfig(salaryConfig);
      configsCreated++;

      console.log(`Created salary config for ${employee.firstName} ${employee.lastName}`);
    }

    console.log(`Successfully created ${configsCreated} salary configurations`);

    return NextResponse.json({
      success: true,
      message: `Salary configurations initialized for ${configsCreated} employees`
    });

  } catch (error) {
    console.error('Error initializing salary configurations:', error);
    return NextResponse.json(
      { error: 'Failed to initialize salary configurations', details: (error as Error).message },
      { status: 500 }
    );
  }
}