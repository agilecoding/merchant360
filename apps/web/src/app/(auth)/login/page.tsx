import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign In' };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'Authentication failed. Please try again.',
  auth_failed:   'Sign-in failed. Please try again.',
  access_denied: 'Access denied.',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string; detail?: string };
}) {
  const callbackUrl = searchParams.callbackUrl ?? '/dashboard';
  const errorMsg    = searchParams.error ? (ERROR_MESSAGES[searchParams.error] ?? 'An error occurred.') : null;
  const errorDetail = searchParams.detail ?? null;
  const loginHref   = `/api/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Merchant360</h1>
          <p className="mt-1 text-sm text-gray-500">Payments Operations Portal</p>
        </div>

        {errorMsg && (
          <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 text-left space-y-3">
            <p className="font-medium">{errorMsg}</p>
            {errorDetail && <p className="text-xs opacity-80 font-mono break-all">{errorDetail}</p>}
            <div className="rounded-md bg-white px-3 py-2 text-xs text-slate-700 border border-slate-200">
              <p className="font-semibold">Requested redirect target</p>
              <p className="break-all">{callbackUrl}</p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <p className="text-sm text-gray-600">
            Sign in with your organisation account via Keycloak SSO.
          </p>
          {/* Must be a plain <a> — Next.js <Link> does client-side fetch which
              doesn't follow external redirects to Keycloak. */}
          <a
            href={loginHref}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Continue with SSO
          </a>
        </div>

        <p className="text-xs text-gray-400">
          Access is restricted to authorised personnel only.
        </p>
      </div>
    </div>
  );
}
