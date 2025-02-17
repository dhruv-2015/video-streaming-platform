"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, X } from "lucide-react";
import React, { useState } from "react";
import { RouterOutputs } from "@workspace/trpc";
import { trpcClient } from "@/trpc/client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const ChannelInfoCard = ({
  channel,
}: {
  channel: RouterOutputs["studio"]["channel"]["getMychannel"];
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [channelData, setChannelData] = useState({
    name: channel.name,
    description: channel.description ?? "",
  });

  const handleUpdateChannel = () => {
    // Handle channel update - in real app, this would make an API call
    trpcClient.studio.channel.updateChannel.mutate({
      description: channelData.description,
      name: channelData.name,
    });
    console.log("Updating channel:", channelData);

    setIsEditing(false);
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
