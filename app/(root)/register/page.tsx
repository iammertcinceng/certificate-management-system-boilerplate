"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [organizationName, setOrganizationName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [address, setAddress] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"institution" | "acreditor">("institution");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Input validation helpers
  const handleTaxNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    setTaxNumber(cleaned);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert(t("login.validation.passwordsDoNotMatch"));
      return;
    }
    if (password.length < 6) {
      alert(t("login.validation.passwordTooShort"));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          name: organizationName,
          taxNumber,
          taxOffice,
          address,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || t("login.messages.registrationFailed"));
        return;
      }
      alert(t("login.messages.registrationSuccess"));
      router.push("/login");
    } catch (err) {
      console.error("Registration error", err);
      alert(t("login.messages.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClass = "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0945A5]/30 focus:border-[#0945A5] transition-all";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#fffaf0] via-[#fff5e6] to-[#ffedda]">      <main className="flex-1 py-12 lg:py-20 px-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#F59E0B] via-[#EA580C] to-[#DC2626] p-8 text-center text-white">              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{t("login.registerTitle")}</h1>
            <p className="text-white/80 mt-2">{t("login.registerSubtitle")}</p>
          </div>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
                if (tag === 'input') {
                  e.preventDefault();
                  e.currentTarget.requestSubmit();
                }
              }
            }}
            className="p-6 md:p-8 space-y-6"
          >
            {/* Account Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">{t("login.role")}</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('institution')}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${role === 'institution'
                    ? 'border-[#0945A5] bg-[#0945A5]/5 shadow-lg shadow-[#0945A5]/10'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                >
                  <div className={`p-3 rounded-xl ${role === 'institution' ? 'bg-[#0945A5]/10' : 'bg-gray-200'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-7 h-7 ${role === 'institution' ? 'text-[#0945A5]' : 'text-gray-500'}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                    </svg>
                  </div>
                  <span className={`text-sm font-semibold ${role === 'institution' ? 'text-[#0945A5]' : 'text-gray-600'}`}>
                    {t('login.roles.institution')}
                  </span>
                  {role === 'institution' && (
                    <div className="absolute top-3 right-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#0945A5]">
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('acreditor')}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${role === 'acreditor'
                    ? 'border-[#7A56B9] bg-[#7A56B9]/5 shadow-lg shadow-[#7A56B9]/10'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                >
                  <div className={`p-3 rounded-xl ${role === 'acreditor' ? 'bg-[#7A56B9]/10' : 'bg-gray-200'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-7 h-7 ${role === 'acreditor' ? 'text-[#7A56B9]' : 'text-gray-500'}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  </div>
                  <span className={`text-sm font-semibold ${role === 'acreditor' ? 'text-[#7A56B9]' : 'text-gray-600'}`}>
                    {t('login.roles.acreditor')}
                  </span>
                  {role === 'acreditor' && (
                    <div className="absolute top-3 right-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#7A56B9]">
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Divider - Organization Info */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("login.organizationInfo")}</span>
              </div>
            </div>

            {/* Organization Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#0945A5]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                </svg>
                {t("login.organizationName")}
              </label>
              <input
                className={inputBaseClass}
                placeholder={t("login.organizationName")}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
              />
            </div>

            {/* Tax Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#0945A5]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                  </svg>
                  {t("login.taxNumber")}
                </label>
                <input
                  className={`${inputBaseClass} font-mono tracking-wider`}
                  placeholder="12345678901"
                  value={taxNumber}
                  onChange={(e) => handleTaxNumberChange(e.target.value)}
                  maxLength={11}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                />
                <span className="text-xs text-gray-400">{taxNumber.length}/11</span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#0945A5]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                  {t("login.taxOffice")}
                </label>
                <input
                  className={inputBaseClass}
                  placeholder={t("login.taxOffice")}
                  value={taxOffice}
                  onChange={(e) => setTaxOffice(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#0945A5]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {t("login.address")}
              </label>
              <textarea
                className={`${inputBaseClass} resize-none`}
                placeholder={t("login.address")}
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            {/* Divider - Account Info */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("login.accountInfo")}</span>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#0945A5]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                {t("login.email")}
              </label>
              <input
                type="email"
                className={inputBaseClass}
                placeholder="ornek@kurum.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className="text-xs text-gray-400">{t("login.emailHint")}</span>
            </div>

            {/* Password Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#0945A5]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  {t("login.password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputBaseClass} pr-12`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
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
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#0945A5]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {t("login.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className={`${inputBaseClass} pr-12 ${confirm && confirm !== password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/30'
                      : confirm && confirm === password
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500/30'
                        : ''
                      }`}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirm ? (
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
                {confirm && confirm !== password && (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    {t("login.validation.passwordsDoNotMatch")}
                  </span>
                )}
                {confirm && confirm === password && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Şifreler eşleşiyor
                  </span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (confirm.length > 0 && confirm !== password)}
              className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-[#F43F5E] via-[#FB923C] to-[#F43F5E] bg-[length:200%_100%] hover:bg-right transition-all duration-500 shadow-lg shadow-[#FB923C]/30 hover:shadow-xl hover:shadow-[#F43F5E]/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-left"              >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t("login.registering")}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                    </svg>
                    {t("login.registerSubmit")}
                  </>
                )}
              </span>
            </button>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-gray-600">
                {t("login.alreadyHaveAccount")}{" "}
                <Link href="/login" className="text-[#0945A5] hover:text-[#2AA8E2] font-semibold transition-colors">
                  {t("login.loginHere")}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
    </div>
  );
}
