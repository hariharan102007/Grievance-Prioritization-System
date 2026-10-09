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
    const { otp, proof, expiresAt } = await generateOtp(targetIdentifier);

    // Detect if real mail server is configured
    const hasRealMailConfig =
      Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ||
      Boolean(process.env.SMTP_HOST && process.env.SMTP_USER) ||
      Boolean(process.env.RESEND_API_KEY);

    let deliveryMessage = '';

    if (email) {
      const result = await sendOtpEmail(email, otp);
      if (!result.success) {
        await deleteOtp(targetIdentifier);
        return NextResponse.json({ error: result.error }, { status: 502 });
      }

      if (hasRealMailConfig) {
        deliveryMessage = `OTP sent to ${email}. Please check your inbox and spam folder.`;
      } else {
        deliveryMessage = `OTP generated! (Testing Mode: Your code is ${otp} or enter 123456)`;
      }
    } else if (phone) {
      const result = await sendOtpSms(phone, otp);
      if (!result.success) {
        await deleteOtp(targetIdentifier);
        return NextResponse.json({ error: result.error }, { status: 502 });
      }

      const hasTwilio = Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
      );

      if (hasTwilio) {
        deliveryMessage = `OTP sent via SMS to ${phone}. Please check your phone.`;
      } else {
        deliveryMessage = `SMS OTP generated! (Testing Mode: Your code is ${otp} or enter 123456)`;
      }
    }

    const response = NextResponse.json({
      success: true,
      message: deliveryMessage,
      proof,
      expiresAt,
      // Provide demo/test code when hosted without mail server configured
      demoCode: hasRealMailConfig ? undefined : otp,
    });

    // Set secure HTTP-only cookie for stateless serverless verification
    response.cookies.set('grievance_otp_proof', proof, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('[OTP request failed]', error);
    return NextResponse.json(
      { error: 'OTP service error. Please try again or use demo code 123456.' },
      { status: 500 }
    );
  }
}
