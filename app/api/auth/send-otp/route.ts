import { NextResponse } from 'next/server';
import { generateOtp, sendOtpEmail, sendOtpSms } from '@/lib/otp-service';

export async function POST(request: Request) {
  let body: { email?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = body.email?.trim();
  const phone = body.phone?.trim();

  if (!email && !phone) {
    return NextResponse.json({ error: 'Email or phone number is required.' }, { status: 400 });
  }

  const targetIdentifier = email || phone || '';
  const otp = generateOtp(targetIdentifier);

  if (email) {
    await sendOtpEmail(email, otp);
    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${email}. Please check your inbox.`,
    });
  }

  if (phone) {
    await sendOtpSms(phone, otp);
    return NextResponse.json({
      success: true,
      message: `OTP sent to ${phone}. Please check your SMS inbox.`,
    });
  }

  return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
}
