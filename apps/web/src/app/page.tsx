"use client";
import React, { useEffect, useState } from "react";
// import { LatestPost } from "@/app/_components/post";
// import { auth } from "@/auth";
import VideoCart from "@/components/Home/videoCart";
import { AppRouter, RouterOutputs } from "@workspace/trpc";
import { isTRPCClientError, trpc, trpcClient } from "@/trpc/client";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { TRPCClientError } from "@trpc/client";
import { Button } from "@/components/ui/button";

type Videos = RouterOutputs["video"]["getVideos"]["videos"][0];

export default async function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [nextPage, setNextPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState(true );
  const [videos, setVideos] = useState<Videos[]>([]);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<TRPCClientError<AppRouter> | null>(null);

  async function loadVideos(page: number) {
    try {
      setIsLoading(true);
      const res = await trpcClient.video.getVideos.query({
        page: page,
        limit: 10,
      });
      
      setVideos(pre => [...pre, ...res.videos].filter((v, i, a) => 
        a.findIndex(t => (t.id === v.id)) === i
      ));
      
      // Update pagination state
      if (!res.next_page) {
        console.log(!res.next_page, "!res.next_page");
        
        setHasMore(false);
      } else {
        setNextPage(res.next_page);
      }
    } catch (error) {
      if (isTRPCClientError(error)) {
        setIsError(true);
        setError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Add back the initial load
  useEffect(() => {
    loadVideos(1);
  }, []);

  return (
    <div className={`container mx-auto mt-5`}>
      {/* <div className={`${!open ? "container" : "px-5"} mx-auto mt-5`}> */}
      <div className="hidden container"></div>
      {/* <ScrollArea> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        <InfiniteScroll
          hasMore={hasMore && !isError}
          isLoading={isLoading}
          next={() => loadVideos(nextPage)}
          threshold={0.8}
        >
            {videos.map(video => (
              <div><VideoCart key={video.id} video={video} /></div>
            ))}

        </InfiniteScroll>
            <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5 gap-2">
              {isError  && (
                <>
                  <div className="text-destructive p-6">
                    {error?.data?.message || error?.message}
                  </div>
                  <Button onClick={() => loadVideos(nextPage)}>Retry</Button>
                </>
              )}

              {/* {isLoading && (
                <div className="text-center p-4">
                  <Loader />
                </div>
              )} */}
            </div>
        {/* {has} */}
          </div>
      {/* </ScrollArea> */}
    </div>
  );
}
