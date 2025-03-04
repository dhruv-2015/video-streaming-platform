import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Card } from "@workspace/ui/components/card";
import {
  User,
  PlaySquare,
  MoreVertical,
  ListPlus,
  Clock,
  Share2,
} from "lucide-react";
import Link from "next/link";
import React from "react";
// import { useRouter } from "next/navigation";
// import { trpc, trpcClient } from "@/trpc/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RouterOutputs } from "@workspace/trpc";
import { PlaylistSelector } from "../PlaylistSelector/page";

export const VideoCart = async ({
  video,
}: {
  video: RouterOutputs["video"]["getVideos"]["videos"][0];
}) => {
  // await trpc.user.getMe.query({})
  // const {data, isLoading, isError, error} = trpc.video.getVideo.useQuery({ video_id: video.id });
  // const { push } = useRouter();
  return (
    <Card key={video.id} className="w-full rounded-md">
      <Link href={`/play/${video.id}`} className="block w-full">
        <div className="aspect-video relative rounded-lg">
          {/* <Image
            src={video.thumbnail}
            alt={video.title}
            className="object-cover w-full h-full"
          /> */}
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover"
          />
        </div>
      </Link>
      <div className="flex w-full">
        <Avatar
          className="mt-4 ml-4 cursor-pointer flex-shrink-0"
          // onClick={() => push(`/channel/${video.channel_slug}`)}
          asChild
        >
          <Link href={`/channel/${video.channel.slug}`}>
            <AvatarImage src={video.channel.image} />
            <AvatarFallback>
              <PlaySquare />
            </AvatarFallback>
          </Link>
        </Avatar>
        <div className="p-4 flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0 whitespace-nowrap overflow-hidden">
              <Link href={`/play/${video.id}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* <h1 className="text-lg font-bold mb-2 line-clamp-2">{title}</h1> */}
                    <h3 className="font-semibold line-clamp-2">
                      {video.title}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[33rem]">{video.title}</p>
                  </TooltipContent>
                </Tooltip>
              </Link>
              <Link href={`/channel/${video.channel.slug}`}>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {video.channel.name}
                </p>
              </Link>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <span>{video.view_count}</span>
                <span className="mx-1">•</span>
                <span>
                  {video.created_at.toLocaleDateString()} :{" "}
                  {video.created_at.toLocaleTimeString()}
                </span>
              </div>
            </div>
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <PlaylistSelector
                  video_id={video.id}
                  trigger={
                    <DropdownMenuItem>
                      <ListPlus className="mr-2 h-4 w-4" />
                      Add to Playlist
                    </DropdownMenuItem>
                  }
                ></PlaylistSelector>

                <DropdownMenuItem>
                  <Clock className="mr-2 h-4 w-4" />
                  Save to Watch Later
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VideoCart;
