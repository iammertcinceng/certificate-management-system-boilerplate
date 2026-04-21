"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from "next-auth/react";

export type AppRole = "institution" | "acreditor" | "admin" | "guest";

export interface AppUser {
  id?: string;
  email: string;
  organizationName?: string;
  role: AppRole;
  displayName?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  signInWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const user: AppUser | null = session?.user
    ? {
      id: (session.user as any).id,
      email: session.user.email || "",
      organizationName: (session.user as any).organization?.name,
      role: ((session.user as any).role as AppRole) || "guest",
      displayName: (session.user as any).organization?.name || session.user.name || session.user.email || undefined,
    }
    : null;

  const signInWithEmail: AuthContextValue["signInWithEmail"] = async (email, password) => {
    const res = await nextAuthSignIn("credentials", { redirect: false, email, password });
    if (res?.error) {
      // Never expose raw next-auth error strings (e.g. "CredentialsSignin") to the user
      const friendlyMessage = "E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.";
      return { ok: false, error: friendlyMessage };
    }
    return { ok: true };
  };

  const signOut = async () => {
    try {
      // Reverting to standard next-auth signOut with ABSOLUTE URL
      // Providing absolute URLs prevents the internal 'Invalid URL' bug
      await nextAuthSignOut({ callbackUrl: `${window.location.origin}/` });
    } catch (error) {
      console.error('[AuthContext] signOut error:', error);
      // Native fallback incase of extreme failure
      window.location.href = "/";
    }
  };

  const value = useMemo<AuthContextValue>(() => ({ user, signInWithEmail, signOut }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

