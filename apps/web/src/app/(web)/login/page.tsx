"use client"
import React from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
// import {} from "next/navigation"
// import {signIn} from "@/auth"

const Page = async () => {
  signIn("google", {
    redirectTo: "/",
  });
  return <></>
  // return (
  //   <div className="flex justify-center items-center">
  //     <Button
  //       onClick={() =>
  //         signIn("google", {
  //           redirectTo: "/",
  //         })
  //       }
  //       variant="ghost"
  //     >
  //       <User /> Login
  //     </Button>
  //   </div>
  // );
};

export default Page;
