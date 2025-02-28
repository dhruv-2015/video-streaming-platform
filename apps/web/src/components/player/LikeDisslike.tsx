"use client";
import { Button } from "@/components/ui/button";
import { cn, fixNumber } from "@/lib/utils";
import { trpc, trpcClient } from "@/trpc/client";
import { BookmarkIcon, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { PlaylistSelector } from "../PlaylistSelector/page";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const LikeDisslike = ({
  likes_count,
  // isLiked,
  // isDissLiked,
  video_id,
}: {
  video_id: string;
  // isLiked: boolean;
  // isDissLiked: boolean;
  likes_count: number;
}) => {
  useEffect(() => {
    trpcClient.history.addVideoToHistory
      .query({ video_id })
      .catch(console.error);
  }, []);
  const {
    data: state,
    isLoading,
    isError,
    error,
  } = trpc.video.getVideoState.useQuery(
    {
      video_id: video_id,
    },
    {
      retry: 1,
    },
  );
  const [isLiked, setIsliked] = useState(state?.isLiked ?? false);
  const [isDissLiked, setDissIsliked] = useState(state?.isDissLiked ?? false);
  const [like, setLike] = React.useState(likes_count);
  useEffect(() => {
    setIsliked(state?.isLiked ?? false);
    setDissIsliked(state?.isDissLiked ?? false);
  }, [state]);
  const handelClick = (m: "like" | "disslike") => {
    return async () => {
      if (m === "like") {
        const res = await trpcClient.video.toggleLikeVideo.mutate({ video_id });
        setIsliked(res.like);
        setLike(res.count);
      } else {
        const res = await trpcClient.video.toggleDissLikeVideo.mutate({
          video_id,
        });
        setDissIsliked(res.disslike);
      }
    };
  };
  if (isError && error.data?.code !== "UNAUTHORIZED") {
    return <div>{error?.data?.message ?? error.message}</div>;
  }
  if (isLoading) {
    return <></>;
  }
  return (
    <>
      <Button variant="secondary" size="sm" onClick={handelClick("like")}>
        {isLiked && !isError ? (
          <ThumbsUp className="mr-2 h-4 w-4" fill="white" />
        ) : (
          <ThumbsUp className="mr-2 h-4 w-4" />
        )}{" "}
        {fixNumber(like)}
      </Button>
      <Button variant="secondary" size="sm" onClick={handelClick("disslike")}>
        {isDissLiked && !isError ? (
          <ThumbsDown className="mr-2 h-4 w-4" fill="white" />
        ) : (
          <ThumbsDown className="mr-2 h-4 w-4" />
        )}
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </DialogTrigger>
        <DialogContent>
          <h2 className="text-lg font-bold mb-2">Share Video</h2>
          <p className="mb-4">Give 2 options to share: by link and by embed</p>
          <div className="flex gap-4">
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/play/${video_id}`)}>
              Share by Link
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/embed/${video_id}`)}>
              Share by Embed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {!isError && (
        <PlaylistSelector
          video_id={video_id}
          trigger={
            <Button variant="secondary" size="sm">
              <BookmarkIcon className="mr-2 h-4 w-4" /> save
            </Button>
          }
        />
      )}
    </>
  );
};

export default LikeDisslike;
