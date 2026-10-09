import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/server-db';
import { DEPARTMENTS_DATA } from '@/lib/departments-data';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDatabase();
    const complaints = db.complaints;

    const departmentsWithStats = DEPARTMENTS_DATA.map((dept) => {
      const deptComplaints = complaints.filter(
        (c) =>
          (c.department || '').toLowerCase() === dept.name.toLowerCase() ||
          (c.category || '').toLowerCase() === dept.category.toLowerCase()
      );

      const active = deptComplaints.filter((c) => c.status !== 'Resolved').length;
      const resolved = deptComplaints.filter((c) => c.status === 'Resolved').length;
      const critical = deptComplaints.filter(
        (c) => c.priority === 'Critical' && c.status !== 'Resolved'
      ).length;

      return {
        ...dept,
        stats: {
          total: deptComplaints.length,
          active,
          resolved,
          critical,
        },
      };
    });

    return NextResponse.json(departmentsWithStats);
  } catch (error: any) {
    console.error('[API /api/departments GET error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve departments' },
      { status: 500 }
    );
  }
}
