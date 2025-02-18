import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
export function PlaylistSelector() {
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [playlistSearch, setPlaylistSearch] = useState("");
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlists, setPlaylists] = useState([
    { id: "1", name: "Web dev" },
    { id: "2", name: "Rusty" },
    { id: "3", name: "Find Manga and continue" },
    { id: "4", name: "Machine learning projects" },
    { id: "5", name: "React native" },
    { id: "6", name: "Best songs" },
    // ... add more playlists
  ]);
  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(playlistSearch.toLowerCase()),
  );
  const togglePlaylist = (playlistId: string) => {
    setSelectedPlaylists(prev =>
      prev.includes(playlistId)
        ? prev.filter(id => id !== playlistId)
        : [...prev, playlistId],
    );
  };

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-playlist-selector]")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <>
    <div className="relative" data-playlist-selector>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setIsOpen(!isOpen)}
        >
        {selectedPlaylists.length > 0
          ? `${selectedPlaylists.length} playlists selected`
          : "Select playlists"}
      </Button>

      {isOpen && (
        <Card className="absolute z-50 top-full left-0 right-0 mt-2 p-4 shadow-lg">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a playlist"
                className="pl-8"
                value={playlistSearch}
                onChange={e => setPlaylistSearch(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[300px] -mx-2 px-2">
              <div
                className={cn(
                  "cursor-pointer hover:bg-accent rounded-md p-2 -ml-2 -mr-2",
                  showNewPlaylistInput && "bg-accent",
                )}
                onClick={() => setShowNewPlaylistInput(true)}
              >
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">New playlist</span>
                </div>
              </div>

              {showNewPlaylistInput && (
                <div className="mt-2 space-y-2 p-2 bg-accent rounded-md -mx-2">
                  <Input
                    placeholder="Enter playlist name"
                    value={newPlaylistName}
                    onChange={e => setNewPlaylistName(e.target.value)}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === "Enter" && newPlaylistName.trim()) {
                        const newId = `new-${Date.now()}`;
                        setPlaylists(prev => [
                          ...prev,
                          { id: newId, name: newPlaylistName.trim() },])
                        setSelectedPlaylists(prev => [...prev, newId]);
                        setNewPlaylistName("");
                      } else if (e.key === "Escape") {
                        setShowNewPlaylistInput(false);
                        setNewPlaylistName("");
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        if (newPlaylistName.trim()) {
                          const newId = `new-${Date.now()}`;
                          playlists.push({
                            id: newId,
                            name: newPlaylistName.trim(),
                          });
                          setSelectedPlaylists(prev => [...prev, newId]);
                          setNewPlaylistName("");
                        }
                        setShowNewPlaylistInput(false);
                      }}
                    >
                      Create
                    </Button>
                    <Button
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
              )}

              <div className="space-y-1 mt-2">
                {filteredPlaylists.map(playlist => (
                  <div
                    key={playlist.id}
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md -mx-2"
                  >
                    <Checkbox
                      id={playlist.id}
                      checked={selectedPlaylists.includes(playlist.id)}
                      onCheckedChange={() => togglePlaylist(playlist.id)}
                    />
                    <label
                      htmlFor={playlist.id}
                      className="flex-grow text-sm font-medium cursor-pointer"
                    >
                      {playlist.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end pt-2 border-t">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
                      {selectedPlaylists.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Selected playlists: {selectedPlaylists.length}
                    </div>
                  )}
                  </>
  );
}
