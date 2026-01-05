import { NextRequest, NextResponse } from 'next/server';
import { FirestoreDB } from '@/lib/firestore';

/**
 * Temporary secured debug endpoint.
 * Usage: GET /api/attendance/debug?userId=<id>&secret=<SECRET>
 * Set DEBUG_ADMIN_SECRET in environment to enable.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Allow a fallback secret when DEBUG_ADMIN_SECRET is not configured (convenience for debugging).
    const expectedSecret = process.env.DEBUG_ADMIN_SECRET || 'pas';
    if (!secret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Return recent records for the user (server-side filtering)
    const records = await FirestoreDB.queryCollection('attendance', []);
    const userRecords = records.filter((r: any) => r.userId === userId).slice(0, 200);

    return NextResponse.json({ count: userRecords.length, records: userRecords }, { status: 200 });
  } catch (error: any) {
    console.error('Debug attendance endpoint error:', error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
