import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import NextAuth from "next-auth";
import { cache } from "react";


declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
    } & DefaultSession["user"];
  }

}

export const authConfig = {
  providers: [
    Google,
  ],
  callbacks: {
    redirect: ({ url, baseUrl }) => {
      console.log(url, "url");
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



const { auth: uncachedAuth, signOut, handlers, signIn } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, signOut };