
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";
import { trpcClient } from "@/trpc/client";
import { VideoCart } from "@/components/Home/videoCart";

export default function SearchPage() {
  const searchParams = useSearchParams();
  
  const loadMoreRef = useRef<HTMLDivElement>(null);
    const search = searchParams.get("q") || "";


  const { data, fetchNextPage, hasNextPage, isFetching } =
    useInfiniteQuery({
      queryKey: ["videos", "search", search],
      queryFn: ({ pageParam = 1 }) =>
        trpcClient.video.getVideos.query({
          page: pageParam,
          limit: 12,
          search: search || undefined,
        }),
      getNextPageParam: (lastPage) => lastPage.next_page,
    });

  // Setup intersection observer for infinite scrolling
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target?.isIntersecting && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, fetchNextPage]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);



  return (
    <div className="container mx-auto py-8">
      <div className="space-y-4">

        <div className="flex gap-2 flex-wrap">
          {/* {tags && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setTags("")}
            >
              {tags} ×
            </Badge>
          )} */}
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.pages.map((page) =>
            page.videos.map((video) => (
              <VideoCart key={video.id} video={video} />
            ))
          )}
        </div>

        {/* Loading indicator */}
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {isFetching && <div>Loading more...</div>}
        </div>
      </div>
    </div>
  );
} 