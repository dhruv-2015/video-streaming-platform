import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { isTRPCClientError, trpc, trpcClient } from "@/trpc/client";
import { RouterOutputs } from "@workspace/trpc";
import { Plus, Search, X } from "lucide-react";
import React, { ReactNode, useEffect, useState } from "react";
import Loader from "../Loader";

// New PlaylistSearch component
function PlaylistSearch({ 
  playlistSearch, 
  setPlaylistSearch, 
  isLoading 
}: { 
  playlistSearch: string;
  setPlaylistSearch: (value: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="relative pr-8">
      <Search className={`absolute left-2 top-2.5 h-4 w-4 text-muted-foreground ${isLoading && 'cursor-wait'}`} />
      <Input
        placeholder="Search for a playlist"
        className={`pl-8 ${isLoading && 'cursor-wait'}`}
        value={playlistSearch}
        onChange={e => setPlaylistSearch(e.target.value)}
      />
    </div>
  );
}

// New NewPlaylistInput component
function NewPlaylistInput({
  isLoading,
  newPlaylistName,
  setNewPlaylistName,
  setShowNewPlaylistInput,
  addPlaylist
}: {
  isLoading: boolean;
  newPlaylistName: string;
  setNewPlaylistName: (value: string) => void;
  setShowNewPlaylistInput: (value: boolean) => void;
  addPlaylist: (name: string) => Promise<void>;
}) {
  return (
    <div className="mt-2 space-y-2 p-2 border-white border-2 rounded-md">
      <Input
        disabled={isLoading}
        placeholder="Enter playlist name"
        value={newPlaylistName}
        onChange={e => setNewPlaylistName(e.target.value)}
        autoFocus
        className={cn("w-full bg-secondary", isLoading && 'cursor-wait')}
        onKeyDown={e => {
          if (e.key === "Enter" && newPlaylistName.trim()) {
            addPlaylist(newPlaylistName);
          } else if (e.key === "Escape") {
            setShowNewPlaylistInput(false);
            setNewPlaylistName("");
          }
        }}
      />
      <div className="flex gap-2">
        <Button
          disabled={isLoading}
          variant="default"
          className={cn(isLoading && 'cursor-wait')}
          size="sm"
          onClick={() => {
            if (newPlaylistName.trim()) {
              addPlaylist(newPlaylistName);
            }
          }}
        >
          Create
        </Button>
        <Button
          disabled={isLoading}
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowNewPlaylistInput(false);
            setNewPlaylistName("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// New PlaylistList component
function PlaylistList({
  filteredPlaylists,
  selectedPlaylists,
  isLoading,
  togglePlaylist
}: {
  filteredPlaylists: RouterOutputs["playlist"]["getMyPlaylists"];
  selectedPlaylists: string[];
  isLoading: boolean;
  togglePlaylist: (playlistId: string, add: boolean) => Promise<void>;
}) {
  // <div className="space-y-1 mt-2">
  return filteredPlaylists.map(playlist => (
        <div
          key={playlist.id}
          className={cn("flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer", isLoading && 'cursor-wait')}
          onClick={() =>
            togglePlaylist(
              playlist.id,
              !selectedPlaylists.includes(playlist.id),
            )}
        >
          <Checkbox
            disabled={isLoading}
            id={playlist.id}
            className={cn(isLoading && 'cursor-wait')}
            checked={selectedPlaylists.includes(playlist.id)}
            onCheckedChange={() =>
              togglePlaylist(
                playlist.id,
                !selectedPlaylists.includes(playlist.id),
              )
            }
          />
          <label
            htmlFor={playlist.id}
            className={cn("flex-grow text-sm font-medium cursor-pointer", isLoading && 'cursor-wait')}
          >
            {playlist.name}
          </label>
        </div>
      ))
    ;
    // </div>
}

// Main PlaylistSelector component
export function PlaylistSelector({
  video_id,
  trigger,
}: {
  video_id: string;
  trigger?: ReactNode;
}) {
  const {
    data: playlistData,
    isLoading: playlistDataIsLoading,
    isError,
    error,
  } = trpc.playlist.getMyPlaylists.useQuery();
  const {data:isInWatchLater} = trpc.watchLater.isInWatchLater.useQuery({
    video_id: video_id,
  })
  const {
    data: selectedVideo,
    isLoading: selectedVideoLoading,
    isError: selectedVideoIsError,
    error: selectedVideoError,
  } = trpc.playlist.getVideoPlaylist.useQuery({
    video_id,
  });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (playlistDataIsLoading || isError) {
      return;
    }
    if (playlistData?.length > 0) {
      setPlaylists(playlistData);
    }
  }, [playlistData, playlistDataIsLoading, isError]);

  useEffect(() => {
    if (selectedVideoLoading || selectedVideoIsError) {
      return;
    }
    if (selectedVideo) {
      setSelectedPlaylists(selectedVideo);
    }
  }, [selectedVideo]);

  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [playlistSearch, setPlaylistSearch] = useState("");
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isLoading, setIsloading] = useState(false);
  const [playlists, setPlaylists] = useState<
    RouterOutputs["playlist"]["getMyPlaylists"]
  >([]);

  const [isInWatchLaterState, setIsInWatchLaterState] = useState(false);
  useEffect(() => {
    isInWatchLater && setIsInWatchLaterState(isInWatchLater);
  }, [isInWatchLater]);
  const filteredPlaylists = playlists
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(playlist =>
      playlist.name.toLowerCase().includes(playlistSearch.toLowerCase()),
    );

  const togglePlaylist = async (playlistId: string, add: boolean) => {
    if (isLoading) {
      return;
    }
    try {
      setIsloading(true);
      await trpcClient.playlist.addOrRemoveVideoToPlaylist.mutate({
        playlist_id: playlistId,
        video_id,
        add,
      });
      setSelectedPlaylists(prev =>
        prev.includes(playlistId)
          ? prev.filter(id => id !== playlistId)
          : [...prev, playlistId],
      );
    } catch (error) {
      if (isTRPCClientError(error)) {
        alert(error.data?.message ?? error.message)
      }
    } finally {
      setIsloading(false);
    }
  };

  const addPlaylist = async (name: string) => {
    if (isLoading) {
      return;
    }
    try {
      setIsloading(true);
      const newPlaylist = await trpcClient.playlist.createPlaylist.mutate({
        name: name.trim(),
      })
      setPlaylists(prev => [
        ...prev,
        {
          id: newPlaylist.id,
          name: newPlaylist.name,
          type: "private" as const,
          thumbnail: "",
          created_at: new Date(),
          video_count: 0
        },
      ]);
      togglePlaylist(newPlaylist.id, true);
      setNewPlaylistName("");
      setShowNewPlaylistInput(false);
    } catch (error) {
      if (isTRPCClientError(error)) {
        alert(error.data?.message ?? error.message)
      }
    } finally {
      setIsloading(false);
    }
  }

  async function toggleWatchLater() {
    try {
      setIsloading(true);
      if (isInWatchLaterState) {
        await trpcClient.watchLater.removeVideoFromWatchLater.query({
          video_id: video_id,
        });
        setIsInWatchLaterState(false);
      } else {
        await trpcClient.watchLater.addVideoToWatchLater.query({
          video_id: video_id,
        });
        setIsInWatchLaterState(true);
      }
    } catch (error) {
      if (isTRPCClientError(error)) {
        alert(error.data?.message ?? error.message)
      }
    } finally {
      setIsloading(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          <div>{trigger}</div>
        ) : (
          <Button variant="outline" className="w-full justify-start">
            Select playlists
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={`sm:max-w-[425px] ${isLoading ? 'cursor-wait' : ''}`} contextMenu="">
        <div className="space-y-4">
          <PlaylistSearch 
            playlistSearch={playlistSearch}
            setPlaylistSearch={setPlaylistSearch}
            isLoading={isLoading}
          />

          <ScrollArea className={`h-[300px] -mx-2 px-2 ${isLoading && 'cursor-wait'}`}>
            <div
              className={cn(
                "cursor-pointer hover:bg-accent rounded-md p-2",
                showNewPlaylistInput && "bg-accent",
                isLoading && 'cursor-wait'
              )}
              onClick={() => setShowNewPlaylistInput(true)}
            >
              <div className="flex items-center rounded-md space-x-2">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">New playlist</span>
              </div>
            </div>

            {showNewPlaylistInput && (
              <NewPlaylistInput
                isLoading={isLoading}
                newPlaylistName={newPlaylistName}
                setNewPlaylistName={setNewPlaylistName}
                setShowNewPlaylistInput={setShowNewPlaylistInput}
                addPlaylist={addPlaylist}
              />
            )}

<div className="space-y-1 mt-2">

<div
          className={cn("flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer", isLoading && 'cursor-wait')}
          onClick={() =>
            toggleWatchLater()}
        >
          <Checkbox
            disabled={isLoading}
            id={"watch-later"}
            className={cn(isLoading && 'cursor-wait')}
            checked={isInWatchLaterState}
            onCheckedChange={() => toggleWatchLater()}
          />
          <label
            htmlFor={"watch-later"}
            className={cn("flex-grow text-sm font-medium cursor-pointer", isLoading && 'cursor-wait')}
          >
            Watch later
          </label>
        </div>
            
            <PlaylistList
              filteredPlaylists={filteredPlaylists}
              selectedPlaylists={selectedPlaylists}
              isLoading={isLoading}
              togglePlaylist={togglePlaylist}
            />

</div>
          </ScrollArea>
          
          <div className="flex justify-end pt-2 border-t">
            <Button
              disabled={isLoading}
              variant="default"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
