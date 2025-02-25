"use client";

import * as React from "react";
import Link from "next/link";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  // Row,
} from "@/components/ui/table";
import { ArrowUpDown, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { useAppSelector } from "@/redux/store";
import { trpc } from "@/trpc/client";
import { RouterOutputs } from "@workspace/trpc";
import { useRouter, useSearchParams } from "next/navigation";



type Video = RouterOutputs["channel"]["getVideos"]["videos"][0];
interface Cell<T> {

}
interface Row<T> {
  original: T;
  // getVisibleCells: () => Cell<T>[];
  getValue: (key: string) => string;
}

const LikesCell = React.memo(({ row }: { row: Row<Video> }) => {
  const likes = row.original.like_count;
  const dislikes = row.original.dislike_count;
  const total = likes + dislikes;
  const percentage = total > 0 ? (likes / total) * 100 : 0;

  return (
    <div className="w-[100px] group relative">
      <div className="flex items-center gap-2">
        <span>
          {likes >= 1000000
            ? (likes / 1000000).toFixed(1) + "M"
            : likes >= 1000
              ? (likes / 1000).toFixed(1) + "K"
              : likes}
        </span>
        <span className="text-muted-foreground">
          ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="absolute -top-8 left-0 hidden group-hover:block bg-popover text-popover-foreground p-2 rounded-md shadow-md text-sm">
        {likes.toLocaleString()} likes, {dislikes.toLocaleString()} dislikes
      </div>
    </div>
  );
});

const ThumbnailCell = React.memo(({ row }: { row: Row<Video> }) => {
  return (
    <div className="relative h-20 w-36 overflow-hidden rounded-sm">
      <Image
        src={row.getValue("thumbnail") || "/placeholder.svg"}
        alt={row.getValue("title")}
        className="object-cover"
        fill
        sizes="144px"
        loading="lazy"
      />
    </div>
  );
});

const columns: ColumnDef<Video>[] = [
  {
    accessorKey: "thumbnail",
    header: "Video",
    cell: ({ row }) => <ThumbnailCell row={row} />,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      
      return (
        <Link
          href={`/studio/video/${row.original.id}`}
          className="flex items-center gap-3"
        >
          <div>
            <div className="font-medium">
            {row.original.title.length > 60
                ? row.original.title.slice(0, 60) + "..."
                : row.original.title}
            </div>
            <div className="text-sm text-muted-foreground">
     
              {row.original.description.length > 50
                ? row.original.description.slice(0, 50) + "..."
                : row.original.description}
            </div>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: "video_type",
    header: "Visibility",
    cell: ({ row }) => {
      const visibility: string = row.getValue("video_type");
      return (
        <div className="flex items-center gap-2">
          {visibility === "PRIVATE" ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span>{visibility}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      // return row.getValue("created_at");
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString() + "\n" + date.toLocaleTimeString();
    },
  },
  {
    accessorKey: "published_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Published At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date: string | null = row.getValue("published_at");
      return `${row.original.is_ready === false ? "transcoding...\n" : ""}${date ? new Date(date).toLocaleDateString(): "Draft"}`;
    },
  },
  {
    accessorKey: "view_count",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Views
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "comment_count",
    header: "Comments",
  },
  {
    accessorKey: "likes",
    header: "Likes",
    cell: ({ row }) => <LikesCell row={row} />,
  },
  // {
  //   id: "actions",
  //   cell: ({ row }) => {
  //     return (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button variant="ghost" className="h-8 w-8 p-0">
  //             <MoreHorizontal className="h-4 w-4" />
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end">
  //           <DropdownMenuItem>Edit</DropdownMenuItem>
  //           <DropdownMenuItem asChild><Button onClick={() => {trpcClient.studio}}>Delete</Button></DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     );
  //   },
  // },
];

// Add custom debounce hook at the top of the file
function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) {
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

// Add this helper function at the top of the file, after imports
function getPageNumbers(currentPage: number, totalPages: number, maxButtons: number = 5) {
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfWay = Math.floor(maxButtons / 2);
  let startPage = Math.max(currentPage - halfWay, 1);
  let endPage = startPage + maxButtons - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(endPage - maxButtons + 1, 1);
  }

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );
}

export function VideosTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const [page, setPage] = React.useState(() => 
    Number(searchParams.get("page")) || 1
  );
  const [limit, setLimit] = React.useState(() => 
    Number(searchParams.get("limit")) || 10
  );
  const [search, setSearch] = React.useState(() => 
    searchParams.get("search") || ""
  );
  const [isFirstLoad, setIsFirstLoad] = React.useState(true);

  // Function to update URL params
  const updateUrlParams = React.useCallback((updates: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const params = new URLSearchParams(searchParams);
    
    if (updates.page) params.set("page", updates.page.toString());
    if (updates.limit) params.set("limit", updates.limit.toString());
    if (updates.search !== undefined) {
      if (updates.search) {
        params.set("search", updates.search);
      } else {
        params.delete("search");
      }
    }
    
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Update URL when state changes
  React.useEffect(() => {
    // table.setPageIndex(page - 1);
    updateUrlParams({ page, limit, search });
  }, [page, limit, search, updateUrlParams]);

  const debouncedSearch = useDebounce((value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on search
  }, 500);

  const user = useAppSelector(state => state.user);

  const { data: videos, isLoading, isError } = trpc.channel.getVideos.useQuery(
    { 
      channel_id: user.channel_id!, 
      limit, 
      page, 
      query: search 
    },
    {
      enabled: !!user.channel_id,
      staleTime: 10000,
      keepPreviousData: true,
    },
  );

  // Force table to update when data changes
  React.useEffect(() => {
    table.setPageIndex(page - 1);
  }, [videos]);

  const table = useReactTable({
    data: videos?.videos ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true, // Tell the table we're handling pagination
    pageCount: videos?.total_page ?? -1,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({
          pageIndex: page - 1,
          pageSize: limit,
        });
        setPage(newState.pageIndex + 1);
        setLimit(newState.pageSize);
      }
    },
  });

  // Reset to first page on first page load and when search changes
  React.useEffect(() => {
    if (!isFirstLoad) {
      setPage(1);
    }
  }, [search]);


  React.useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [])

  // Add loading state UI
  if (isLoading && !videos) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <input
            placeholder="Search videos..."
            defaultValue={search}
            onChange={e => debouncedSearch(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </div>
        <select
          value={limit}
          onChange={e => {
            const newLimit = Number(e.target.value);
            setLimit(newLimit);
            setPage(1); // Reset to first page when changing limit
          }}
          className="rounded-md border px-3 py-2"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {/* Add loading overlay when fetching new data */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableHead key={header.id}>
                        <>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        <>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No videos found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          {getPageNumbers(page, videos?.total_page ?? 1).map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              onClick={() => setPage(pageNum)}
              className="min-w-[40px]"
            >
              {pageNum}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
        <div className="text-muted-foreground text-sm">
          Page {page} of {videos?.total_page ?? 1} ({videos?.total_videos ?? 0} videos)
        </div>
      </div>
    </div>
  );
}
