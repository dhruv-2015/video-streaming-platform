'use client'
import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus } from "lucide-react"
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from "@/lib/utils"
import { PlaylistSelector } from "./PlaylistSelector"

type Visibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED'

const VideoDetailsPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'details'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<Visibility>('UNLISTED')
  const [currentTag, setCurrentTag] = useState('')
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([])
  const [playlistSearch, setPlaylistSearch] = useState('')
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false)

  // Sample playlists data - replace with your actual data
  const playlists = [
    { id: '1', name: 'Web dev' },
    { id: '2', name: 'Rusty' },
    { id: '3', name: 'Find Manga and continue' },
    { id: '4', name: 'Machine learning projects' },
    { id: '5', name: 'React native' },
    { id: '6', name: 'Best songs' },
    // ... add more playlists
  ]

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.endsWith(' ')) {
      addTag(value)
    } else {
      setCurrentTag(value)
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(currentTag)
    }
  }

  const addTag = (value: string) => {
    const newTag = value.trim()
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
    }
    setCurrentTag('')
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const togglePlaylist = (playlistId: string) => {
    setSelectedPlaylists(prev => 
      prev.includes(playlistId)
        ? prev.filter(id => id !== playlistId)
        : [...prev, playlistId]
    )
  }

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(playlistSearch.toLowerCase())
  )

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`)
  }

  // const PlaylistSelector = React.memo(() => {
  //   const [isOpen, setIsOpen] = useState(false)

  //   useEffect(() => {
  //     const handleClickOutside = (event: MouseEvent) => {
  //       const target = event.target as HTMLElement
  //       if (!target.closest('[data-playlist-selector]')) {
  //         setIsOpen(false)
  //       }
  //     }

  //     if (isOpen) {
  //       document.addEventListener('mousedown', handleClickOutside)
  //       return () => document.removeEventListener('mousedown', handleClickOutside)
  //     }
  //   }, [isOpen])

  //   return (
  //     <div className="relative" data-playlist-selector>
  //       <Button
  //         variant="outline"
  //         className="w-full justify-start"
  //         onClick={() => setIsOpen(!isOpen)}
  //       >
  //         {selectedPlaylists.length > 0 
  //           ? `${selectedPlaylists.length} playlists selected`
  //           : "Select playlists"
  //         }
  //       </Button>

  //       {isOpen && (
  //         <Card className="absolute z-50 top-full left-0 right-0 mt-2 p-4 shadow-lg">
  //           <div className="space-y-4">
  //             <div className="relative">
  //               <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
  //               <Input
  //                 placeholder="Search for a playlist"
  //                 className="pl-8"
  //                 value={playlistSearch}
  //                 onChange={(e) => setPlaylistSearch(e.target.value)}
  //               />
  //             </div>

  //             <ScrollArea className="h-[300px] -mx-2 px-2">
  //               <div 
  //                 className={cn(
  //                   "cursor-pointer hover:bg-accent rounded-md p-2 -ml-2 -mr-2",
  //                   showNewPlaylistInput && "bg-accent"
  //                 )}
  //                 onClick={() => setShowNewPlaylistInput(true)}
  //               >
  //                 <div className="flex items-center space-x-2">
  //                   <Plus className="h-4 w-4" />
  //                   <span className="text-sm font-medium">New playlist</span>
  //                 </div>
  //               </div>

  //               {showNewPlaylistInput && (
  //                 <div className="mt-2 space-y-2 p-2 bg-accent rounded-md -mx-2">
  //                   <Input
  //                     placeholder="Enter playlist name"
  //                     value={newPlaylistName}
  //                     onChange={(e) => setNewPlaylistName(e.target.value)}
  //                     autoFocus
  //                     onKeyDown={(e) => {
  //                       if (e.key === 'Enter' && newPlaylistName.trim()) {
  //                         const newId = `new-${Date.now()}`
  //                         playlists.push({ id: newId, name: newPlaylistName.trim() })
  //                         setSelectedPlaylists(prev => [...prev, newId])
  //                         setNewPlaylistName('')
  //                       } else if (e.key === 'Escape') {
  //                         setShowNewPlaylistInput(false)
  //                         setNewPlaylistName('')
  //                       }
  //                     }}
  //                   />
  //                   <div className="flex gap-2">
  //                     <Button 
  //                       variant="default" 
  //                       size="sm"
  //                       onClick={() => {
  //                         if (newPlaylistName.trim()) {
  //                           const newId = `new-${Date.now()}`
  //                           playlists.push({ id: newId, name: newPlaylistName.trim() })
  //                           setSelectedPlaylists(prev => [...prev, newId])
  //                           setNewPlaylistName('')
  //                         }
  //                         setShowNewPlaylistInput(false)
  //                       }}
  //                     >
  //                       Create
  //                     </Button>
  //                     <Button 
  //                       variant="ghost" 
  //                       size="sm"
  //                       onClick={() => {
  //                         setShowNewPlaylistInput(false)
  //                         setNewPlaylistName('')
  //                       }}
  //                     >
  //                       Cancel
  //                     </Button>
  //                   </div>
  //                 </div>
  //               )}

  //               <div className="space-y-1 mt-2">
  //                 {filteredPlaylists.map((playlist) => (
  //                   <div
  //                     key={playlist.id}
  //                     className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md -mx-2"
  //                   >
  //                     <Checkbox
  //                       id={playlist.id}
  //                       checked={selectedPlaylists.includes(playlist.id)}
  //                       onCheckedChange={() => togglePlaylist(playlist.id)}
  //                     />
  //                     <label
  //                       htmlFor={playlist.id}
  //                       className="flex-grow text-sm font-medium cursor-pointer"
  //                     >
  //                       {playlist.name}
  //                     </label>
  //                   </div>
  //                 ))}
  //               </div>
  //             </ScrollArea>

  //             <div className="flex justify-end pt-2 border-t">
  //               <Button 
  //                 variant="default" 
  //                 size="sm"
  //                 onClick={() => setIsOpen(false)}
  //               >
  //                 Done
  //               </Button>
  //             </div>
  //           </div>
  //         </Card>
  //       )}
  //     </div>
  //   )
  // })

  return (
    <div className="container mx-auto p-6">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Video Details */}
            <div className="md:col-span-2 space-y-6">
              <Card className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input 
                    placeholder="Add a title that describes your video" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea 
                    placeholder="Tell viewers about your video"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Playlists</label>
                  <PlaylistSelector />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <Input 
                    placeholder="Add tags (space or enter after each tag)"
                    value={currentTag}
                    onChange={handleTagInput}
                    onKeyDown={handleTagKeyDown}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge 
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Preview & Settings */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="aspect-video bg-slate-200 mb-4">
                  {/* Video Preview */}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Visibility</label>
                    <Select value={visibility} onValueChange={(value: Visibility) => setVisibility(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                        <SelectItem value="UNLISTED">Unlisted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Subtitles</label>
                    <div className="text-sm text-gray-500">
                      No subtitles available
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Analytics</h2>
            <p>Analytics content will go here</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default VideoDetailsPage