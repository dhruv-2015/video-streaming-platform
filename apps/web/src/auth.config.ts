import { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google,
  ],
  pages: {
    signIn: "/login",
    signOut: "/api/auth/signout",
    error: "/api/auth/error",
  },
  callbacks: {
    redirect: ({ url, baseUrl }) => {
      // console.log(url, "url");
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return url;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    updateAge: 60 * 60 * 24 * 30,
  }
} satisfies NextAuthConfig;

