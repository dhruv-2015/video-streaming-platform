"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, Upload, X } from "lucide-react";
import React, { useState, useRef } from "react";
import { RouterOutputs } from "@workspace/trpc";
import { trpcClient } from "@/trpc/client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const ChannelInfoCard = ({
  channel,
}: {
  channel: RouterOutputs["studio"]["channel"]["getMychannel"];
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [channelData, setChannelData] = useState({
    name: channel.name,
    description: channel.description ?? "",
    image: channel.image ?? "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateChannel = async () => {
    try {
      await trpcClient.studio.channel.updateChannel.mutate({
        description: channelData.description,
        name: channelData.name,
      });
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update channel");
      console.error("Error updating channel:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (e.g., 5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      alert("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("File must be an image");
      return;
    }

    try {
      // Get presigned URL
      const { url, file_id } = await trpcClient.studio.channel.generatePresignedUrlForChannelImage.query({
        name: file.name,
        size: file.size,
      });

      // Upload to storage using presigned URL
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      // Notify backend about successful upload
      const image = await trpcClient.studio.channel.uploadChannelImage.mutate({
        file_id,
      });

      // Update local state with the new image URL
      setChannelData(prev => ({
        ...prev,
        image: image.image,
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    }
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Channel Details</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <X className="h-4 w-4" />
          ) : (
            <Edit2 className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="relative h-32 w-32 rounded-full overflow-hidden">
                <Image
                  src={channelData.image || "/default-channel-image.png"}
                  alt="Channel image"
                  fill
                  className="object-cover"
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium">Channel Name</label>
              <Input
                value={channelData.name}
                onChange={e =>
                  setChannelData(prev => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={channelData.description}
                onChange={e =>
                  setChannelData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="mt-1"
                rows={4}
              />
            </div>
            <Button onClick={handleUpdateChannel}>Save Changes</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center mb-6">
              <div className="relative h-32 w-32 rounded-full overflow-hidden">
                <Image
                  src={channel.image || "/default-channel-image.png"}
                  alt="Channel image"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="font-medium">Channel Name</h3>
              <p className="text-muted-foreground">{channel.name}</p>
            </div>
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground">{channel.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div>
                <p className="text-2xl font-bold">{channel.stats.totalViews}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {channel.stats.totalSubscribers}
                </p>
                <p className="text-sm text-muted-foreground">Subscribers</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {channel.stats.totalVideos}
                </p>
                <p className="text-sm text-muted-foreground">Videos</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChannelInfoCard;

