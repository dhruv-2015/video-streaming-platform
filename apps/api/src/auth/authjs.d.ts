import "@auth/express";
import { DefaultSession } from "@auth/express";

declare module "@auth/express" {
    interface Session {
        user: {
            id?: string;
            email?: string;
        } ;
    }
}

declare module "@auth/express/jwt" { 
    interface JWT {
        id?: string;
        email?: string;
    }
}