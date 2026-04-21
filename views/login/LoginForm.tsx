"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { executeRecaptcha, isRecaptchaEnabled, loadRecaptchaScript } from '@/lib/recaptcha';

export default function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login sayfasında reCAPTCHA badge'i göster (minimal)
  useEffect(() => {
    if (isRecaptchaEnabled()) {
      document.body.classList.add('recaptcha-show');
      loadRecaptchaScript(); // Script'i hemen yükle ki badge görünsün
      return () => { document.body.classList.remove('recaptcha-show'); };
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. reCAPTCHA v3 token al (yapılandırılmışsa)
      const recaptchaToken = await executeRecaptcha('login');

      // 2. Login isteği — next-auth/signIn rate limit'e takılırsa 429 döner
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        recaptchaToken, // backend'e gönderilir (next-auth authorize'da erişilebilir)
      });

      if (res?.error) {
        // next-auth'un credentials provider'ı hata döndürdüyse
        // Rate limit 429 kontrolü: next-auth "fetch failed" veya error mesajından
        if (res.status === 429) {
          setError(t('common.rateLimitError') || 'Çok fazla giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin.');
        } else {
          setError(t('common.loginError'));
        }
        setIsLoading(false);
        return;
      }

      // 3. Başarılı giriş — role göre yönlendir
      const session = await getSession();
      const role = (session?.user as any)?.role as string | undefined;
      if (role === "institution") router.push("/institution");
      else if (role === "acreditor") router.push("/acreditor");
      else router.push("/");
    } catch (err) {
      // Ağ hatası veya beklenmeyen hata
      setError(t('common.connectionError') || 'Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClass = "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0945A5]/30 focus:border-[#0945A5] transition-all";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f0f7ff] via-[#f7f9fc] to-[#eef5ff]">
      <main className="flex-1 py-12 lg:py-20 px-4">
        <div className="w-full max-w-md mx-auto">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-[#FFBF00] via-[#FF8C00] to-[#FF4500] p-8 text-center">              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
            </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{t("login.title")}</h1>
              {/* <p className="text-white/80 mt-2">{t("login.subtitle")}</p> */}
            </div>

            {/* Form */}
            <form
              onSubmit={onSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
                  if (tag === 'input') {
                    e.currentTarget.requestSubmit();
                  }
                }
              }}
              className="p-6 md:p-8 space-y-6"
            >
              {/* Error Banner */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#0945A5]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  {t("login.email")}
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={inputBaseClass}
                  placeholder="ornek@kurum.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#0945A5]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  {t("login.password")}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className={`${inputBaseClass} pr-12`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* <div className="text-right">
                  <a href="#" className="text-sm text-[#0945A5] hover:text-[#2AA8E2] font-medium transition-colors">
                    {t('login.forgotPassword')}
                  </a>
                </div> */}
                {/* daha sonra eklenecek. mail template de hazır  */}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF4B2B] via-[#FF8C00] to-[#FF4B2B] bg-[length:200%_100%] hover:bg-right transition-all duration-500 shadow-lg shadow-[#FF4B2B]/25 hover:shadow-xl hover:shadow-[#FF4B2B]/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-left"              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Giriş yapılıyor...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                      </svg>
                      {t("login.submit")}
                    </>
                  )}
                </span>
              </button>

              {/* Register Link */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-gray-600">
                  {t("login.noAccount") || "Hesabınız yok mu?"}{" "}
                  <Link href="/register" className="text-[#0945A5] hover:text-[#2AA8E2] font-semibold transition-colors">
                    {t("login.registerHere") || "Kayıt olun"}
                  </Link>
                </p>
              </div>

              {/* reCAPTCHA Privacy Notice (Google ToS gereği) */}
              {isRecaptchaEnabled() && (
                <p className="text-[10px] text-gray-400 text-center leading-tight">
                  This site is protected by reCAPTCHA and the Google{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>{' '}and{' '}
                  <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms of Service</a>{' '}apply.
                </p>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
