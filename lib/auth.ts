import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isAdminAllowed } from "./mongodb";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      return await isAdminAllowed(email);
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email.toLowerCase();
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = String(token.email);
      }
      return session;
    },
  },
  pages: {
    // Keep default pages. We trigger sign-in from /admin.
  },
};
