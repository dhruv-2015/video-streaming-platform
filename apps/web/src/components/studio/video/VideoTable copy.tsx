// "use client"

// import * as React from "react"
// import {
//   type ColumnDef,
//   type ColumnFiltersState,
//   type SortingState,
//   type VisibilityState,
//   flexRender,
//   getCoreRowModel,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   useReactTable,
// } from "@/components/ui/table"
// import { ArrowUpDown, Eye, EyeOff, MoreHorizontal } from "lucide-react"

// import { Button } from "@/components/ui/button"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import Image from "next/image"

// export type Video = {
//   id: string
//   thumbnail: string
//   title: string
//   description: string
//   duration: string
//   visibility: "Public" | "Private" | "Unlisted"
//   publishDate: string
//   uploadDate: string
//   views: number
//   comments: number
//   likes: number
//   dislikes: number
// }

// const data: Video[] = [
//   {
//     id: "1",
//     thumbnail: "https://kzmg7kk2ipk5wj1zrb5i.lite.vusercontent.net/placeholder.svg",
//     title: "How to Build a Next.js App",
//     description: "Learn how to build a full-stack application with Next.js",
//     duration: "12:34",
//     visibility: "Public",
//     publishDate: "2024-02-10",
//     uploadDate: "2024-02-09",
//     views: 1234,
//     comments: 56,
//     likes: 789,
//     dislikes: 12,
//   },
//   {
//     id: "2",
//     thumbnail: "https://kzmg7kk2ipk5wj1zrb5i.lite.vusercontent.net/placeholder.svg",
//     title: "How to Build a Next.js App",
//     description: "Learn how to build a full-stack application with Next.js",
//     duration: "12:34",
//     visibility: "Public",
//     publishDate: "2024-02-10",
//     uploadDate: "2024-02-09",
//     views: 1234,
//     comments: 56,
//     likes: 789,
//     dislikes: 12,
//   },
//   // Add more sample data as needed
// ]

// export const columns: ColumnDef<Video>[] = [
//   {
//     accessorKey: "thumbnail",
//     header: "Video",
//     cell: ({ row }) => {
//       return (
//         <div className="flex items-center gap-3">
//           <div className="relative h-20 w-36 overflow-hidden rounded-sm">
//             <Image
//               src={row.getValue("thumbnail") || "/placeholder.svg"}
//               alt={row.getValue("title")}
//               className="object-cover"
//               fill
//             />
//             <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-xs text-white">
//               {row.getValue("duration")}
//             </div>
//           </div>
//           <div>
//             <div className="font-medium">{row.getValue("title")}</div>
//             <div className="text-sm text-muted-foreground">{row.getValue("description")}</div>
//           </div>
//         </div>
//       )
//     },
//   },
//   {
//     accessorKey: "visibility",
//     header: "Visibility",
//     cell: ({ row }) => {
//       const visibility: string = row.getValue("visibility")
//       return (
//         <div className="flex items-center gap-2">
//           {visibility === "Private" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//           <span>{visibility}</span>
//         </div>
//       )
//     },
//   },
//   {
//     accessorKey: "publishDate",
//     header: ({ column }) => {
//       return (
//         <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
//           Publish date
//           <ArrowUpDown className="ml-2 h-4 w-4" />
//         </Button>
//       )
//     },
//   },
//   {
//     accessorKey: "views",
//     header: ({ column }) => {
//       return (
//         <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
//           Views
//           <ArrowUpDown className="ml-2 h-4 w-4" />
//         </Button>
//       )
//     },
//   },
//   {
//     accessorKey: "comments",
//     header: "Comments",
//   },
//   {
//     accessorKey: "likes",
//     header: "Likes",
//     cell: ({ row }) => {
//       const likes = Number.parseInt(row.getValue("likes"))
//       const dislikes = Number.parseInt(row.getValue("dislikes"))
//       const total = likes + dislikes
//       const percentage = total > 0 ? (likes / total) * 100 : 0

