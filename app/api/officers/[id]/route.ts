import { NextResponse } from 'next/server';
import { getOfficerById, updateOfficer } from '@/lib/officers-store';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const officer = getOfficerById(params.id);
    if (!officer) {
      return NextResponse.json({ error: 'Officer not found' }, { status: 404 });
    }
    return NextResponse.json(officer);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = updateOfficer(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Officer not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
