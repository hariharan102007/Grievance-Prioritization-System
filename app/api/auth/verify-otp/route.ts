import { NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/otp-service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: { email?: string; phone?: string; token?: string; otp?: string; proof?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const token = (body.token || body.otp || '').trim();

  // Extract proof from request body or cookie
  let proof = body.proof?.trim();
  if (!proof) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/grievance_otp_proof=([^;]+)/);
    if (match) {
      proof = decodeURIComponent(match[1]);
    }
  }

  const targetIdentifier = email || phone || '';

  if (!targetIdentifier) {
    return NextResponse.json({ error: 'Email or phone number is required.' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: 'OTP code is required.' }, { status: 400 });
  }

  let isValid: boolean;
  try {
    isValid = await verifyOtpCode(targetIdentifier, token, proof);
  } catch (error) {
    console.error('[OTP verification failed]', error);
    return NextResponse.json(
      { error: 'OTP verification error. Please try again or use demo code 123456.' },
      { status: 500 }
    );
  }

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid or expired OTP. Please enter the correct 6-digit code or demo code 123456.' },
      { status: 400 }
    );
  }

  const userEmail = email || `${phone}@phone.user`;
  const name = userEmail.includes('@') ? userEmail.split('@')[0] : 'Citizen User';

  const response = NextResponse.json({
    success: true,
    user: {
      id: 'usr_' + Math.random().toString(36).substring(2, 11),
      email: userEmail,
      name,
    },
  });

  // Clear OTP proof cookie upon successful verification
  response.cookies.set('grievance_otp_proof', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
