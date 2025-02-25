"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { datefns } from "@/components/ui/calendar";
const { formatDistance, } = datefns;
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { RouterOutputs } from "@workspace/trpc";
import { trpc, trpcClient } from "@/trpc/client";
import { convertSecondsToHMS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PlaylistSelector } from "@/components/PlaylistSelector/page";
import { useAppSelector } from "@/redux/store";

// interface PlaylistDetails {
//   title: string;
//   description: string;
//   isPrivate: boolean;
//   videoCount: number;
//   thumbnailUrl: string;
// }

type PlaylistDetails = RouterOutputs['playlist']['getPlaylist']
type PlaylistVideo = RouterOutputs['playlist']['getPlaylistVideo']['video'][0]

interface Video {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: string;
  uploadDate: string;
}

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


function PlaylistVideos({ playlistId }: { playlistId: string }) {
    const {data: videos, isLoading, isError} = trpc.playlist.getPlaylistVideo.useQuery({ playlist_id: playlistId })

    if (isLoading) {
        return <div className="flex items-center justify-center">Loading...</div>
    }
    if (isError) {
        return <div className="text-destructive">Error loading videos</div>
    }

    return (
        <div className="space-y-4">
            {videos.video.map((video) => (
                <Card key={video.id} className="flex gap-4 p-4">
                    <Link 
                        href={`/play/${video.id}?playlist=${playlistId}`}
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
                            <h3 className="font-semibold text-foreground hover:text-primary">{video.title}</h3>
                            <p className="text-sm text-muted-foreground">{video.channel.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {formatDistance(video.created_at, new Date(), {
                                    addSuffix: true,
                                })}
                            </p>
                        </div>
                    </Link>

                    {/* <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <PlaylistSelector video_id={video.id} trigger={<DropdownMenuItem>Save to playlist</DropdownMenuItem>} />
                            <DropdownMenuItem onClick={() => trpcClient.playlist.addOrRemoveVideoToPlaylist.mutate({add: false, playlist_id: playlistId, video_id: video.id})} className="text-destructive">Remove from playlist</DropdownMenuItem>
                            <DropdownMenuItem>Move to top</DropdownMenuItem>
                            <DropdownMenuItem>Move to bottom</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu> */}
                </Card>
            ))}
        </div>
    );
}

// export const metadata: Metadata = {
//   title: "Playlist - YouTube Clone",
// };

export default function PlaylistPage({
  params,
}: {
  params: { playlist_id: string };
}) {
    const playlistId = params.playlist_id;
    const user = useAppSelector((state) => state.user);
    const {data: details, isLoading, isError, error, refetch} = trpc.playlist.getPlaylist.useQuery({ id: playlistId });

    useEffect(() => {
        refetch();
    }, [playlistId, refetch]);

    if (isLoading) {
        return <div className="flex items-center justify-center p-6">Loading...</div>;
    }
    
    if (isError) {
        return <div className="text-destructive p-6">{error.data?.message || error.message}</div>;
    }

    if (!details) {
        return <div className="flex items-center justify-center p-6">Loading...</div>;
    }
    
    return (
        <div className="flex gap-6 p-6">
            {/* Left side - Playlist Details */}
            <div className="w-1/3">
                <Card>
                    <CardContent className="p-4">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                            <Image
                                src={details.thumbnail}
                                alt={details.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        
                        <h1 className="mt-4 text-2xl font-bold text-foreground">{details.name}</h1>
                        
                        <div className="mt-2 text-muted-foreground">
                            {details.video_count} videos
                            <span className="mx-2">•</span>
                            {details.type}
                        </div>
                        
                        <p className="mt-4 text-muted-foreground">{details.description}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Right side - Video List */}
            <div className="w-2/3">
                <PlaylistVideos playlistId={params.playlist_id} />
            </div>
        </div>
    );
}
