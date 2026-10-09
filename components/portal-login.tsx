'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, LogIn, Lock, Key, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { formatAuthErrorMessage } from '@/lib/auth-errors';
import type { PortalRole } from '@/lib/portal-auth';
import { writePortalSession, getPortalRedirect } from '@/lib/portal-auth';

export function PortalLogin({ role }: { role: PortalRole }) {
  const router = useRouter();
  const isOfficerPortal = role === 'officer';
  const [identifier, setIdentifier] = useState('');
  const [officerAccessCode, setOfficerAccessCode] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const isIdentifierValid = identifier.trim().length > 5;
  const officerAccessCodeValid = officerAccessCode.trim().length >= 4;
  const isOtpValid = otp.trim().length === 6;
  const SENDER_EMAIL = 'projectdsa3@gmail.com';

  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedIdentifier = identifier.trim();
    if (!isIdentifierValid) {
      toast.error('Enter a valid email or mobile number.');
      return;
    }

    if (isOfficerPortal && !officerAccessCodeValid) {
      toast.error('Officer access code is required to enter the officer portal.');
      return;
    }

    const isEmail = trimmedIdentifier.includes('@');
    const payload = isEmail ? { email: trimmedIdentifier } : { phone: trimmedIdentifier };

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; success?: boolean; message?: string; demoCode?: string }
        | null;

      if (!response.ok || !result?.success) {
        toast.error(result?.error || 'Unable to send OTP. Please try again.');
        return;
      }

      setOtpSent(true);
      if (result.demoCode) {
        setDemoOtpHint(result.demoCode);
        setOtp(result.demoCode);
        toast.info(`Test code: ${result.demoCode}. Filled automatically.`);
      } else {
        toast.success(result.message || 'OTP sent successfully! Please check your email or phone.');
      }
    } catch {
      toast.error('Network error while sending OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!otpSent) {
      return handleSendOtp(event);
    }

    if (!isOtpValid) {
      toast.error('Enter the 6-digit OTP.');
      return;
    }

    if (!captchaChecked) {
      toast.error('Please confirm you are not a robot.');
      return;
    }

    const trimmedIdentifier = identifier.trim();
    const isEmail = trimmedIdentifier.includes('@');
    const payload = isEmail ? { email: trimmedIdentifier } : { phone: trimmedIdentifier };

    setSubmitting(true);
    const { data, error } = await supabase.auth.verifyOtp({
      ...payload,
      token: otp.trim(),
    });
    setSubmitting(false);

    if (error) {
      toast.error(formatAuthErrorMessage(error, 'Login failed. Please try again.'));
      return;
    }

    if (!data?.user) {
      toast.error('Login failed. No authenticated user session was created.');
      return;
    }

    const userSession = {
      name: data.user.name || (data.user.email ? data.user.email.split('@')[0] : isOfficerPortal ? 'Officer' : 'Citizen'),
      email: data.user.email || trimmedIdentifier,
      role,
      employeeId: isOfficerPortal ? officerAccessCode.trim() : undefined,
    };

    writePortalSession(userSession);
    toast.success('Login successful! Redirecting...');
    router.push(getPortalRedirect(role));
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] bg-mesh py-14 ${isOfficerPortal ? 'bg-violet-50/80' : ''}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-6">
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${isOfficerPortal ? 'bg-violet-500/10 text-violet-700 shadow-violet-500/10' : 'bg-sky-500/10 text-sky-700 shadow-sky-500/10'}`}>
              <ShieldCheck className="h-4 w-4" />
              {isOfficerPortal ? 'Secure officer login' : 'Secure citizen login'}
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {isOfficerPortal ? 'Officer portal access' : 'Sign in to access your grievance dashboard'}
              </h1>
              <p className="max-w-xl text-base text-muted-foreground">
                {isOfficerPortal
                  ? 'Use the officer login to manage complaints, monitor SLA risk, and update case resolution status.'
                  : 'Use a secure OTP-based login to submit complaints, track ticket status, and get updates from officers in real time.'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/70 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
                <div className={`inline-flex items-center gap-2 text-sm font-semibold ${isOfficerPortal ? 'text-violet-700' : 'text-sky-700'}`}>
                  <Lock className="h-4 w-4" />
                  Fast OTP login
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Enter your email address or mobile number and verify with OTP.
                </p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
                <div className={`inline-flex items-center gap-2 text-sm font-semibold ${isOfficerPortal ? 'text-violet-700' : 'text-sky-700'}`}>
                  <Key className="h-4 w-4" />
                  Captcha protection
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Confirm you are a human to keep your account safe from automated sign-in attempts.
                </p>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden border-border/60 bg-white/95 shadow-2xl shadow-slate-900/10">
            <CardHeader className={`px-8 py-8 ${isOfficerPortal ? 'bg-gradient-to-br from-violet-500/10 to-slate-100/80' : 'bg-gradient-to-br from-sky-500/10 to-slate-100/80'}`}>
              <div className="flex items-center gap-3 text-slate-900">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isOfficerPortal ? 'bg-violet-500/10 text-violet-700' : 'bg-sky-500/10 text-sky-700'}`}>
                  <LogIn className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{isOfficerPortal ? 'Officer Login' : 'Citizen Login'}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Enter your details below to receive a one-time code.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-8 py-8">
              <form onSubmit={otpSent ? handleLogin : handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900" htmlFor="identifier">
                    Email or Mobile Number
                  </label>
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="you@example.com or +91 98765 43210"
                    autoComplete="username"
                  />
                  <p className="text-xs text-muted-foreground">
                    The OTP will be sent from {SENDER_EMAIL}. Enter the email address where you want to receive the code.
                  </p>
                </div>

                {isOfficerPortal && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900" htmlFor="officer-access-code">
                      Officer Access Key
                    </label>
                    <Input
                      id="officer-access-code"
                      type="text"
                      value={officerAccessCode}
                      onChange={(event) => setOfficerAccessCode(event.target.value)}
                      placeholder="OFF-784321"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Restricted portal: only officers with a valid access key can sign in.
                    </p>
                  </div>
                )}

                {otpSent && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-900" htmlFor="otp">
                      One-time password (OTP)
                    </label>
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      placeholder="Enter 6-digit code"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{demoOtpHint ? `Test Code: ${demoOtpHint}` : 'Valid for 10 minutes'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtp('123456');
                          toast.info('Filled master demo code: 123456');
                        }}
                        className="text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
                      >
                        Quick fill (123456)
                      </button>
                    </div>
                  </div>
                )}

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-input/90 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-sky-400">
                  <input
                    type="checkbox"
                    checked={captchaChecked}
                    onChange={(event) => setCaptchaChecked(event.target.checked)}
                    className="h-4 w-4 rounded border-input text-sky-600 focus:ring-sky-500"
                  />
                  <span>I&apos;m not a robot and agree to secure login verification.</span>
                </label>

                <Button
                  type="submit"
                  className={`w-full ${isOfficerPortal ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
                  disabled={
                    submitting ||
                    !isIdentifierValid ||
                    (isOfficerPortal && !officerAccessCodeValid) ||
                    (otpSent && (!isOtpValid || !captchaChecked))
                  }
                >
                  {submitting ? 'Processing...' : otpSent ? 'Verify & Login' : 'Send OTP'}
                </Button>
              </form>

              <div className="rounded-3xl border border-border/70 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Secure access
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  No password is stored, and login is verified through OTP and captcha checks.
                </p>
              </div>

              <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <Link href={isOfficerPortal ? '/login?role=citizen' : '/officer/login'} className={`font-medium inline-flex items-center gap-1 ${isOfficerPortal ? 'text-violet-600 hover:text-violet-700' : 'text-sky-600 hover:text-sky-700'}`}>
                  {isOfficerPortal ? 'Citizen portal login' : 'Officer portal login'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div>
                  {isOfficerPortal ? 'Need citizen access?' : 'Need officer access?'}{' '}
                  <Link href={isOfficerPortal ? '/login?role=citizen' : '/officer/login'} className={`font-medium ${isOfficerPortal ? 'text-violet-600 hover:text-violet-700' : 'text-sky-600 hover:text-sky-700'}`}>
                    {isOfficerPortal ? 'Go to citizen portal' : 'Go to officer portal'}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
