// app/api/auth/route.ts - Authentication API Routes

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name, role, department } =
      await request.json();

    switch (action) {
      case 'register':
        const user = await AuthService.register(email, password, {
          name,
          role,
          department,
        });
        return NextResponse.json(user, { status: 201 });

      case 'getCurrentUser':
        const currentUser = await AuthService.getCurrentUser(email);
        return NextResponse.json(currentUser, { status: 200 });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Auth failed' },
      { status: 500 }
    );
  }
}
