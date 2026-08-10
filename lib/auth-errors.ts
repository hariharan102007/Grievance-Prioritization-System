type AuthErrorLike = {
  message?: unknown;
  status?: number;
  code?: string;
  name?: string;
};

const SMTP_SETUP_HINT =
  'Email could not be sent. In Supabase Dashboard open Authentication → Emails → SMTP Settings, enable Custom SMTP, and save your provider credentials (Resend, Gmail, etc.).';

export function formatAuthErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;

  if (typeof error === 'string') {
    return error === '{}' ? SMTP_SETUP_HINT : error;
  }

  const authError = error as AuthErrorLike;
  const status = authError.status;
  const name = authError.name;
  const code = authError.code;

  if (
    status === 500 ||
    name === 'AuthRetryableFetchError' ||
    code === 'unexpected_failure'
  ) {
    return SMTP_SETUP_HINT;
  }

  if (status === 429) {
    return 'Too many OTP requests. Please wait a few minutes and try again.';
  }

  if (status === 422 || code === 'validation_failed') {
    return 'Enter a valid email address or mobile number.';
  }

  const message = authError.message;
  if (typeof message === 'string') {
    const trimmed = message.trim();
    if (trimmed && trimmed !== '{}') {
      if (trimmed.toLowerCase().includes('confirmation email')) {
        return SMTP_SETUP_HINT;
      }
      return trimmed;
    }
  }

  if (error instanceof Error && error.message.trim() && error.message.trim() !== '{}') {
    return error.message;
  }

  return fallback;
}
