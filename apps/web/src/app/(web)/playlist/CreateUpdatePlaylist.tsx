"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isTRPCClientError, trpcClient } from "@/trpc/client";
import { useState } from "react";

export const CreatePlaylistModal = ({
  open,
  onOpenChange,
  reload,
  state,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reload?: () => void;
  state?: {
    id: string;
    title: string;
    description: string;
    privacy: "private" | "public";
    isCreated: boolean;
  };
}) => {
  const [title, setTitle] = useState(state ? state.title : "");
  const [description, setDescription] = useState(
    state ? state.description : "",
  );
  const [privacy, setPrivacy] = useState<"private" | "public">(
    state ? state.privacy : "private",
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle playlist creation logic here
    setIsLoading(true);
    try {
      if (state && state.isCreated) {
        await trpcClient.playlist.updatePlaylist.mutate({
          id: state.id,
          name: title,
          description: description,
          visibility: privacy,
        });
      } else {
        await trpcClient.playlist.createPlaylist.mutate({
          name: title,
          description,
          is_private: privacy === "private",
        });
      }
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
          <DialogTitle>{state && state.isCreated ? "Edit" : "Create"} playlist</DialogTitle>
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
