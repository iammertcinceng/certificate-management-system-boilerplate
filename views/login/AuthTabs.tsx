"use client";
import { useState } from "react";
import LoginForm from "./LoginForm";
import { useLanguage } from "@/contexts/LanguageContext";

function RegisterForm() {
  const { t, get } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"institution" | "partner">("institution");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate later
    alert(`Register: ${name} - ${email} - role: ${role}`);
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      <div className="space-y-3">
        <input
          className="w-full px-3 py-3 rounded-lg bg-transparent border border-dark-600/50 placeholder-dark-400 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={get<string>('login.organizationName') || t("login.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          className="w-full px-3 py-3 rounded-lg bg-transparent border border-dark-600/50 placeholder-dark-400 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full px-3 py-3 rounded-lg bg-transparent border border-dark-600/50 placeholder-dark-400 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          className="w-full px-3 py-3 rounded-lg bg-transparent border border-dark-600/50 placeholder-dark-400 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={t("login.confirmPassword")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <div>
          <label className="block text-sm text-dark-300 mb-1">{t('login.role')}</label>
          <div className="flex gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" name="role" value="institution" checked={role === 'institution'} onChange={() => setRole('institution')} />
              <span>{t('login.roles.institution')}</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" name="role" value="partner" checked={role === 'partner'} onChange={() => setRole('partner')} />
              <span>{t('login.roles.partner')}</span>
            </label>
          </div>
        </div>
      </div>
      <button type="submit" className="btn-secondary w-full py-3 text-sm">{t("login.registerSubmit")}</button>
    </form>
  );
}

export default function AuthTabs() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"institution" | "partner" | "register">("institution");

  const TabButton = ({ id, label }: { id: "institution" | "partner" | "register"; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`${tab === id ? 'bg-primary-500/20 text-primary-200 border-primary-400' : 'bg-transparent text-dark-200 border-transparent hover:bg-white/5'} px-4 py-2 rounded-lg border`}
    >{label}</button>
  );

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="glass rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-center gap-3">
          <TabButton id="institution" label={t('login.tabs.institution')} />
          <TabButton id="partner" label={t('login.tabs.partner')} />
          <TabButton id="register" label={t('login.tabs.register')} />
        </div>
        <div className="mt-6">
          {tab === 'institution' && <LoginForm />}
          {tab === 'partner' && <LoginForm />}
          {tab === 'register' && <RegisterForm />}
        </div>
      </div>
    </div>
  );
}
