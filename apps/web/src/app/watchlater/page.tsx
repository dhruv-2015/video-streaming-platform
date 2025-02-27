"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { datefns } from "@/components/ui/calendar";
const { formatDistance } = datefns;
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { AppRouter, RouterOutputs } from "@workspace/trpc";
import { isTRPCClientError, trpc, trpcClient } from "@/trpc/client";
import { convertSecondsToHMS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PlaylistSelector } from "@/components/PlaylistSelector/page";
import { useAppSelector } from "@/redux/store";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { TRPCClientError } from "@trpc/client";
import Loader from "@/components/Loader";

// interface PlaylistDetails {
//   title: string;
//   description: string;
//   isPrivate: boolean;
//   videoCount: number;
//   thumbnailUrl: string;
// }

// type PlaylistDetails = RouterOutputs["playlist"]["getPlaylist"];
type WatchLaterVideo = RouterOutputs["watchLater"]["getMyWatchLater"]["videos"][0];


// function PlaylistDetails({ playlistId }: { playlistId: string }) {
// //   const [details, setDetails] = useState<PlaylistDetails | null>(null);
// const {data: details, isLoading, isError, refetch} = trpc.playlist.getPlaylist.useQuery({ id: playlistId })
//     if (isLoading) {
//         return <div>Loading...</div>
//     }
//     if (isError) {
//         return <div>Error</div>
//     }

//   // TODO: Replace with actual API call
//   useEffect(() => {
//     // Fetch playlist details
//     refetch()
//   }, [playlistId]);

//   if (!details) return <div>Loading...</div>;

//   return (

//   );
// }

// function PlaylistVideos() {
//   // const {data: videos, isLoading, isError} = trpc.playlist.getPlaylistVideo.useQuery({ playlist_id: playlistId, page: 1, limit: 10 });
  
// }

// export const metadata: Metadata = {
//   title: "Playlist - YouTube Clone",
// };

export default function PlaylistPage({
  params,
}: {
  params: { playlist_id: string };
}) {
  
  const user = useAppSelector(state => state.user);
  const [page, setPage] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<WatchLaterVideo[]>([]);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<TRPCClientError<AppRouter> | null>(null);

  async function getLikeVideos(page: number) {
    setIsLoading(true);
    try {
      const res = await trpcClient.watchLater.getMyWatchLater.query({
        page: page,
        limit: 10,
      });
      setVideos(pre =>
        [...pre, ...res.videos].filter(
          (v, i, a) => a.findIndex(t => t.id === v.id) === i,
        ),
      );
      setTotalVideos(res.total_videos);
      if (res.next_page == null) {
        setHasMore(false);
      } else {
        setPage(res.next_page);
      }
    } catch (error) {
      if (isTRPCClientError(error)) {
        setIsError(true);
        setError(error);
      }
    }
    setIsLoading(false);
  }

  useEffect(() => {
    getLikeVideos(1);
  },[]);
  if (isLoading && videos.length === 0) {
    return <Loader />;
  }


  if (videos.length === 0) {
    return (
        <div className="flex justify-center items-center h-44">
            <p>you don't have any video in watch later</p>
        </div>
    );
  }
//   if (isError) {
//     return <div className="text-destructive">Error loading videos</div>;
//   }

  return (
    <div className="flex gap-6 p-6">
      {/* Left side - Playlist Details */}
      <div className="w-1/3">
        <Card>
          <CardContent className="p-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={videos[0]?.thumbnail ?? ""}
                alt="WatchLater"
                fill
                className="object-cover"
              />
            </div>

            <h1 className="mt-4 text-2xl font-bold text-foreground">
            Watch Later videos
            </h1>

            <div className="mt-2 text-muted-foreground">
              {totalVideos} videos
            </div>

            {/* <p className="mt-4 text-muted-foreground">{details.description}</p> */}
          </CardContent>
        </Card>
      </div>
          {/* Right side - Video List */}
          <div className="w-2/3">
    <div className="space-y-4">
      <InfiniteScroll
        hasMore={hasMore && !isError}
        isLoading={isLoading}
        next={() => getLikeVideos(page)}
        threshold={10}
      >
        {videos.map(video => (
          <Card key={video.id} className="flex gap-4 p-4">
            <Link
              href={`/play/${video.id}`}
              className="flex flex-1 gap-4"
            >
              <div className="relative aspect-video w-48 overflow-hidden rounded-lg">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-1 right-1 rounded bg-background/80 px-1 text-xs">
                  {convertSecondsToHMS(video.duration)}
                </div>
              </div>

              <div className="flex flex-1 flex-col">
                <h3 className="font-semibold text-foreground hover:text-primary">
                  {video.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {video.channel.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistance(video.created_at, new Date(), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </Link>
          </Card>
        ))}
        <div className="flex justify-center items-center">
          {error && <p> {error.data?.message || error.message}</p>}
          {(isError || hasMore) && !isLoading && (
            <Button onClick={() => getLikeVideos(page)}>
              {isError ? "Retry" : "Load More"}
            </Button>
          )}
        </div>
      </InfiniteScroll>
    </div>
        {/* <PlaylistVideos playlistId={params.playlist_id} /> */}
      </div>
    </div>
  );
}
