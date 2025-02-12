"use client";
import React from "react";
import { Eye, Clock } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VideoRecommendation {
  id: number;
  thumbnail: string;
  title: string;
  channelName: string;
  views: string;
  uploadTime: string;
}

interface VideoRecommendationsProps {
  recommendations: VideoRecommendation[];
}

export function VideoRecommendations({
  recommendations,
}: VideoRecommendationsProps) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Recommended</h3>
      <div className="space-y-4">
        {recommendations.map((video) => (
          <Link
            key={video.id}
            href={`/video/${video.id}`}
            className="flex gap-2 hover:bg-muted/50 p-2 rounded-lg transition-colors"
          >
            <div className="relative w-40 h-24">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover rounded"
              />
            </div>
            <div className="flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h4 className="font-medium line-clamp-2">
                    {video.title.length > 250
                      ? video.title.substring(0, 250) + "..."
                      : video.title}
                  </h4>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[33rem]">{video.title}</p>
                </TooltipContent>
              </Tooltip>
              <Link
                href={`/channel/${video.channelName}`}
                className="text-sm text-muted-foreground hover:text-primary block mt-1"
              >
                {video.channelName}
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {video.views}
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {video.uploadTime}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
