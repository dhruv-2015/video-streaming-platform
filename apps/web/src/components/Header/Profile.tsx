"use client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { User } from "lucide-react";
import React from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { trpc } from "@/trpc/client";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
const Profile = () => {
  const user = useSelector((state: RootState) => state.user)
  

  // if (error) {
  //   return (
  //     <Button onClick={() => signIn("google")} variant="ghost">
  //       <User />
  //     </Button>
  //   );
  // }


  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user?.image} />
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* {isLoadingUser ? () : (<>Hello, {user?.name}</>)} */}
        {!user.isLoggedin == false? (
          <>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={"/profile"}>Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              Logout
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signIn("google")}>
              Login
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Profile;
