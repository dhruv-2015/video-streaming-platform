"use client";

import { Card } from "@/components/ui/card";
import { datefns } from "@/components/ui/calendar";
const { formatDistance } = datefns;
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isTRPCClientError, trpc, trpcClient } from "@/trpc/client";
import { RouterOutputs } from "@workspace/trpc";

// interface PlaylistCard {
//   id: string;
//   name: string;
//   type: "private" | "public";
//   createdAt: Date;
//   videoCount: number;
//   thumbnailUrl: string;
// }

type PlaylistCard = RouterOutputs["playlist"]["getMyPlaylists"][0];

// This would be replaced with your actual data fetching logic

const PlaylistCard = React.memo(({ playlist }: { playlist: PlaylistCard }) => {
  return (
    <Link href={`/playlist/${playlist.id}`} key={playlist.id}>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <div className="relative aspect-video">
          <Image
            src={playlist.thumbnail}
            alt={playlist.name}
            fill
            className="object-cover rounded-t-lg"
          />
          <div className="absolute bottom-2 right-2 bg-secondary bg-opacity-90 px-2 py-1 rounded text-primary text-sm">
            {/* <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-white text-sm"> */}
            {playlist.video_count} videos
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg truncate">{playlist.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <span
              className={`capitalize ${
                playlist.type === "private" ? "text-red-600" : "text-green-600"
              }`}
            >
              {playlist.type}
            </span>
            <span>•</span>
            <span>
              {formatDistance(playlist.created_at, new Date(), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
});

const CreatePlaylistModal = ({
  open,
  onOpenChange,
  reload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reload?: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "public">("private");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle playlist creation logic here
    setIsLoading(true);
    try {
      await trpcClient.playlist.createPlaylist.mutate({
        name: title,
        description,
        is_private: privacy === "private",
      });
      if (reload) reload();
    } catch (error) {
      if (isTRPCClientError(error)) {
        alert(error.data?.message ?? error.message);
      }
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
    console.log({ title, description, privacy });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter playlist title"
              maxLength={150}
            />
            <div className="text-xs text-gray-500 text-right">
              {title.length}/150
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter playlist description"
              maxLength={5000}
            />
            <div className="text-xs text-gray-500 text-right">
              {description.length}/5000
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Privacy</label>
            <Select
              value={privacy}
              onValueChange={(value: "private" | "public") => setPrivacy(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select privacy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button loading={isLoading} type="submit">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function PlaylistPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  //   const mockPlaylists: PlaylistCard[] = [
  //         {
  //             id: "1",
  //             name: "Favorite Videos",
  //             type: "private",
  //             createdAt: new Date("2024-03-10"),
  //             videoCount: 15,
  //             thumbnailUrl: "https://picsum.photos/seed/1/360/200",
  //           },
  //           {
  //               id: "2",
  //               name: "Favorite Videos",
  //               type: "private",
  //               createdAt: new Date("2024-03-10"),
  //               videoCount: 15,
  //               thumbnailUrl: "https://picsum.photos/seed/1/360/200",
  //             },
  //             {
  //                 id: "3",
  //                 name: "Favorite Videos",
  //                 type: "public",
  //                 createdAt: new Date("2024-03-10"),
  //                 videoCount: 15,
  //                 thumbnailUrl: "https://picsum.photos/seed/1/360/200",
  //             },
  //             {
  //                 id: "4",
  //                 name: "Favorite Videos",
  //                 type: "private",
  //                 createdAt: new Date("2024-03-10"),
  //                 videoCount: 15,
  //                 thumbnailUrl: "https://picsum.photos/seed/1/360/200",
  //             },
  //             {
  //               id: "5",
  //               name: "Favorite Videos",
  //               type: "private",
  //               createdAt: new Date("2024-03-10"),
  //               videoCount: 15,
  //               thumbnailUrl: "https://picsum.photos/seed/1/360/200",
  //             },
  //       // Add more mock data as needed
  //     ];

  const {
    data: playlists,
    isLoading,
    isError,
    refetch,
  } = trpc.playlist.getMyPlaylists.useQuery(undefined, {
    keepPreviousData: true,
  });
  // if (isLoading) {

  // }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Playlists</h1>
        <Button onClick={() => setIsModalOpen(true)}>Create Playlist</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading && <div>Loading...</div>}
        {isError && (<div>
            <div>Error loading playlists</div>
            <Button onClick={() => refetch()}>Retry</Button>
        </div>)}
        {playlists &&
          playlists.map(playlist => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
      </div>

      <CreatePlaylistModal open={isModalOpen} onOpenChange={setIsModalOpen} reload={() => refetch()} />
    </div>
  );
}
