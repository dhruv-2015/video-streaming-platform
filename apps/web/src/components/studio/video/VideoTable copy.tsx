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

type Video = RouterOutputs["channel"]["getVideos"]["videos"][0];

const columns: ColumnDef<Video>[] = [
  {
    accessorKey: "thumbnail",
    header: "Video",
    cell: ({ row }) => {
      return (
        <div className="relative h-20 w-36 overflow-hidden rounded-sm">
          <Image
            src={row.getValue("thumbnail") || "/placeholder.svg"}
            alt={row.getValue("title")}
            className="object-cover"
            fill
          />
        </div>
      );
    },
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
      const date: string = row.getValue("published_at");
      return date ? new Date(date).toLocaleDateString() : `${row.original.is_ready === false ? "transcoding... " : ""}Draft`;
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
    cell: ({ row }) => {
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
    },
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

export function VideosTable() {
  const user = useAppSelector(state => state.user);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [search, setSearch] = React.useState<string>("");
  

  const { data: videos, isLoading, isError, refetch: refetchVideos } = trpc.channel.getVideos.useQuery(
    { channel_id: user.channel_id!, limit: limit, page: page, query: search },
    {
      enabled: !!user.channel_id,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      // queryKey: ['trpc','channel','getVideos', `${limit}-${page}-${search}`],

      
    },
  );

  React.useEffect(() => {
    // refetchVideos({
    // //  queryKey: ['trpc','channel','getVideos', `${limit}-${page}-${search}`], 
    // });
    refetchVideos();
  }, [limit, page, search]);

  const table = useReactTable({
    data: videos?.videos ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <input
            placeholder="Search videos..."
            value={search ?? ""}
            onChange={e => setSearch(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </div>
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="rounded-md border px-3 py-2"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

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

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={isLoading || videos === undefined || videos.next_page === null}
            onClick={() => setPage(videos?.next_page!)}
          >
            Next
          </Button>
        </div>
        <div className="text-muted-foreground text-sm">
          {videos?.total_videos ?? 0} videos
        </div>
      </div>
    </div>
  );
}
