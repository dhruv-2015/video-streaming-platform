// import { auth, signIn } from "@/auth"
import { Button } from "@workspace/ui/components/button";
// import { useSession, signIn, signOut } from "next-auth/react";
import Login from "./login"
import Logout from "./singout"
import { auth } from "@/auth";
export default async function Page() {
    const session = await auth();
    // if (status === "loading") {
    //     return <div>Loading...</div>;
    // }
    // console.log(session?.user.);
    

    return (
        <div className="flex items-center justify-center min-h-svh">
            {/* {signIn()} */}
            <div className="flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">{session?.user ? `${session?.user.email}` : "Hello World"}</h1>
                <Button size="sm">Button</Button>
                {session?.user ? <Logout /> : <Login />}

            </div>
        </div>
    );
}
