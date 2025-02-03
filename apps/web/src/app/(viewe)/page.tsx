"use client";
import React from 'react';
import { Card } from "@/components/ui/card";
// import { LatestPost } from "@/app/_components/post";
// import { auth } from "@/auth";
// import { trpc } from "@/trpc/client";
import Link from 'next/link'

const mockVideos = [
  {
    id: 1,
    title: "Getting Started with Next.js 13",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel: "Tech Tutorials",
    views: "125K",
    timestamp: "2 days ago",
  },
  {
    id: 2,
    title: "Cooking Masterclass",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel: "Travel Vlogs",
    views: "800K views",
    timestamp: "1 week ago",
  },
  {
    id: 3,
    title: "Tech Review 2023",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel: "Travel Vlogs",
    views: "500K views",
    timestamp: "3 days ago",
  },
  {
    id: 4,
    title: "Travel Vlog: Paris",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel: "Travel Vlogs",
    views: "2M views",
    timestamp: "1 month ago",
  },
  {
    id: 5,
    title: "Fitness Workout",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel: "Travel Vlogs",
    views: "300K views",
    timestamp: "5 days ago",
  },
  {
    id: 6,
    title: "Music Concert Highlights",
    thumbnail: "https://picsum.photos/seed/1/360/200",
    channel: "Travel Vlogs",
    views: "1.5M views",
    timestamp: "2 weeks ago",
  },
  // Add more mock videos here...
];

export default async function Home() {
  // const {data, isLoading} = await trpc.hello.useQuery("world");
  // const session = await auth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {mockVideos.map((video) => (
          <Link href={`/play/${video.id}`} key={video.id} className='overflow-hidden w-auto'>
              <Card className="overflow-hidden w-auto">
                <div className="aspect-video relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{video.channel}</p>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <span>{video.views} views</span>
                    <span className="mx-1">•</span>
                    <span>{video.timestamp}</span>
                  </div>
                </div>
              </Card>
          </Link>
        ))}
      </div>
      {/* <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="https://create.t3.gg/en/usage/first-steps"
            target="_blank"
          >
            <h3 className="text-2xl font-bold">First Steps →</h3>
            <div className="text-lg">
              Just the basics - Everything you need to know to set up your
              database and authentication.
            </div>
          </Link>
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="https://create.t3.gg/en/introduction"
            target="_blank"
          >
            <h3 className="text-2xl font-bold">Documentation →</h3>
            <div className="text-lg">
              Learn more about Create T3 App, the libraries it uses, and how
              to deploy it.
            </div>
          </Link>
        </div> */}
        {/* <div className="flex flex-col items-center gap-2">
          <p className="text-2xl text-white">
            {!isLoading ? data : "Loading tRPC query..."}
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-center text-2xl text-white">
              {session && <span>Logged in as {session.user?.name}</span>}
            </p>
            <Link
              href={session ? "/api/auth/signout" : "/api/auth/signin"}
              className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              {session ? "Sign out" : "Sign in"}
            </Link>
          </div>
        </div>

      </div> */}
    </div>
  );
}
