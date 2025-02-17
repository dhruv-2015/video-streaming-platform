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

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [step, setStep] = React.useState<"upload" | "details">("upload");
  const [error, setError] = React.useState<string>();
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [videoId, setVideoId] = React.useState<string>();
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

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
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      handleFileSelect(file);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    abortControllerRef.current = new AbortController();
    let video_id = null;
    try {
      const videoCreated = await trpcClient.studio.video.createVideo.mutate(
        {
          title: file.name.replace(/\.[^/.]+$/, ""),
        },
        { signal: abortControllerRef.current.signal },
      );
      video_id = videoCreated.id;
      setVideoId(videoCreated.id);
    } catch (error) {
      if (isTRPCClientError(error)) {
        console.log(error);
        // `cause` is now typed as your router's `TRPCClientError`
        console.log("data", error.data);
      } else {
        // [...]
      }
    }

    const fileCreated = await trpcClient.studio.video.getPresignedUrlForVideo.query(
      {
        file_name: file.name,
        file_size: file.size,
        video_id: video_id!,
      },
      {
        signal: abortControllerRef.current.signal,
      },
    );

    setSelectedFile(file);
    setUploading(true);
    setStep("details");
    setProgress(0);

    console.log(file, "file");
    try {
      await axios.put(fileCreated.url, file, {
        onUploadProgress(progressEvent) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total!,
          );
          setProgress(progress);
        },
        signal: abortControllerRef.current.signal,
      });
    } catch (error: any) {
      setError(error.message);
      setUploading(false);
      return;
    }

    setUploading(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    onOpenChange(false);
    setSelectedFile(null);
    setStep("upload");
    router.refresh();
  };

  const handelClose = (state: boolean) => {
    if (state) {
      onOpenChange(true);
    } else {
      if (videoId && progress < 100) {
        cancelUpload();
      }
      setError(undefined);
      onOpenChange(false);
      setSelectedFile(null);
      setStep("upload");
    }
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
            </div>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="details">Details</TabsTrigger>
                {/* <TabsTrigger value="elements">Video elements</TabsTrigger>
                <TabsTrigger value="checks">Checks</TabsTrigger>
                <TabsTrigger value="visibility">Visibility</TabsTrigger> */}
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (required)</Label>
                    <Input
                      id="title"
                      value={selectedFile?.name.replace(/\.[^/.]+$/, "")}
                      placeholder="Add a title that describes your video"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell viewers about your video (use markdown for formatting)"
                      className="min-h-[150px]"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label>Thumbnail</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <Button variant="outline" className="h-24 justify-start">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload thumbnail
                      </Button>
                      {/* <div className="h-24 rounded-lg border bg-muted" />
                      <div className="h-24 rounded-lg border bg-muted" /> */}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => handelClose(false)}>
                    Back
                  </Button>
                  <Button type="submit">Next</Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
