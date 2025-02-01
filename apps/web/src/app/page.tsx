"use client";
// import { auth, signIn } from "@/auth"
import { Button } from "@workspace/ui/components/button";
// import { useSession, signIn, signOut } from "next-auth/react";
// import Login from "./login"
// import Logout from "./singout"
// import { auth } from "@/auth";
import { trpc } from "@/trpc/trpc";
export default function Page() {

    const {data,isLoading} = trpc.test.useQuery()
    return (
        <div className="flex items-center justify-center min-h-svh">
            {/* {signIn()} */}
            {isLoading ? <h1>Loading...</h1> : <h1>{data?.session ? `Hello ${data?.session?.user?.email}` : "Hello World"}</h1>}
            <div className="flex flex-col items-center justify-center gap-4">
                {/* <h1 className="text-2xl font-bold">{session?.user ? `${session?.user.email}` : "Hello World"}</h1> */}
                <Button size="sm">Button</Button>
                {/* {session?.user ? <Logout /> : <Login />} */}

            </div>
        </div>
    );
}
