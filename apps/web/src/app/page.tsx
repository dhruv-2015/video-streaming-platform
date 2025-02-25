"use client";
import React from "react";
import { Card } from "@/components/ui/card";
// import { LatestPost } from "@/app/_components/post";
// import { auth } from "@/auth";
import { trpcServerClient } from "@/trpc/server";
import VideoCart from "@/components/Home/videoCart";

type Videos = {
  id: string
  title: string
  thumbnail: string
  channel_thumbnail: string
  channel_name: string
  channel_slug: string
  views: string
  timestamp: string

}
const mockVideos: Videos[] = [
  {
    id: "1",
    title: "Getting Started with Next.js 13",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_name: "Tech Tutorials",
    channel_slug: "Tech Tutorials",
    views: "125K views",
    timestamp: "2 days ago",
  },
  {
    id: "2",
    title: "Cooking Masterclass",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_name: "Travel Vlogs",
    channel_slug: "Travel Vlogs",
    views: "800K views",
    timestamp: "1 week ago",
  },
  {
    id: "3",
    title: "Tech Review 2023",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_name: "Travel Vlogs",
    channel_slug: "Travel Vlogs",
    views: "500K views",
    timestamp: "3 days ago",
  },
  {
    id: "4",
    title: "Travel Vlog: Paris",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_name: "Travel Vlogs",
    channel_slug: "Travel Vlogs",
    views: "2M views",
    timestamp: "1 month ago",
  },
  {
    id: "5",
    title: "Fitness Workout",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_name: "Travel Vlogs",
    channel_slug: "Travel Vlogs",
    views: "300K views",
    timestamp: "5 days ago",
  },
  {
    id: "6",
    title: "Music Concert Highlights",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_thumbnail: "https://picsum.photos/seed/1/360/200",
    channel_name: "Travel Vlogs",
    channel_slug: "Travel Vlogs",
    views: "1.5M views",
    timestamp: "2 weeks ago",
  },
  // Add more mock videos here...
];

export default async function Home() {
  // trpcServerClient

  return (
    <div className={`container mx-auto mt-5`}>
    {/* <div className={`${!open ? "container" : "px-5"} mx-auto mt-5`}> */}
      <div className="hidden container"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {mockVideos.map(video => (
          <VideoCart key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
