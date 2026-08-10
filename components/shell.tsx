'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShieldCheck, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type UserSession = {
  name: string;
  email: string;
};

const STORAGE_KEY = 'grievance_user_session';

export function Shell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  const isIdentifierValid = identifier.trim().length >= 6;
  const isOtpValid = otp.trim().length === 6;

  const computedName = identifier.includes('@')
    ? identifier.split('@')[0]
    : identifier.trim().replace(/[^a-zA-Z]/g, '') || 'Citizen';

  const resetLogin = () => {
    setOtp('');
    setOtpSent(false);
    setCaptchaChecked(false);
  };

  const formatErrorMessage = (error: unknown, fallback: string) => {
    if (!error) return fallback;
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message || fallback;
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message?: unknown }).message || fallback);
    }
    return fallback;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedIdentifier = identifier.trim();
    const isEmail = trimmedIdentifier.includes('@');
    const otpPayload = isEmail
      ? { email: trimmedIdentifier }
      : { phone: trimmedIdentifier };

    if (!otpSent) {
      if (!isIdentifierValid) {
        toast.error('Please enter your email or mobile number.');
        return;
      }

      setSubmitting(true);
      const { data, error } = await supabase.auth.signInWithOtp({
        ...otpPayload,
      });

      setSubmitting(false);

      if (error) {
        toast.error(formatErrorMessage(error, 'Unable to send OTP. Please try again.'));
        return;
      }

      setOtpSent(true);
      toast.success(
        data?.message || 'OTP sent successfully! Please check your email or phone.'
      );
      return;
    }

    if (!isOtpValid) {
      toast.error('Enter a valid 6-digit OTP.');
      return;
    }

    if (!captchaChecked) {
      toast.error('Confirm that you are not a robot.');
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.verifyOtp({
      ...otpPayload,
      token: otp.trim(),
    });
    setSubmitting(false);

    if (error) {
      toast.error(formatErrorMessage(error, 'OTP verification failed. Please try again.'));
      return;
    }

    if (!data?.user) {
      toast.error('OTP verified, but no user session was created.');
      return;
    }

    setUser({
      name: data.user.email
        ? data.user.email.split('@')[0]
        : computedName,
      email: data.user.email ?? trimmedIdentifier,
    });
    toast.success('Welcome back! You are now signed in.');
    resetLogin();
  };

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setIdentifier('');
    setOtp('');
    setCaptchaChecked(false);
    resetLogin();
    setShowProfileMenu(false);
    toast.success('You have been signed out.');
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      <Toaster />

      {!user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] border border-slate-700/70 bg-slate-950/95 p-8 shadow-2xl shadow-black/30">
            <div className="mb-8 grid gap-6 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200">
                  <ShieldCheck className="h-4 w-4" />
                  Secure portal entry
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Sign in to continue
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Please authenticate before entering the grievance portal. Use your email or phone number and verify with OTP.
                  </p>
                </div>
              </div>
              <div className="rounded-[1.75rem] bg-slate-900/90 p-5 ring-1 ring-white/10">
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <LogIn className="h-5 w-5 text-sky-400" />
                  <span>One-time login with captcha protection</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-400">
                  Your session is saved locally so you can continue directly on the portal after signing in.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-100" htmlFor="entry-identifier">
                  Email or mobile number
                </label>
                <input
                  id="entry-identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 transition focus:border-sky-400 focus:ring-sky-500/30"
                  placeholder="you@example.com or +91 98765 43210"
                />
              </div>

              {otpSent && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-100" htmlFor="entry-otp">
                    One-time password (OTP)
                  </label>
                  <input
                    id="entry-otp"
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    className="w-full rounded-2xl border border-slate-700/70 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 transition focus:border-sky-400 focus:ring-sky-500/30"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-500/50">
                <input
                  type="checkbox"
                  checked={captchaChecked}
                  onChange={(event) => setCaptchaChecked(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500"
                />
                <span>I&apos;m not a robot and agree to secure access.</span>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={submitting || (!isIdentifierValid) || (otpSent && !captchaChecked)}
                >
                  {submitting ? 'Processing...' : otpSent ? 'Verify & Enter' : 'Send OTP'}
                </Button>
                <p className="text-xs text-slate-400 sm:text-right">
                  Tip: use an email or phone number to access the portal instantly.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {user && (
        <div className="fixed right-4 top-24 z-50 flex flex-col items-end">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/95 text-sm font-semibold text-slate-100 shadow-lg shadow-black/20 transition hover:bg-slate-900"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-label="Open profile menu"
          >
            {user.name.slice(0, 2).toUpperCase()}
          </button>

          {showProfileMenu && (
            <div className="mt-2 w-52 rounded-2xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-xl shadow-black/20">
              <div className="text-sm font-semibold text-white">{user.name}</div>
              <div className="truncate text-xs text-slate-400">{user.email}</div>
              <Button variant="secondary" className="mt-3 w-full" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
