import NextAuth, { DefaultSession } from "next-auth";
import { authConfig } from "./auth.config";
import { cache } from "react";



declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
    } & DefaultSession["user"];
  }

}




const { auth: uncachedAuth, signOut, signIn } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, signOut, uncachedAuth, signIn };