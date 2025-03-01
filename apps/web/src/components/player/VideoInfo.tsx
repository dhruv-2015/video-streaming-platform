import React, { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { fixNumber } from "@/lib/utils";
import LikeDisslike from "./LikeDisslike";
import Image from "next/image";
import SubscribeButton from "./SubscribeButton";

interface VideoInfoProps {
  title: string;
  videoId: string;
  channelName: string;
  channelslug: string;
  channelAvatar: string;
  subscribers: number;
  likes: number;
}

export function VideoInfo({
  title,
  videoId,
  channelName,
  channelslug,
  channelAvatar,
  subscribers,
  likes,
}: VideoInfoProps) {
  return (
    <div className="mb-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <h1 className="text-lg font-bold mb-2 line-clamp-2">{title}</h1>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-[33rem]">{title}</p>
        </TooltipContent>
      </Tooltip>

      <div className="flex items-center justify-between flex-wrap gap-4 ">
        <SubscribeButton channel_slug={channelslug} />

        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <LikeDisslike likes_count={likes} video_id={videoId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
