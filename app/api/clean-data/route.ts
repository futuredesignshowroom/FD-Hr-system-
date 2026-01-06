// app/api/clean-data/route.ts - API endpoint to clean all data

import { NextResponse } from 'next/server';
import { FirestoreDB } from '@/lib/firestore';

export async function POST() {
  try {
    // Only allow in development or with proper authentication
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Data cleaning not allowed in production' },
        { status: 403 }
      );
    }

    console.log('Starting data cleanup...');

    // Collections to clean
    const collections = [
      'attendance',
      'leaves',
      'leaveBalance',
      'salary',
      'salaryConfig',
      'employees',
      'notifications'
    ];

    const results: Record<string, any> = {};

    for (const collectionName of collections) {
      try {
        console.log(`Cleaning collection: ${collectionName}`);

        // Get all documents
        const documents = await FirestoreDB.getCollection(collectionName) as { id: string }[];
        let deletedCount = 0;

        // Delete each document
        for (const doc of documents) {
          await FirestoreDB.deleteDocument(collectionName, doc.id);
          deletedCount++;
        }

        results[collectionName] = { deleted: deletedCount, success: true };
        console.log(`Successfully cleaned ${collectionName}: ${deletedCount} documents deleted`);

      } catch (error) {
        console.error(`Error cleaning ${collectionName}:`, error);
        results[collectionName] = { error: (error as Error).message, success: false };
      }
    }

    console.log('Data cleanup completed');

    return NextResponse.json({
      success: true,
      message: 'Data cleanup completed',
      results
    });

  } catch (error) {
    console.error('Error during data cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to clean data', details: (error as Error).message },
      { status: 500 }
    );
  }
}