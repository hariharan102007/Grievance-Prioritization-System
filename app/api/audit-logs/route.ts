import { NextResponse } from 'next/server';
import { getAuditLogsForComplaint } from '@/lib/server-db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const complaint_id = searchParams.get('complaint_id');

    if (!complaint_id) {
      return NextResponse.json(
        { error: 'complaint_id is required' },
        { status: 400 }
      );
    }

    const logs = await getAuditLogsForComplaint(complaint_id);
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('[API /api/audit-logs GET error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit logs' },
      { status: 500 }
    );
  }
}
