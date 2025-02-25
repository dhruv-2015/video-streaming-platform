import { useState } from "react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Video {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: string;
  uploadDate: string;
}

export default function PlaylistVideos({ playlistId }: { playlistId: string }) {
  const [videos, setVideos] = useState<Video[]>([]);

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <div key={video.id} className="flex gap-4 rounded-lg bg-gray-900 p-4">
          <div className="relative aspect-video w-48 overflow-hidden rounded-lg">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-xs">
              {video.duration}
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            <h3 className="font-semibold">{video.title}</h3>
            <p className="text-sm text-gray-400">{video.channelName}</p>
            <p className="text-sm text-gray-400">{video.uploadDate}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <MoreVertical className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Save to playlist</DropdownMenuItem>
              <DropdownMenuItem>Remove from playlist</DropdownMenuItem>
              <DropdownMenuItem>Move to top</DropdownMenuItem>
              <DropdownMenuItem>Move to bottom</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
} 