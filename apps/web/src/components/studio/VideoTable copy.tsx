"use client";

import * as React from "react";
import Link from "next/link";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@/components/ui/table";
import { ArrowUpDown, Eye, EyeOff, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { trpc } from "@/trpc/client";
import {type RouterOutputs} from "@workspace/trpc";

export type Video = RouterOutputs['channel']['video']['getMyVideos']['videos'][0];

// data[0]?.id
// data[0]?.thumbnail
// data[0]?.title
// data[0]?.description
// data[0]?.duration
// data[0]?.visibility




// const data: Video[] = [
//   {
//     id: "1",
//     thumbnail: "http://v0.dev/placeholder.svg",
//     title: "How to Build a Next.js App",
//     description: "Learn how to build a full-stack application with Next.js",
//     duration: "12:34",
//     visibility: "Public",
//     publishDate: "2024-02-10",
//     uploadDate: "2024-02-05",
//     views: 1234,
//     comments: 56,
//     likes: 789,
//     dislikes: 12,
//   },
//   {
//     id: "2",
//     thumbnail: "http://v0.dev/placeholder.svg",
//     title: "How to Build a Next.js Appdcsz",
//     description: "Learn how to build a full-stack application with Next.js",
//     duration: "12:34",
//     visibility: "Public",
//     publishDate: "2024-02-10",
//     uploadDate: "2024-02-07",
//     views: 12,
//     comments: 5,
//     likes: 78,
//     dislikes: 2,
//   },
//   // Add more sample data as needed
// ];

// const { data, isLoading, error} = trpc.channel.video.getMyVideos.useQuery({
//   channel_id: "1",
//   limit: 10,
//   page: 1,
// });




export const columns: ColumnDef<Video>[] = [
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
        <div className="flex items-center gap-3">
          <div>
            <div className="font-medium">{row.getValue("title")}</div>
            <div className="text-sm text-muted-foreground">
              {row.getValue("description")}
            </div>
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return row
        .getValue(id)
        ?.toString()
        .toLowerCase()
        .includes(value.toLowerCase());
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
    accessorKey: "uploadDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          upload date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "publishDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Publish date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
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
    accessorKey: "like_count",
    header: "Likes",
    cell: ({ row }) => {
      const likes = Number(row.getValue("like_count"));
      const dislikes = Number(row.getValue("dislike_count"));
      const total = likes + dislikes;
      const percentage = total > 0 ? (likes / total) * 100 : 0;

      return (
        <div className="w-[100px]">
          <div className="flex items-center gap-2">
            <span>{likes}</span>
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
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function VideoTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  
  const { data, isLoading } = trpc.channel.video.getMyVideos.useQuery({
    channel_id: "1", // You might want to make this dynamic
    limit: 10,
    page: 1,
  });

  const table = useReactTable({
    data: data?.videos ?? [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Search by title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={event =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
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
                  className="cursor-pointer transition-colors hover:bg-muted/50 group-focus:bg-muted/50"
                  data-state={row.getIsSelected() && "selected"}
                  onClick={e => {}}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      <div
                        onClick={
                          cell.column.id === "actions"
                            ? e => e.preventDefault()
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length} videos
        </div>
      </div>
    </div>
  );
}
