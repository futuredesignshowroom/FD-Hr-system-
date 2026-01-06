// app/api/check-data/route.ts - API endpoint to check current data

import { NextRequest, NextResponse } from 'next/server';
import { FirestoreDB } from '@/lib/firestore';

export async function GET(_request: NextRequest) {
  try {
    console.log('Checking current data...');

    // Collections to check
    const collections = [
      'attendance',
      'leaves',
      'leaveBalance',
      'salary',
      'salaryConfig',
      'employees',
      'leaveConfig',
      'notifications'
    ];

    const results: Record<string, any> = {};

    for (const collectionName of collections) {
      try {
        const documents = await FirestoreDB.getCollection(collectionName) as { id: string }[];
        results[collectionName] = {
          count: documents.length,
          documents: documents.length <= 3 ? documents : documents.slice(0, 3)
        };
        console.log(`${collectionName}: ${documents.length} documents`);
      } catch (error) {
        console.error(`Error checking ${collectionName}:`, error);
        results[collectionName] = { error: (error as Error).message };
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error checking data:', error);
    return NextResponse.json(
      { error: 'Failed to check data', details: (error as Error).message },
      { status: 500 }
    );
  }
}