import { NextResponse } from 'next/server';
import { getOfficers, createOfficer } from '@/lib/officers-store';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    let officers = getOfficers();

    if (department && department !== 'all') {
      officers = officers.filter((o) => o.department.toLowerCase() === department.toLowerCase());
    }
    if (status && status !== 'all') {
      officers = officers.filter((o) => o.status.toLowerCase() === status.toLowerCase());
    }

    return NextResponse.json(officers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve officers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.employee_id || !body.email) {
      return NextResponse.json(
        { error: 'Name, employee_id, and email are required fields.' },
        { status: 400 }
      );
    }

    const created = createOfficer(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create officer' }, { status: 500 });
  }
}
