import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import mongoose, { Schema, models } from 'mongoose';

type OtpRecord = {
  identifier: string;
  tokenHash: string;
  expiresAt: Date;
};

const otpSchema = new Schema<OtpRecord>({
  identifier: { type: String, required: true, unique: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

const Otp: mongoose.Model<OtpRecord> =
  (models.Otp as mongoose.Model<OtpRecord> | undefined) || mongoose.model<OtpRecord>('Otp', otpSchema);

const globalMongo = globalThis as typeof globalThis & {
  mongoConnection?: Promise<typeof mongoose>;
};

async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured.');
  globalMongo.mongoConnection ??= mongoose.connect(uri);
  try {
    await globalMongo.mongoConnection;
  } catch (error) {
    globalMongo.mongoConnection = undefined;
    throw error;
  }
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function hashOtp(otp: string) {
  const secret = process.env.OTP_SECRET || process.env.MONGODB_URI;
  if (!secret) throw new Error('Configure MONGODB_URI or OTP_SECRET.');
  return createHmac('sha256', secret).update(otp).digest('hex');
}

export async function generateOtp(identifier: string): Promise<string> {
  await connectMongo();
  const otp = randomInt(100000, 1000000).toString();
  await Otp.findOneAndUpdate(
    { identifier: normalizeIdentifier(identifier) },
    { tokenHash: hashOtp(otp), expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return otp;
}

export async function verifyOtpCode(identifier: string, code: string): Promise<boolean> {
  await connectMongo();
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const record = await Otp.findOne({ identifier: normalizedIdentifier }).lean();
  if (!record || record.expiresAt.getTime() <= Date.now()) {
    await Otp.deleteOne({ identifier: normalizedIdentifier });
    return false;
  }

  const expected = Buffer.from(record.tokenHash, 'hex');
  const actual = Buffer.from(hashOtp(code.trim()), 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;

  const result = await Otp.deleteOne({ _id: record._id, tokenHash: record.tokenHash });
  return result.deletedCount === 1;
}

export async function deleteOtp(identifier: string) {
  await connectMongo();
  await Otp.deleteOne({ identifier: normalizeIdentifier(identifier) });
}

function buildMailOptions(email: string, otp: string, senderEmail?: string) {
  return {
    from:
      process.env.EMAIL_FROM ||
      (senderEmail
        ? `"Grievance Portal" <${senderEmail}>`
        : '"Grievance Portal" <no-reply@grievanceportal.gov.in>'),
    to: email,
    subject: `Your Login OTP Code: ${otp}`,
    text: `Your OTP code for Grievance Portal login is: ${otp}. It is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 8px 16px; background-color: #f0f9ff; border-radius: 20px; color: #0284c7; font-weight: bold; font-size: 14px;">
            Grievance Portal Security
          </div>
          <h2 style="color: #0f172a; margin: 16px 0 4px 0; font-size: 22px;">Login Verification Code</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Use the code below to log into your account</p>
        </div>
        
        <div style="padding: 24px; background-color: #f8fafc; border: 1px border-slate-200; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px; font-weight: 500;">Your One-Time Password (OTP):</p>
          <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0284c7; font-family: monospace; background: #ffffff; padding: 14px 28px; border-radius: 8px; display: inline-block; border: 2px dashed #bae6fd; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            ${otp}
          </div>
          <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 12px;">Valid for the next 5 minutes</p>
        </div>
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Please enter this OTP code on the login page to access your dashboard. If you did not request this email, please ignore this message.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          &copy; Grievance Portal System &bull; Secure Authentication Module
        </p>
      </div>
    `,
  };
}

export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; messageUrl?: string; error?: string }> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const emailFrom = process.env.EMAIL_FROM?.trim();

    if (resendApiKey) {
      if (!emailFrom) {
        return { success: false, error: 'Email sender is not configured. Set EMAIL_FROM in Vercel.' };
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [email],
          subject: 'Your Grievance Portal login OTP',
          text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
          html: `<p>Your Grievance Portal OTP is <strong>${otp}</strong>.</p><p>It is valid for 5 minutes.</p>`,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        console.error('[Resend email error]', response.status, details);
        return { success: false, error: 'Email provider rejected the message. Check your Resend sender domain and Vercel logs.' };
      }

      return { success: true };
    }

    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS)
      ?.replace(/\s+/g, '')
      .trim();
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
    const smtpPort = parseInt(
      process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || '587',
      10
    );
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;

    const isRealGmail =
      gmailUser &&
      gmailPass &&
      gmailUser.includes('@') &&
      !gmailUser.includes('your_email@gmail.com') &&
      !gmailPass.includes('your_16_digit_app_password');

    const isRealSmtp =
      smtpHost &&
      smtpUser &&
      smtpPass &&
      !smtpUser.includes('your_') &&
      !smtpPass.includes('your_');

    if (isRealGmail || isRealSmtp) {
      try {
        const nodemailer = (await import('nodemailer')).default;
        const transporter = isRealGmail
          ? nodemailer.createTransport({
              service: 'gmail',
              auth: { user: gmailUser, pass: gmailPass },
            })
          : nodemailer.createTransport({
              host: smtpHost,
              port: smtpPort,
              secure: smtpPort === 465,
              auth: { user: smtpUser, pass: smtpPass },
            });
        const mailOptions = buildMailOptions(email, otp, gmailUser);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[OTP email sent] Message ID: ${info.messageId}`);
        return { success: true };
      } catch (mailError: any) {
        console.error('[OTP email delivery error]', mailError?.message || mailError);
        return { success: false, error: 'Email delivery failed. Check the email settings and Vercel function logs.' };
      }
    }

    return { success: false, error: 'Email is not configured. Add RESEND_API_KEY and EMAIL_FROM in Vercel.' };
  } catch (error: any) {
    const rawError = String(error?.message || error || '');
    console.error('[OTP Email Exception]', rawError);
    return { success: false, error: 'Unable to send email. Check the email settings and Vercel function logs.' };
  }
}

export async function sendOtpSms(
  phone: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioAuthToken && twilioFrom) {
      const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const body = new URLSearchParams({
        To: phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`,
        From: twilioFrom,
        Body: `Your Grievance Portal login OTP code is: ${otp}. Valid for 5 minutes.`,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('[Twilio SMS Error]', errData);
        return { success: false, error: errData.message || 'SMS delivery failed.' };
      }
      console.log(`[Twilio SMS Sent to ${phone}] Code: ${otp}`);
      return { success: true };
    }

    return { success: false, error: 'SMS is not configured. Use email OTP or configure Twilio in Vercel.' };
  } catch (err: any) {
    console.error('[SMS Delivery Exception]', err);
    return { success: false, error: 'SMS delivery failed. Check the Twilio settings and Vercel function logs.' };
  }
}
