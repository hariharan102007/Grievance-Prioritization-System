import { NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/otp-service';

export async function POST(request: Request) {
  let body: { email?: string; phone?: string; token?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const token = (body.token || body.otp || '').trim();

  const targetIdentifier = email || phone || '';

  if (!targetIdentifier) {
    return NextResponse.json({ error: 'Email or phone number is required.' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: 'OTP code is required.' }, { status: 400 });
  }

  const isValid = verifyOtpCode(targetIdentifier, token);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid or expired OTP. Please check the code sent to your email and try again.' },
      { status: 400 }
    );
  }

  const userEmail = email || `${phone}@phone.user`;
  const name = userEmail.includes('@') ? userEmail.split('@')[0] : 'Citizen User';

  return NextResponse.json({
    success: true,
    user: {
      id: 'usr_' + Math.random().toString(36).substring(2, 11),
      email: userEmail,
      name,
    },
  });
}