//       return (
//         <div className="w-[100px]">
//           <div className="flex items-center gap-2">
//             <span>{likes}</span>
//             <span className="text-muted-foreground">({percentage.toFixed(1)}%)</span>
//           </div>
//           <div className="h-2 w-full rounded-full bg-muted">
//             <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
//           </div>
//         </div>
//       )
//     },
//   },
//   {
//     id: "actions",
//     cell: ({ row }) => {
//       return (
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" className="h-8 w-8 p-0">
//               <MoreHorizontal className="h-4 w-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuItem>Edit</DropdownMenuItem>
//             <DropdownMenuItem>Delete</DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       )
//     },
//   },
// ]

// export function VideoTable() {
//   const [sorting, setSorting] = React.useState<SortingState>([])
//   const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
//   const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

//   const table = useReactTable({
//     data,
//     columns,
//     onSortingChange: setSorting,
//     onColumnFiltersChange: setColumnFilters,
//     getCoreRowModel: getCoreRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     onColumnVisibilityChange: setColumnVisibility,
//     state: {
//       sorting,
//       columnFilters,
//       columnVisibility,
//     },
//   })

//   return (
//     <div className="w-full">
//       <div className="rounded-md border">
//         <Table>
//           <TableHeader>
//             {table.getHeaderGroups().map((headerGroup) => (
//               <TableRow key={headerGroup.id}>
//                 {headerGroup.headers.map((header) => {
//                   return (
//                     <TableHead key={header.id}>
//                       {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
//                     </TableHead>
//                   )
//                 })}
//               </TableRow>
//             ))}
//           </TableHeader>
//           <TableBody>
//             {table.getRowModel().rows?.length ? (
//               table.getRowModel().rows.map((row) => (
//                 <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
//                   {row.getVisibleCells().map((cell) => (
//                     <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
//                   ))}
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={columns.length} className="h-24 text-center">
//                   No videos found.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//       <div className="flex items-center justify-end space-x-2 py-4">
//         <div className="text-muted-foreground text-sm">{table.getFilteredRowModel().rows.length} videos</div>
//       </div>
//     </div>
//   )
// }

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

export type Video = {
  id: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: string;
  visibility: "Public" | "Private" | "Unlisted";
  publishDate: string;
  uploadDate: string;
  views: number;
  comments: number;
  likes: number;
  dislikes: number;
};

const data: Video[] = [
  {
    id: "1",
    thumbnail: "http://v0.dev/placeholder.svg",
    title: "How to Build a Next.js App",
    description: "Learn how to build a full-stack application with Next.js",
    duration: "12:34",
    visibility: "Public",
    publishDate: "2024-02-10",
    uploadDate: "2024-02-05",
    views: 1234,
    comments: 56,
    likes: 789,
    dislikes: 12,
  },
  {
    id: "2",
    thumbnail: "http://v0.dev/placeholder.svg",
    title: "How to Build a Next.js Appdcsz",
    description: "Learn how to build a full-stack application with Next.js",
    duration: "12:34",
    visibility: "Public",
    publishDate: "2024-02-10",
    uploadDate: "2024-02-07",
    views: 12,
    comments: 5,
    likes: 78,
    dislikes: 2,
  },
  // Add more sample data as needed
];

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
          <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-xs text-white">
            {row.getValue("duration")}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "title",

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
  },

  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => {
      const visibility: string = row.getValue("visibility");
      return (
        <div className="flex items-center gap-2">
          {visibility === "Private" ? (
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
    accessorKey: "views",
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
    accessorKey: "comments",
    header: "Comments",
  },
  {
    accessorKey: "likes",
    header: "Likes",
    cell: ({ row }) => {
      const likes = Number.parseInt(row.getValue("likes"));
      const dislikes = Number.parseInt(row.getValue("dislikes"));
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
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
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

  return (
    <div className="w-full">
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
                  {/* <Link
                    href={`/studio/video/${row.original.id}`}
                    key={row.id}
                    className="group"
                  > */}
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {/* Stop propagation for action buttons to prevent navigation when clicking them */}
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
                  {/* </Link> */}
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
