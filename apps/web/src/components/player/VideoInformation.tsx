import React from "react";
import { ThumbsUp, ThumbsDown, Share2, Download, Link, Save, BookmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VideoInfoProps {
  title: string;
  channelName: string;
  channelAvatar: string;
  subscribers: string;
  likes: string;
}

export function VideoInfo({
  title,
  channelName,
  channelAvatar,
  subscribers,
  likes,
}: VideoInfoProps) {
  return (
    <div className="mb-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <h1 className="text-lg font-bold mb-2 line-clamp-2">
            {title}
          </h1>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-[33rem]">{title}</p>
        </TooltipContent>
      </Tooltip>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
            {channelName}
          <Avatar>
            <AvatarImage src={channelAvatar} alt={channelName} />
            <AvatarFallback>{channelName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <Link
              href={`/channel/${channelName}`}
              className="font-bold hover:text-primary"
            >
              {channelName}{channelName}{channelName}{channelName}{channelName}{channelName}
            </Link>
            <p className="text-sm text-muted-foreground">
              {subscribers} subscribers
            </p>
          </div>
          <Button>Subscribe</Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <ThumbsUp className="mr-2 h-4 w-4" /> {likes}
          </Button>
          <Button variant="secondary" size="sm">
            <ThumbsDown className="mr-2 h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="secondary" size="sm">
            <BookmarkIcon className="mr-2 h-4 w-4" /> save
          </Button>
        </div>
      </div>
    </div>
  );
}
