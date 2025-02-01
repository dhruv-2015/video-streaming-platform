import { ExpressAuth, type ExpressAuthConfig, getSession } from "@auth/express";
import { Request, Response, NextFunction } from "express";
import google from "@auth/express/providers/google";
import { prisma } from "@workspace/database";

import "@auth/express";

declare module "@auth/express" {
    interface Session {
        user: {
            id?: string;
            email?: string;
        };
    }
}

declare module "@auth/express" {
    interface JWT {
        id?: string;
        email?: string;
    }
}
export type { Session } from "@auth/express";

const expressAuthConfig: ExpressAuthConfig = {
    providers: [google],
    redirectProxyUrl: "http://localhost:3000/api/auth",
    trustHost: true,
    callbacks: {
        redirect: ({ url, baseUrl }) => {
            console.log(url, "url");
            if (url.startsWith("/")) return `${baseUrl}${url}`;

            return url;
        },
        async jwt({ token, trigger, user }) {
            if (trigger === "signIn") {
                const dbUser = await prisma.user.findUnique({
                    where: {
                        email: token.email!,
                    },
                });

                if (!dbUser) {
                    // User is not available in db during sign-in so create user
                    const dbUser = await prisma.user.create({
                        data: {
                            email: token.email!,
                            name: token.name!,
                            image: token.picture,
                        },
                    });
                    token.id = dbUser.id;
                } else {
                    token.id = dbUser.id;
                }
                // console.log("\n\n\n");

                // console.log(token, user, session, "jwt");
                // console.log("\n\n\n");
                return token;
            }
            return token;
        },
        session: async ({ session, token }) => {
            // console.log("\n\n\n");
            // console.log(session, token, "session");
            // console.log("\n\n\n");
            session.user.id = token.id as string;

            session.user.email = token.email as string;
            delete session.user.image;
            // session.user.

            return session;
        },
    },
    session: {
        strategy: "jwt",
        updateAge: 60 * 60 * 24 * 30,
    },
};

// process.exit(1)
export const expressAuth = ExpressAuth(expressAuthConfig);

export async function authSession(
    req: Request,
    res: Response,
    next?: NextFunction,
) {
    const session = await getSession(req, expressAuthConfig);
    res.locals.session = session;
    // res.locals.session?.user.id
    next && next();
    return session;
}

//   export const validateToken = async (
//     token: string,
//   ): Promise<Session | null> => {
//     const sessionToken = token.slice("Bearer ".length);
//     const session = await adapter.getSessionAndUser?.(sessionToken);
//     return session
//       ? {
//           user: {
//             ...session.user,
//           },
//           expires: session.session.expires.toISOString(),
//         }
//       : null;
//   };
