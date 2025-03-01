"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fixNumber } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const SubscribeButton = ({ channel_slug }: { channel_slug: string }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    data: channel,
    isLoading,
    isError,
    refetch,
  } = trpc.channel.getChannel.useQuery({
    channel_slug: channel_slug,
  });
  const subscribeChannel = trpc.channel.subscribeChannel.useMutation({
    onSuccess: () => {
      // Refetch channel data to update subscriber count and subscription status
      refetch();
    },
    onError: error => {
      alert(error.data?.message || error.message);
    },
  });
  if (isLoading || isError) {
    return <></>;
  }
  const handleSubscribe = () => {
    if (!session) {
      // Redirect to login if not logged in
      router.push(
        "/auth/login?callbackUrl=" + encodeURIComponent(window.location.href),
      );
      return;
    }

    subscribeChannel.mutate({
      channel_id: channel?.id,
      doSubscribe: !channel?.is_subscribed,
    });
  };
  return (
    <div className="flex items-center gap-4 ">
      {/* {channelName} */}
      <Avatar className="border-2 border-primary">
        <AvatarImage src={channel.image} alt={channel.name} asChild>
          <Image src={channel.image} alt={channel.name} fill />
        </AvatarImage>
        <AvatarFallback>{channel.name[0]}</AvatarFallback>
      </Avatar>
      <div>
        <Link
          href={`/channel/${channel.slug}`}
          className="font-bold hover:text-primary"
        >
          {channel.name}
        </Link>
        <p className="text-sm text-muted-foreground">
          {fixNumber(channel.subscriber_count)} subscribers
        </p>
      </div>
      <Button
        onClick={handleSubscribe}
        variant={channel.is_subscribed ? "outline" : "default"}
        className={`${channel.is_subscribed ? "hover:bg-red-100 hover:text-red-600" : ""} min-w-[120px]`}
        disabled={subscribeChannel.isLoading}
      >
        {subscribeChannel.isLoading ? (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
        ) : channel.is_subscribed ? (
          <>
            <Bell className="h-4 w-4 mr-2" />
            Subscribed
          </>
        ) : (
          "Subscribe"
        )}
      </Button>
    </div>
  );
};

export default SubscribeButton;
