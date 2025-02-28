import { RouterOutputs } from "@workspace/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsDown, ThumbsUp, Send, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/trpc/client";

type Comment = RouterOutputs["comment"]["getCommentsForVideo"]["comments"][0] & {
  user_id: string;
};

interface CommentListProps {
  videoId: string;
  parentId?: string | null;
  onReplyAdded?: () => void;
  currentUser: {
    id: string;
    role?: string;
    avatar?: string;
    name?: string;
    channel_id?: string;
  };
  channelId: string;
  isLoggedIn: boolean;
}

const mapCommentWithUserId = (comment: RouterOutputs["comment"]["getCommentsForVideo"]["comments"][0]): Comment => {
  return {
    ...comment,
    user_id: comment.user.id
  };
};

export function CommentList({ videoId, parentId = null, onReplyAdded, currentUser, channelId, isLoggedIn }: CommentListProps) {
  const [page, setPage] = useState(1);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [showReplyInput, setShowReplyInput] = useState<{ [key: string]: boolean }>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");

  const { data: commentsData, refetch } = trpc.comment.getCommentsForVideo.useQuery({
    video_id: videoId,
    page,
    comment_id: parentId === null ? undefined : parentId,
  });

  const likeMutation = trpc.comment.likeComment.useMutation({
    onSuccess: () => refetch(),
  });

  const dislikeMutation = trpc.comment.dislikeComment.useMutation({
    onSuccess: () => refetch(),
  });

  const createCommentMutation = trpc.comment.createNewCommentForVideo.useMutation({
    onSuccess: () => {
      refetch();
      if (onReplyAdded) onReplyAdded();
    },
  });

  const updateCommentMutation = trpc.comment.updateCommentForVideo.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteCommentMutation = trpc.comment.deleteCommentForVideo.useMutation({
    onSuccess: () => refetch(),
  });

  const handleLike = async (commentId: string, isLiked: boolean) => {
    await likeMutation.mutate({
      video_id: videoId,
      comment_id: commentId,
      doLike: !isLiked,
    });
  };

  const handleDislike = async (commentId: string, isDisliked: boolean) => {
    await dislikeMutation.mutate({
      video_id: videoId,
      comment_id: commentId,
      doDislike: !isDisliked,
    });
  };

  const handleReplySubmit = async (parentCommentId: string) => {
    const content = replyText[parentCommentId];
    if (!content?.trim()) return;

    await createCommentMutation.mutate({
      content,
      video_id: videoId,
      comment_id: parentCommentId,
    });

    setReplyText({ ...replyText, [parentCommentId]: "" });
    setShowReplyInput({ ...showReplyInput, [parentCommentId]: false });
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editText.trim()) return;
    
    await updateCommentMutation.mutate({
      video_id: videoId,
      comment_id: commentId,
      content: editText,
    });

    setEditingComment(null);
    setEditText("");
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      await deleteCommentMutation.mutate({
        video_id: videoId,
        comment_id: commentId,
        isReply: !!parentId,
      });
    }
  };

  const canModifyComment = (comment: Comment, type: "edit" | "delete" = "edit") => {
    
    const condition = comment.user_id === currentUser.id
    if (type == "edit") {
      return condition;
    } else {
      if (!(condition || channelId === currentUser.channel_id || currentUser.role === "ADMIN")) {
        
        console.log(comment, );
      }
      return condition || channelId === currentUser.channel_id || currentUser.role === "ADMIN";
    }
  };

  if (!commentsData?.comments.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      {commentsData.comments.map((rawComment) => {
        const comment = mapCommentWithUserId(rawComment);
        return (
          <div key={comment.id} className="flex gap-4">
            <Avatar>
              <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
              <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">{comment.user.name}</span>
                <span className="text-muted-foreground text-sm">
                  {comment.createdAt.toLocaleString()}
                </span>
              </div>
              {editingComment === comment.id ? (
                <div className="mt-1">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-transparent border-b border-input focus:border-primary outline-none pb-2"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingComment(null);
                        setEditText("");
                      }}
                    >
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleEditSubmit(comment.id)}>
                      <Send className="h-4 w-4 mr-2" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1">
                  <p>{comment.content}</p>
                  {comment.isUpdated && (
                    <span className="text-xs text-muted-foreground ml-1">(edited)</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 mt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleLike(comment.id, comment.idLiked)}
                  className={comment.idLiked ? "text-primary" : ""}
                  disabled={!isLoggedIn}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" fill={comment.idLiked ? "white": ""} /> {comment.like_count}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDislike(comment.id, comment.isDissLiked)}
                  className={comment.isDissLiked ? "text-primary" : ""}
                  disabled={!isLoggedIn}
                >
                  <ThumbsDown className="h-4 w-4" fill={comment.isDissLiked ? "white": ""} /> {comment.dislike_count}
                </Button>
                {isLoggedIn && !parentId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setShowReplyInput((prev) => ({
                        ...prev,
                        [comment.id]: !prev[comment.id],
                      }))
                    }
                  >
                    Reply
                  </Button>
                )}
                {isLoggedIn && canModifyComment(comment,  "edit") && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditText(comment.content);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {isLoggedIn && canModifyComment(comment, "delete") && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {showReplyInput[comment.id] && (
                <div className="flex gap-4 mt-4">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={currentUser.avatar}
                      alt={currentUser.name?.charAt(0) ?? "U"}
                    />
                    <AvatarFallback>{currentUser.name?.charAt(0) ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={replyText[comment.id] || ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({
                          ...prev,
                          [comment.id]: e.target.value,
                        }))
                      }
                      placeholder="Add a reply..."
                      className="w-full bg-transparent border-b border-input focus:border-primary outline-none pb-2"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowReplyInput((prev) => ({
                            ...prev,
                            [comment.id]: false,
                          }));
                          setReplyText((prev) => ({ ...prev, [comment.id]: "" }));
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => handleReplySubmit(comment.id)}>
                        <Send className="mr-2 h-4 w-4" /> Reply
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!parentId && comment.reply_count > 0 && (
                <div className="mt-4">
                  <CommentList 
                    videoId={videoId} 
                    currentUser={currentUser}
                    channelId={channelId}
                    parentId={comment.id}
                    isLoggedIn={isLoggedIn}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {commentsData.next_page && (
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => setPage((p) => p + 1)}
        >
          Load More
        </Button>
      )}
    </div>
  );
} 