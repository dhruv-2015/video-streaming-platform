import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Card } from "@workspace/ui/components/card";
import { User,PlaySquare } from "lucide-react";
import Link from "next/link";
import React from "react";
import {useRouter} from "next/navigation"
import { trpcClient } from "@/trpc/client";

const VideoCart = async ({
  video,
}: {
  video: {
    id: string | number;
    title: string;
    thumbnail: string;
    channel_thumbnail: string;
    channel_name: string;
    channel_slug: string;
    views: string;
    timestamp: string;
  };
}) => {
  // await trpc.user.getMe.query({})
    const {push} = useRouter()
  return (
    <Card key={video.id} className="overflow-hidden w-auto">
      <Link href={`/play/${video.id}`} className="overflow-hidden w-auto">
        <div className="aspect-video relative rounded-lg">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="object-cover w-full h-full"
          />
        </div>
      </Link>
      <div className="flex">
        <Avatar className="mt-4 ml-4 cursor-pointer" onClick={() => push(`/channel/${video.channel_slug}`)}>
          <AvatarImage src={video.channel_thumbnail} />
          <AvatarFallback>
            <PlaySquare />
          </AvatarFallback>
        </Avatar>
        <div className="p-4">
          <Link href={`/play/${video.id}`} className="overflow-hidden w-auto">
            <h3 className="font-semibold line-clamp-2">{video.title}</h3>
          </Link>
          <Link
            href={`/channel/${video.channel_slug}`}
            className="overflow-hidden w-auto"
          >
            <p className="text-sm text-muted-foreground mt-1">
              {video.channel_name}
            </p>
          </Link>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <span>{video.views} views</span>
            <span className="mx-1">•</span>
            <span>{video.timestamp}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VideoCart;
