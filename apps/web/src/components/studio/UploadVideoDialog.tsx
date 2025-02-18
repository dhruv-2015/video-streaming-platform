"use client";
import * as React from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { isTRPCClientError, trpcClient } from "@/trpc/client";
import axios, { AxiosError } from "axios";
import { title } from "process";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [step, setStep] = React.useState<"upload" | "details">("upload");
  const [error, setError] = React.useState<string>();
  const [videoDetails, setVideoDetails] = React.useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "sxaX",
  });
  const [thumbnailError, setThumbnailError] = React.useState<string>();
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [videoId, setVideoId] = React.useState<string>();
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [thumbnailSelectedFile, setThumbnailSelectedFile] =
    React.useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (selectedFile) {
      setVideoDetails(pre => ({
        ...pre,
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
      }))
    }
  },[selectedFile])

  const cancelUpload = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      try {
        await trpcClient.studio.video.deleteVideo.mutate({
          video_id: videoId!,
        });
      } catch (error) {
        isTRPCClientError(error) && console.log(error.data);
      }
      setError("Upload cancelled");
      setUploading(false);
    }
  };

  const onDrop = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError("");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      handleFileSelect(file);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    setError("");
    setSelectedFile(file);
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    } 
    let video_id = videoId;
    if (!video_id) {
      try {
        const videoCreated = await trpcClient.studio.video.createVideo.mutate(
          {
            title: file.name.replace(/\.[^/.]+$/, ""),
          },
          { signal: abortControllerRef.current.signal },
        );
        video_id = videoCreated.id;
        setVideoId(videoCreated.id);
      } catch (error: any) {
        if (isTRPCClientError(error)) {
          console.log(error);
          // `cause` is now typed as your router's `TRPCClientError`
          console.log("data", error.data);
          setError(error.message);
        } else {
          // [...]
          setError(error.message);
        }
        return;
      }
    }

    setUploading(true);
    setStep("details");
    setProgress(0);

    console.log(file, "file");
    try {
      const fileCreated =
        await trpcClient.studio.video.getPresignedUrlForVideo.query(
          {
            file_name: file.name,
            file_size: file.size,
            video_id: video_id,
          },
          {
            signal: abortControllerRef.current.signal,
          },
        );
      await axios.put(fileCreated.url, file, {
        headers: {
          "content-type": file.type,
        },
        onUploadProgress(progressEvent) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total!,
          );
          setProgress(progress);
        },
        signal: abortControllerRef.current.signal,
      });
      setProgress(100);
      await trpcClient.studio.video.verifyVideoUpload.query({
        video_id: video_id,
        fileId: fileCreated.fileId,
      });
    } catch (error: any) {
      if (isTRPCClientError(error)) {
        console.log(error);
        // `cause` is now typed as your router's `TRPCClientError`
        console.log("data", error.data?.message);
        setError(error.data?.message ?? error.message);
      } else {
        setError(error.message);
      }
      return;
    }

    setUploading(false);
    return;

    // // Simulate upload progress
    // let progress = 0;
    // const interval = setInterval(() => {
    //     progress += 5;
    //     setProgress(progress);
    //     if (progress === 100) {
    //         clearInterval(interval);
    //     setUploading(false);
    //   }
    // }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (videoId && progress < 100) {
      return;
    }

    await trpcClient.studio.video.updateVideo.mutate({
      description: videoDetails.description,
      title: videoDetails.title,
      video_id: videoId!,
    })
    // Handle form submission
    onOpenChange(false);
    setVideoId(undefined);
    setError(undefined)
    setSelectedFile(null);
    setThumbnailPreview(null);
    setThumbnailError(undefined)

    router.refresh();
  };

  const handelClose = (state: boolean) => {
    router.refresh();
    setVideoId(undefined);
    setError(undefined)
    setSelectedFile(null);
    setThumbnailPreview(null);
    setThumbnailError(undefined)
    if (state) {
      onOpenChange(true);
    } else {
      if (videoId && progress < 100) {
        cancelUpload();
      }
      
      onOpenChange(false);
      
      setStep("upload");
    }
  };

  const onThumbnailDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handelThumbnailSelectFile(file);
    }
  };
  const handelThumbnailSelectFile = async (file?: File) => {
    if (!file) {
      return;
    }
    console.log(file, "file");
    setThumbnailError(undefined);
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }
    setThumbnailSelectedFile(file);
    
    
    // Create preview URL for the thumbnail
    const previewUrl = URL.createObjectURL(file);
    

    try {
      const presignUrl = await trpcClient.studio.video.getPreSignedUrlForThumbnail.query(
        {
          file_name: file.name,
          file_size: file.size,
          video_id: videoId!,
        },
        { signal: abortControllerRef.current.signal },
      );
  
      await axios.put(presignUrl.url, file, {
        headers: {
          "content-type": file.type,
        },
        signal: abortControllerRef.current.signal,
      });
      await trpcClient.studio.video.uploadThumbnail.mutate({
        video_id: videoId!,
        fileId: presignUrl.fileId,
      });
    } catch (error) {
      setThumbnailError("Failed to upload thumbnail");
    }
    setThumbnailPreview(previewUrl);
  };

  return (
    <Dialog open={open} onOpenChange={handelClose}>
      <DialogContent className="sm:max-w-[800px]">
        {step === "upload" ? (
          <>
            <DialogHeader>
              <DialogTitle>Upload videos</DialogTitle>
            </DialogHeader>
            <div
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12"
            >
              {/* <div className=""></div> */}
              <div className="rounded-full bg-muted p-6">
                <Upload className="h-10 w-10" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">
                  Drag and drop video files to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  Your videos will be private until you publish them.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="video/*"
                className="hidden"
                onChange={e =>
                  e.target.files?.[0] && handleFileSelect(e.target.files[0])
                }
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                Select files
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {selectedFile?.name.length! > 75
                  ? selectedFile?.name.substring(0, 75) + "..."
                  : selectedFile?.name}
              </DialogTitle>
            </DialogHeader>
            <div>
              {uploading && progress <= 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      uploading{" "}
                      {selectedFile?.name.length! > 80
                        ? selectedFile?.name.substring(0, 80) + "..."
                        : selectedFile?.name}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
              {error && (
                <>
                  <div className="text-red-500 text-sm mt-4">{error}</div>
                  {selectedFile && (
                    <Button onClick={() => handleFileSelect(selectedFile)}>
                      Retry
                    </Button>
                  )}
                </>
              )}
            </div>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (required)</Label>
                    <Input
                      id="title"
                      value={videoDetails['title']}
                      onChange={(e) => setVideoDetails({ ...videoDetails, title: e.target.value })}
                      placeholder="Add a title that describes your video"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      value={videoDetails['description']}
                      onChange={(e) => setVideoDetails({ ...videoDetails, description: e.target.value })}
                      id="description"
                      placeholder="Tell viewers about your video (use markdown for formatting)"
                      className="min-h-[150px]"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label>Thumbnail</Label>
                    <div
                      className="grid grid-cols-3 gap-4"
                      onDrop={onThumbnailDrop}
                      onDragOver={e => e.preventDefault()}
                    >
                      <input
                        type="file"
                        ref={thumbnailInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={e =>
                          handelThumbnailSelectFile(e.target.files?.[0]!)
                          // console.log(e.target.files?.[0], "file")
                        }
                      />
                      <Button
                        variant="outline"
                        className="h-24 justify-start relative overflow-hidden"
                        onClick={() => thumbnailInputRef.current?.click()}
                      >
                        {thumbnailPreview && (
                          <>
                            <div 
                              className="absolute inset-0 bg-cover bg-center opacity-80"
                              style={{ backgroundImage: `url(${thumbnailPreview})` }}
                            />
                            <div className="absolute top-1 right-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await trpcClient.studio.video.deleteThumbnail.mutate({ video_id: videoId! });
                                    setThumbnailPreview(null);
                                  } catch (error) {
                                    setThumbnailError("Failed to delete thumbnail");
                                  }
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          </>
                        )}
                        <div className="relative z-10 flex items-center">
                          <Upload className="mr-2 h-4 w-4" />
                          {thumbnailPreview ? 'Change thumbnail' : 'Upload thumbnail'}
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => handelClose(false)}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={progress < 100}
                    onClick={handleSubmit}
                  >
                    done
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
