// app/api/leave-policies/init/route.ts - Initialize default leave policies

import { NextRequest, NextResponse } from 'next/server';
import { LeaveConfigService } from '@/services/leave-config.service';

export async function POST(_request: NextRequest) {
  try {
    // Only allow in development or with proper authentication
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Leave policy initialization not allowed in production' },
        { status: 403 }
      );
    }

    console.log('Initializing default leave policies...');

    // Initialize default policies
    await LeaveConfigService.initializeDefaultPolicies();

    console.log('Leave policies initialized successfully');

    return NextResponse.json({
      success: true,
      message: 'Default leave policies initialized successfully'
    });

  } catch (error) {
    console.error('Error initializing leave policies:', error);
    return NextResponse.json(
      { error: 'Failed to initialize leave policies', details: (error as Error).message },
      { status: 500 }
    );
  }
}