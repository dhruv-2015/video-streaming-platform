"use client";
import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/trpc/client";
import { CommentList } from "./CommentList";
import { useAppSelector } from "@/redux/store";

interface CommentSectionProps {
  video_id: string;
  channelId: string;
}

export function CommentSection({ video_id, channelId }: CommentSectionProps) {
  const user = useAppSelector((state) => state.user);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  const { refetch: refetchComments } = trpc.comment.getCommentsForVideo.useQuery({
    video_id: video_id,
    page: 1,
  });

  const createCommentMutation = trpc.comment.createNewCommentForVideo.useMutation({
    onSuccess: () => {
      refetchComments();
    },
  });

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    await createCommentMutation.mutateAsync({
      content: commentText,
      video_id: video_id,
    });

    setCommentText("");
  };

  return (
    <div className="lg:block">
      <div className="block lg:hidden mb-4">
        <Button
          onClick={() => setShowComments(!showComments)}
          variant="outline"
          className="w-full py-2"
        >
          {showComments ? "Hide Comments" : "Show Comments"}
        </Button>
      </div>

      <div className={`${showComments ? "block" : "hidden"} lg:block`}>
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-4">Comments</h3>

          {user.id ? (
            <div className="flex gap-4 mb-6">
              <Avatar>
                <AvatarImage
                  src={user.image}
                  alt={user.name}
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-transparent border-b border-input focus:border-primary outline-none pb-2"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="ghost" onClick={() => setCommentText("")}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handlePostComment}>
                    <Send className="mr-2 h-4 w-4" /> Comment
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          <CommentList 
            videoId={video_id}
            onReplyAdded={() => refetchComments()}
            currentUser={{
              id: user.id ?? "",
              role: user.role,
              avatar: user.image,
              name: user.name,
              channel_id: user.channel_id,
            }}
            channelId={channelId}
            isLoggedIn={!!user.id}
          />
        </div>
      </div>
    </div>
  );
}
