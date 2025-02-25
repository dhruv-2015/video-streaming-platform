"use client";
import React from "react";
import { Eye, Clock } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { convertSecondsToHMS } from "@/lib/utils";

// interface VideoRecommendation {
//   id: number;
//   thumbnail: string;
//   title: string;
//   channelName: string;
//   views: string;
//   uploadTime: string;
// }


interface VideoRecommendationsProps {
  video_id: string;
}

export function VideoRecommendations({
  video_id,
}: VideoRecommendationsProps) {
  const {data, isLoading, isError, refetch} = trpc.video.getVideoRecommendations.useQuery({
    video_id
  })
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Recommended</h3>
      <ScrollArea>
      <InfiniteScroll
            hasMore={!isLoading}
            isLoading={isLoading}
            next={() => {}}
            threshold={10}
          >
        {data && data.map((video) => (
          <Link
            key={video.id}
            href={`/play/${video.id}`}
            className="flex gap-2 hover:bg-muted/50 p-2 rounded-lg transition-colors"
          >
            <div className="relative w-40 h-24">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="w-full h-full object-cover rounded"
              />
              <div className="absolute bottom-2 right-2 bg-background/80 text-xs px-2 py-1 rounded">
              {/* <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded"> */}
                {video.id === video_id  ? "Playing" : convertSecondsToHMS(video.duration)}
              </div>
            </div>
            <div className="flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h4 className="font-medium line-clamp-2">
                    {video.title.length > 250
                      ? video.title.substring(0, 250) + "..."
                      : video.title}
                  </h4>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[33rem]">{video.title}</p>
                </TooltipContent>
              </Tooltip>
              <Link
                href={`/channel/${video.channel.slug}`}
                className="text-sm text-muted-foreground hover:text-primary block mt-1"
              >
                {video.channel.name}
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {video.view_count}
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {video.created_at.toLocaleDateString()}
                </div>
              </div>
            </div>
          </Link>
        ))}

          </InfiniteScroll>

      </ScrollArea>
    </div>
  );
}
