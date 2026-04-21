import NextAuth from "next-auth";

// Augment NextAuth Session/User to include our custom fields
declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: "institution" | "partner" | "acreditor" | "admin" | "guest";
    };
  }

  interface User {
    id?: string;
    email?: string | null;
    role?: "institution" | "partner" | "acreditor" | "admin" | "guest";
  }
}

export {};
