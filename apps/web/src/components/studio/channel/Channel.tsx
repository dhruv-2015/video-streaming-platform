"use client"
import UploadVideoCard from "./UploadVideoCard";
import RecentComments from "./RecentComments";
import RecentSubscribers from "./RecentSubscribers";
import ChannelInfo from "./ChannelInfo";
import { trpc } from "@/trpc/client";
import Loader from "@/components/Loader";
// import { trpcServerClient } from "@/trpc/server";

export default async function StudioDashboard() {
    const { data: channel, isLoading, isError, error } = await trpc.studio.channel.getMychannel.useQuery();
    console.log(error, "error");
    
    if (isError) {
      return <div>Error... message: {error.message}</div>;
    }
  if (isLoading) {
    return <Loader />;
  }
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Channel Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Channel Overview */}
        <ChannelInfo channel={channel} />

        {/* Upload Section */}
        <UploadVideoCard />

        {/* Recent Comments */}
        {/* <RecentComments /> */}

        {/* Recent Subscribers */}
        {/* <RecentSubscribers /> */}
      </div>


    </div>
  );
}
