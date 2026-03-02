import { NextResponse } from 'next/server';

/**
 * Health check endpoint for deployment monitoring
 * Returns 200 OK if the application is running
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'readyroad-web',
      version: '1.0.0',
    },
    { status: 200 }
  );
}
