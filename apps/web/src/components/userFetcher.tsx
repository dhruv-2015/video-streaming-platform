"use client"
import { setUser } from "@/redux/features/user/userSlice";
import { useAppDispatch } from "@/redux/store";
// import { trpcServerClient } from '@/trpc/server';
import { RouterOutputs } from "@workspace/trpc";
import React from "react";

const UserFetcher = ({ user }: { user: RouterOutputs["user"]["getMe"] }) => {
  const dispatch = useAppDispatch();
  //   const user = trpcServerClient.user.getMe.query(undefined);
  dispatch(
    setUser({
      isLoggedin: true,
      channel_id: user.channel_id,
      email: user.email,
      id: user.id,
      image: user.image,
      name: user.name,
      role: user.role,
    }),
  );
//   React.useEffect(() => {
//     if (user) {
//     }
//   }, [user]);
  return <></>;
};

export default UserFetcher;
