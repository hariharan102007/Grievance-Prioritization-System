import { NextResponse } from 'next/server';
import { listComplaints, insertComplaint } from '@/lib/server-db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticket_id = searchParams.get('ticket_id') || undefined;
    const department = searchParams.get('department') || undefined;
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const order = searchParams.get('order') || undefined;
    const ascending = searchParams.get('ascending') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    const complaints = await listComplaints({
      ticket_id,
      department,
      status,
      category,
      search,
      order,
      ascending,
      limit,
    });

    return NextResponse.json(complaints);
  } catch (error: any) {
    console.error('[API /api/complaints GET error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaints from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.description && !body.category) {
      return NextResponse.json(
        { error: 'Complaint description is required' },
        { status: 400 }
      );
    }

    const created = await insertComplaint(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('[API /api/complaints POST error]:', error);
    return NextResponse.json(
      { error: 'Failed to save complaint to database' },
      { status: 500 }
    );
  }
}
