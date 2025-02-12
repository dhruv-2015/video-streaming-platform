"use client";
import React, { useState } from "react";
import { Send, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Comment {
  id: number;
  user: string;
  avatar: string;
  text: string;
  likes: number;
  timestamp: string;
  replies?: Reply[];
}

interface Reply {
  id: number;
  user: string;
  avatar: string;
  text: string;
  likes: number;
  timestamp: string;
}

export function CommentSection() {
  const [commentText, setCommentText] = useState("");
  const [showReplies, setShowReplies] = useState<{
    [key: number | string]: boolean;
  }>({});

  const [replyCommentText, setReplyCommentText] = useState<{
    [key: number | string]: string;
  }>({});

  const [showRepliesInput, setShowRepliesInput] = useState<{
    [key: number | string]: boolean;
  }>({});
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      user: "AlchemyFan",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50",
      text: 'Greatest "Instead I have created the most basic being to ever exist!"\nsd\ns',
      likes: 1200,
      timestamp: "2 hours ago",
      replies: [
        {
          id: 1,
          user: "ManhwaLover",
          avatar:
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50",
          text: "That part was epic!",
          likes: 45,
          timestamp: "1 hour ago",
        },
        {
          id: 2,
          user: "ManhwaLover",
          avatar:
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50",
          text: "That part was epic!",
          likes: 45,
          timestamp: "1 hour ago",
        },
        {
          id: 3,
          user: "ManhwaLover",
          avatar:
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50",
          text: "That part was epic!",
          likes: 45,
          timestamp: "1 hour ago",
        },
      ],
    },
    {
      id: 2,
      user: "AlchemyFan",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50",
      text: 'Greatest "Instead I have created the most basic being to ever exist!"\nsd\ns',
      likes: 1200,
      timestamp: "2 hours ago",
      replies: [
        {
          id: 1,
          user: "ManhwaLover",
          avatar:
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50",
          text: "That part was epic!",
          likes: 45,
          timestamp: "1 hour ago",
        },
        {
          id: 2,
          user: "ManhwaLover",
          avatar:
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50",
          text: "That part was epic!",
          likes: 45,
          timestamp: "1 hour ago",
        },
        {
          id: 3,
          user: "ManhwaLover",
          avatar:
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50",
          text: "That part was epic!",
          likes: 45,
          timestamp: "1 hour ago",
        },
      ],
    },
  ]);
  function handlePostComment(
    type: "direct" | "reply",
    parentId?: string | number,
  ) {
    return () => {
      if (type == "direct") {
        if (!commentText.trim()) return;

        const newComment: Comment = {
          id: comments.length + 1,
          user: "User",
          avatar:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50",
          text: commentText,
          likes: 0,
          timestamp: "Just now",
          replies: [],
        };

        setComments([newComment, ...comments]);
        setCommentText("");
      } else {
        const newComment: Reply = {
          id: comments.length + 1,
          user: "User",
          avatar:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50",
          text: replyCommentText[parentId!] ?? "",
          likes: 0,
          timestamp: "Just now",
        };
        setComments(pre => {
            const newComments = pre.map(comment => {
                if (comment.id === parentId) {
                return {
                    ...comment,
                    replies: [...comment.replies ?? [], newComment],
                };
                }
                return comment;
            });
    
            return newComments;
        });
        setShowRepliesInput({
            ...showRepliesInput,
            [parentId!]: false,
          });
          setReplyCommentText({
            ...replyCommentText,
            [parentId!]: "",
          });
      }
    };
  }

  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold mb-4">Comments</h3>

      {/* Comment Input */}
      <div className="flex gap-4 mb-6">
        <Avatar>
          <AvatarImage
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50"
            alt="user"
          />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent border-b border-input focus:border-primary outline-none pb-2"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setCommentText("")}>
              Cancel
            </Button>
            <Button onClick={handlePostComment("direct")}>
              <Send className="mr-2 h-4 w-4" /> Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {comments.map(comment => (
        <div key={comment.id} className="mb-6">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={comment.avatar} alt={comment.user} />
              <AvatarFallback>{comment.user[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{comment.user}</span>
                <span className="text-muted-foreground text-sm">
                  {comment.timestamp}
                </span>
              </div>
              <p className="mt-1">{comment.text}</p>
              <div>
                <div className="flex items-center gap-4 mt-2">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="mr-2 h-4 w-4" /> {comment.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setShowRepliesInput({
                        ...showRepliesInput,
                        [comment.id]: true,
                      })
                    }
                  >
                    Reply
                  </Button>
                </div>

                {showRepliesInput[comment.id] && (
                  <div className="flex gap-4 mb-6">
                    <Avatar>
                      <AvatarImage
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50"
                        alt="user"
                      />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={replyCommentText[comment.id] ?? ""}
                        onChange={e =>
                          setReplyCommentText({
                            ...replyCommentText,
                            [comment.id]: e.target.value,
                          })
                        }
                        placeholder="Add a comment..."
                        className="w-full bg-transparent border-b border-input focus:border-primary outline-none pb-2"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowRepliesInput({
                              ...showRepliesInput,
                              [comment.id]: false,
                            });
                            setReplyCommentText({
                              ...replyCommentText,
                              [comment.id]: "",
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handlePostComment("reply", comment.id)}>
                          <Send className="mr-2 h-4 w-4" /> Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Comment Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setShowReplies({
                        ...showReplies,
                        [comment.id]: !showReplies[comment.id],
                      })
                    }
                    className="mt-2"
                  >
                    {!!showReplies[comment.id]
                      ? "Hide replies"
                      : `Show ${comment.replies.length} replies`}
                  </Button>
                  {!!showReplies[comment.id] && (
                    <div className="mt-4 space-y-4">
                      <div className="mt-4 pl-4 border-l-2 border-muted">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="flex gap-4 mt-4">
                            <Avatar className="w-8 h-8">
                              <AvatarImage
                                src={reply.avatar}
                                alt={reply.user}
                              />
                              <AvatarFallback>{reply.user[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{reply.user}</span>
                                <span className="text-muted-foreground text-sm">
                                  {reply.timestamp}
                                </span>
                              </div>
                              <p className="mt-1">{reply.text}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Button variant="ghost" size="sm">
                                  <ThumbsUp className="mr-2 h-4 w-4" />{" "}
                                  {reply.likes}
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
