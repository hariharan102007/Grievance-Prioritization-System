import { NextResponse } from 'next/server';
import { deleteOtp, generateOtp, sendOtpEmail, sendOtpSms } from '@/lib/otp-service';

export const runtime = 'nodejs';

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
  try {
    const otp = await generateOtp(targetIdentifier);

    if (email) {
      const result = await sendOtpEmail(email, otp);
      if (!result.success) {
        await deleteOtp(targetIdentifier);
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        message: `OTP sent successfully to ${email}. Please check your inbox.`,
      });
    }

    if (phone) {
      const result = await sendOtpSms(phone, otp);
      if (!result.success) {
        await deleteOtp(targetIdentifier);
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        message: `OTP sent successfully to ${phone}. Please check your messages.`,
      });
    }
  } catch (error) {
    console.error('[OTP request failed]', error);
    return NextResponse.json(
      { error: 'OTP service is unavailable. Check MongoDB and email settings in Vercel.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
}
