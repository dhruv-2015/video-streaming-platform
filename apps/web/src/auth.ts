import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import NextAuth, { Session, DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";


import "next-auth";
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id?: string;
            email?: string;
        }
    }
}

export const { auth, signOut } = NextAuth({
    providers: [Google],
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
    },
}) as {
    auth: ((
        ...args: [NextApiRequest, NextApiResponse]
      ) => Promise<Session | null>) &
        ((...args: []) => Promise<Session | null>) &
        ((...args: [GetServerSidePropsContext]) => Promise<Session | null>);
    signOut: () => void;
}