"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { executeRecaptcha, isRecaptchaEnabled, loadRecaptchaScript } from '@/lib/recaptcha';

// A tiny component just to read query parameters, safely wrapped in Suspense
function ErrorParamReader({ onUnauthorized }: { onUnauthorized: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      onUnauthorized();
    }
  }, [searchParams, onUnauthorized]);
  return null;
}

export default function AdminLoginPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginInProgress = useRef(false);
  const hasSignedOut = useRef(false);

  // Clear any existing session to avoid cross-role confusion
  // Runs only once on mount — tracked via ref to prevent loops
  useEffect(() => {
    if (session && !hasSignedOut.current && !loginInProgress.current) {
      hasSignedOut.current = true;
      signOut({ redirect: false, callbackUrl: `${window.location.origin}/admin/login` });
    }
  }, [session]);

  // Load reCAPTCHA script on mount if enabled
  useEffect(() => {
    if (isRecaptchaEnabled()) {
      loadRecaptchaScript();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    loginInProgress.current = true;

    // Get reCAPTCHA token (returns '' if not configured)
    const recaptchaToken = await executeRecaptcha('login');

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        recaptchaToken,
        callbackUrl: `${window.location.origin}/admin`, // Use absolute URL to prevent "Invalid URL" bug in next-auth
      });

      if (!res || res?.error) {
        loginInProgress.current = false;
        setLoading(false);
        setError("E-posta veya şifre hatalı.");
        return;
      }

      // Login succeeded — hard navigate to admin dashboard
      // Middleware enforces admin role (middleware.ts:131-135)
      window.location.href = "/admin";
    } catch (err) {
      console.error("Login catch block:", err);
      // next-auth's Invalid URL bug throws here if we don't catch it
      loginInProgress.current = false;
      setLoading(false);
      setError("Bağlantı hatası veya geçersiz yönlendirme.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      
      {/* Search Params logic isolated in Suspense to prevent Full-Page Hydration Mismatch */}
      <Suspense fallback={null}>
        <ErrorParamReader onUnauthorized={() => setError("Yetkisiz Erişim: Bu alana girmek için yönetici (admin) rolüne sahip olmalısınız.")} />
      </Suspense>

      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-1">Admin Girişi</h1>
        <p className="text-sm text-gray-600 mb-6">Yönetim paneline erişmek için giriş yapın.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="text-xs text-gray-500 mt-4">
          Not: Bu giriş yalnızca <span className="font-medium">admin</span> rolüne sahip kullanıcılar içindir.
        </div>
      </div>
    </div>
  );
}
