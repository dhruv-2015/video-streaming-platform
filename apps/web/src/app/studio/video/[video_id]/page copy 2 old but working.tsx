"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
// import { PlaylistSelector } from "./PlaylistSelector"
import Analytics from "./Analytics";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlaylistSelector } from "@/components/PlaylistSelector/page";

type Visibility = "PUBLIC" | "PRIVATE" | "UNLISTED";

const VideoDetailsPage = ({ params }: { params: { video_id: string } }) => {
  const router = useRouter();
  const { video_id } = params;

  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "details";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("UNLISTED");
  const [currentTag, setCurrentTag] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState<Date | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [showThumbnailDialog, setShowThumbnailDialog] = useState(false);



  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(" ")) {
      addTag(value);
    } else {
      setCurrentTag(value);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(currentTag);
    }
  };

  const addTag = (value: string) => {
    const newTag = value.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setCurrentTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };


  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  const handlePublishToggle = (checked: boolean) => {
    if (checked) {
      // Show confirmation dialog before publishing
      if (window.confirm("Are you sure you want to publish this video?")) {
        setIsPublished(true);
        setPublishedAt(new Date());
      }
    } else {
      // Show confirmation dialog before unpublishing
      if (window.confirm("Are you sure you want to unpublish this video?")) {
        setIsPublished(false);
      }
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setThumbnail(objectUrl);
      setShowThumbnailDialog(false);

      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
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
                  <label className="text-sm font-medium mb-2 block">
                    Title
                  </label>
                  <Input
                    placeholder="Add a title that describes your video"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Tell viewers about your video"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Thumbnail</label>
                  <p className="text-sm text-muted-foreground">
                    Select or upload a picture that shows what's in your video
                  </p>

                  <div className="border rounded-lg p-4">
                    {thumbnail ? (
                      <div className="space-y-4">
                        <div className="relative aspect-video w-[320px] overflow-hidden rounded-lg border bg-muted">
                          <Image
                            src={thumbnail}
                            alt="Video thumbnail"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Dialog
                          open={showThumbnailDialog}
                          onOpenChange={setShowThumbnailDialog}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-[320px]">
                              Change thumbnail
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Upload thumbnail</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center justify-center w-full">
                                <label
                                  htmlFor="thumbnail-upload"
                                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/60"
                                >
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                      <span className="font-semibold">
                                        Click to upload
                                      </span>{" "}
                                      or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      PNG, JPG or WEBP (MAX. 2MB)
                                    </p>
                                  </div>
                                  <input
                                    id="thumbnail-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleThumbnailUpload}
                                  />
                                </label>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ) : (
                      <Dialog
                        open={showThumbnailDialog}
                        onOpenChange={setShowThumbnailDialog}
                      >
                        <DialogTrigger asChild>
                          <div className="flex flex-col items-center justify-center w-[320px] h-44 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/60">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">
                                  Click to upload
                                </span>{" "}
                                or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PNG, JPG or WEBP (MAX. 2MB)
                              </p>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload thumbnail</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center justify-center w-full">
                              <label
                                htmlFor="thumbnail-upload"
                                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/60"
                              >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                  <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">
                                      Click to upload
                                    </span>{" "}
                                    or drag and drop
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    PNG, JPG or WEBP (MAX. 2MB)
                                  </p>
                                </div>
                                <input
                                  id="thumbnail-upload"
                                  type="file"
                                  className="hidden"
                                  accept="image/png,image/jpeg,image/webp"
                                  onChange={handleThumbnailUpload}
                                />
                              </label>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Playlists
                  </label>
                  <PlaylistSelector 
                    video_id={video_id?.toString()!}
                  />
                  {/* <PlaylistSelector video_id={video_id?.toString()!} /> */}
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
                    {tags.map(tag => (
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

                <div className="space-y-6">
                  {/* Publish Switch */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="publish" className="font-medium">
                        {isPublished ? "Published" : "Draft"}
                      </Label>
                      <Switch
                        id="publish"
                        checked={isPublished}
                        onCheckedChange={handlePublishToggle}
                      />
                    </div>

                    {isPublished && publishedAt && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Published</AlertTitle>
                        <AlertDescription>
                          This video was published on{" "}
                          {publishedAt.toLocaleDateString()} at{" "}
                          {publishedAt.toLocaleTimeString()}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Visibility Selector */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Visibility
                    </label>
                    <Select
                      value={visibility}
                      onValueChange={(value: Visibility) =>
                        setVisibility(value)
                      }
                      disabled={!isPublished} // Disable visibility selection when not published
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                        <SelectItem value="UNLISTED">Unlisted</SelectItem>
                      </SelectContent>
                    </Select>
                    {!isPublished && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Publish the video to change visibility
                      </p>
                    )}
                  </div>

                  {/* Subtitles section remains the same */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Subtitles
                    </label>
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
          <Analytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoDetailsPage;
