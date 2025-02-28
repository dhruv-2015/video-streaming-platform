"use client";

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link';
import { isTRPCClientError, trpc, trpcClient } from '@/trpc/client';
import { RouterOutputs } from '@workspace/trpc';
import { Button } from '@/components/ui/button';
import Loader from '@/components/Loader';
import { Users, PlaySquare, Eye, Calendar } from 'lucide-react';

// Dummy data
// const channelData = {
//   id: '1',
//   name: 'LIE',
//   handle: '@LieInAnime',
//   subscribers: '73.1K subscribers',
//   videos: '196 videos',
//   description: 'Expect full manhwa recaps only here! Whether you are new to these genres or a seasoned fan looking for something new to read, my recommendations and reviews can help guide you toward some great series.',
//   shortDescription: 'Expect full manhwa recaps only here!',
//   avatar: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&auto=format&fit=crop&q=80',
//   joinDate: 'Joined 10 Jun 2021',
//   location: 'United States',
//   views: '60,70,126 views',
//   url: 'youtube.com/@LieInAnime'
// }

export default function ChannelPage({params}: {params: {channel_slug: string}}) {
    const { data: channel, isLoading, isError, error} = trpc.channel.getChannel.useQuery({
        channel_slug: params.channel_slug
    })

  const [isAboutOpen, setIsAboutOpen] = useState(false)
//   trpc.
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'videos'

  const handleTabChange = (value: string) => {
    router.push(`?tab=${value}`)
  }
  if (isLoading) {
    return <Loader />
  }
  if (isError) {
    throw error
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1850px] mx-auto">
        {/* Channel Header */}
        <div className="p-6">
          <div className="flex gap-6">
            <Image
              src={channel.image}
              alt={channel.name}
              width={160}
              height={160}
              className="rounded-full"
            />
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">{channel.name}</h1>
              <p className="text-sm text-muted-foreground">
                @{channel.slug} • {channel.subscriber_count} • {channel.total_views}
              </p>
              <p className="text-sm text-muted-foreground">
                {channel.description.slice(0, 100)}
                <button
                  onClick={() => setIsAboutOpen(true)}
                  className="ml-2 text-blue-500 hover:underline"
                >
                  ...more
                </button>
              </p>
            </div>
          </div>
        </div>

        <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>About</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="text-sm text-muted-foreground">{channel.description}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Channel details</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><Link href={`/channel/${channel.slug}`} className="text-sm text-blue-500 hover:underline">
                    {`/channel/${channel.slug}`}
                  </Link></p>
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {channel.subscriber_count}
                  </p>
                  <p className="flex items-center gap-2">
                    <PlaySquare className="w-4 h-4" />
                    {channel.total_videos}
                  </p>
                  <p className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {channel.total_views}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {channel.join_at.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tabs Section */}
        <div className="border-b">
          <div className="max-w-[1850px] mx-auto">
            <Tabs defaultValue={tab} onValueChange={handleTabChange}>
              <TabsList className="w-full justify-start rounded-none px-6 bg-transparent">
                <TabsTrigger value="videos" className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none">Videos</TabsTrigger>
                <TabsTrigger value="playlists" className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none">Playlists</TabsTrigger>
              </TabsList>
              <TabsContent value="videos" className="p-6">
                <VideoGrid channel_id={channel.id}/>
              </TabsContent>
              <TabsContent value="playlists" className="p-6">
                <PlaylistGrid channel_id={channel.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

function VideoGrid({channel_id}: {channel_id: string}) {
  const videos = [
    {
      id: '1',
      title: 'My Framework Investment Should NOT Have Worked Out',
      thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=1920',
      views: '11 lakh views',
      date: '16 hours ago'
    },
    {
      id: '2',
      title: 'The Future of Web Development - New Frameworks in 2024',
      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=1920',
      views: '324K views',
      date: '2 days ago'
    },
    {
      id: '3',
      title: 'Building Modern Applications with Next.js',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1920',
      views: '892K views',
      date: '5 days ago'
    },
    {
      id: '4',
      title: 'Why TypeScript is Taking Over JavaScript',
      thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=1920',
      views: '1.2M views',
      date: '1 week ago'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <div key={video.id} className="group cursor-pointer">
          <div className="aspect-video relative">
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              className="rounded-lg object-cover"
            />
            {/* Video duration overlay */}
            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs text-white">
              12:34
            </div>
            {/* Play button overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/70">
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
              {video.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {video.views} • {video.date}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlaylistGrid({channel_id}: {channel_id: string}) {
//   const playlists = [
//     {
//       id: '1',
//       title: 'Web Development Basics',
//       thumbnail: 'https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?auto=format&fit=crop&q=80&w=1920',
//       videoCount: '8 videos'
//     },
//     {
//       id: '2',
//       title: 'Advanced JavaScript Concepts',
//       thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=1920',
//       videoCount: '12 videos'
//     },
//     {
//       id: '3',
//       title: 'React & Next.js Masterclass',
//       thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=1920',
//       videoCount: '15 videos'
//     },
//     {
//       id: '4',
//       title: 'TypeScript Deep Dive',
//       thumbnail: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&q=80&w=1920',
//       videoCount: '10 videos'
//     }
//   ]

const [playlists, setPlaylists] = useState<RouterOutputs['channel']['getPlaylist']['playlists']>([])
const [hasMore, setHasMore] = useState<boolean>(true)
const [isLoading, setIsLoading] = useState<boolean>(true)
const [nextPage, setNextPage] = useState<number>(1)
  async function loadMore(page: number) {
    setIsLoading(true)
    try {
        const playlists = await trpcClient.channel.getPlaylist.query({
            channel_id,
            limit: 10,
            page: 1 
          })

        setPlaylists(pre => [...pre, ...playlists.playlists].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i))

        if (playlists.next_page === null) {
        setHasMore(false)
        } else {
            setNextPage(playlists.next_page)
        }
    } catch (error) {
        if (isTRPCClientError(error)) {
            alert(error.data?.message || error.message)
        }
    } finally {
        setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMore(1);
  },[])

//   const {} = trpc.channel.getPlaylist.useQuery({
//     channel_id,
//     limit: 10,
//     page: 1 
//   })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {playlists.map((playlist) => (
        <Link href={`/playlist/${playlist.id}`} key={playlist.id} className="group cursor-pointer">
          <div className="relative">
            {/* Playlist thumbnail stack effect */}
            <div className="relative z-10 aspect-video">
              <Image
                src={playlist.thumbnail}
                alt={playlist.name}
                fill
                className="rounded-lg object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors">
                <div className="absolute bottom-3 left-3 text-white space-y-1">
                  <div className="flex items-center gap-2">
                    <svg 
                      className="w-5 h-5" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M3.5 3.5h7v7h-7zm10 0h7v7h-7zm-10 10h7v7h-7zm10 0h7v7h-7z"/>
                    </svg>
                    <span className="font-medium">View full playlist</span>
                  </div>
                  <div className="text-sm text-gray-200">{playlist.total_videos} videos</div>
                </div>
              </div>
            </div>
            {/* Background stacked effect */}
            <div className="absolute top-2 left-2 right-2 h-full bg-gray-200 rounded-lg -z-10" />
            <div className="absolute top-1 left-1 right-1 h-full bg-gray-100 rounded-lg -z-20" />
          </div>
          <div className="mt-3 space-y-1">
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
              {playlist.name}
            </h3>
            <p className="text-xs text-muted-foreground">View full playlist</p>
          </div>
        </Link>
      ))}
      {isLoading && (<div className='flex justify-center items-center w-full'>Loading...</div>)}
      {hasMore && !isLoading && (
        <Button onClick={() => loadMore(nextPage)}></Button>
      )}
    </div>
  )
}
