import { CreateChannelForm } from "./CreateChannel";
import Channel from "./Channel";

import { isTRPCClientError, trpcServerClient } from "@/trpc/server";
import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import Loader from "@/components/Loader";
const LoadChannel = async () => {
  try {
    const user = await trpcServerClient.user.getMe.query();
    return user?.channel_id ? <Channel /> : <CreateChannelForm />;
  } catch (error) {
    if (isTRPCClientError(error)) {
      if (error.data?.code == "UNAUTHORIZED") {
        redirect("/login");
        return <></>;
      }
      if (error.data?.code == "NOT_FOUND") {
        redirect("/logout");
        return <></>;
      }

      return <>internal server error</>;
      // return <CreateChannelForm />;
    } else {
      redirect("/");
    }
  }
};

export default LoadChannel;
