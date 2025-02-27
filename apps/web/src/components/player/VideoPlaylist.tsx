"use client";
import React, { useEffect } from "react";
import { Eye, Clock } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { isTRPCClientError, trpcClient } from "@/trpc/client";
import { RouterOutputs } from "@workspace/trpc";
import { convertSecondsToHMS } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// interface VideoPlaylist {
//   id: number;
//   thumbnail: string;
//   title: string;
//   channelName: string;
//   views: string;
//   uploadTime: string;
// }

type VideoPlaylist = RouterOutputs["playlist"]["getPlaylistVideo"]["video"][0];

interface VideoPlaylistProps {
  playlist_id?: string;
  video_id: string;
}

export function VideoPlaylist({ playlist_id, video_id }: VideoPlaylistProps) {
  const [videos, setVideos] = React.useState<VideoPlaylist[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [nextPage, setNextPage] = React.useState<number | null>(1);

  const [isError, setIsError] = React.useState(false);
  if (!playlist_id) {
    return <></>;
  }

  async function fetchPlaylistVideos(playlist_id: string, page: number) {
    try {
      const videos = await trpcClient.playlist.getPlaylistVideo.query({
        playlist_id,
        page,
        limit: 10,
      });
      setVideos(pre => [...pre, ...videos.video.map(video => video)].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i));
      setNextPage(videos.next_page);
    } catch (error) {
      alert("Error fetching playlist videos");
      if (isTRPCClientError(error)) {
        console.error(error.data?.message || error.message);
        alert(error.data?.message || error.message);
      }
      setIsError(true);
    }
  }
  // fetchPlaylistVideos(playlist_id, nextPage);
  useEffect(() => {
    fetchPlaylistVideos(playlist_id, 1);
  }, []);

  return (
    <>
      <div className="mb-5 h-[calc(100vh-200px)]">
        <h3 className="text-lg font-bold mb-4">Playlist</h3>
        
        <ScrollArea className="h-[calc(100%-3rem)]">
          <div className="p-2">
            {videos.map(video => (
              <Link
                key={video.id}
                href={`/play/${video.id}?playlist=${playlist_id}`}
                className={`flex gap-2 p-2 rounded-lg transition-colors ${
                  video.id === video_id 
                    ? "bg-muted" 
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="relative w-40 h-24">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute bottom-2 right-2 bg-background/80 text-xs px-2 py-1 rounded">
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
                </div>
              </Link>
            ))}
            {nextPage !== null && isError && (
              <div className="flex items-center justify-center p-4">
                <Button onClick={() => fetchPlaylistVideos(playlist_id, nextPage)}>
                  Load More
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="space-y-4"></div>
      </div>
      <Separator className="mb-5" />
    </>
  );
}
