import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db/client";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { verifyRecaptcha, RECAPTCHA_THRESHOLDS } from "@/lib/recaptcha-server";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        recaptchaToken: { label: "reCAPTCHA", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // reCAPTCHA v3 doğrulaması (yapılandırılmışsa)
        const recaptchaToken = credentials.recaptchaToken || '';
        const { success, score } = await verifyRecaptcha(recaptchaToken, 'login');
        if (!success || score < RECAPTCHA_THRESHOLDS.LOGIN) {
          console.warn(`[Auth] reCAPTCHA failed — score: ${score}, success: ${success}`);
          return null;
        }

        const email = String(credentials.email).toLowerCase();
        const pwd = String(credentials.password);
        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const u = rows[0];
        if (!u) return null;
        const ok = await compare(pwd, u.passwordHash);
        if (!ok) return null;

        // Don't store organization in token - fetch via API instead
        return { id: u.id, email: email, role: u.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;

        // Fetch organization/partner name for institution and acreditor
        if (token.role === 'institution' || token.role === 'acreditor') {
          const org = await db.select({ name: organizations.name })
            .from(organizations)
            .where(eq(organizations.userId, token.id))
            .limit(1);
          if (org.length > 0) {
            session.user.organizationName = org[0].name;
            session.user.organization = { name: org[0].name };
          }
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }: any) {
      // Safety checks to prevent "Invalid URL" errors
      try {
        // Ensure we have valid strings
        const safeUrl = url && typeof url === 'string' ? url : '/';
        const safeBaseUrl = baseUrl && typeof baseUrl === 'string' ? baseUrl : process.env.NEXTAUTH_URL || 'http://localhost:3000';

        // After credentials sign-in, route based on role stored in token is not available here directly,
        // so we will default to base and let protected pages/middleware handle.
        if (safeUrl.startsWith('/')) {
          // Relative URL - allowed
          return safeUrl;
        }

        if (safeUrl.startsWith(safeBaseUrl)) {
          // Same origin - allowed
          return safeUrl;
        }

        // Default to base URL for safety
        return safeBaseUrl;
      } catch (error) {
        console.error('[next-auth] redirect callback error:', error);
        // Fallback to home page on any error
        return '/';
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",   // Redirect auth errors to login page — never show raw next-auth error screens
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
