"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormEvent, useState } from "react";
import { isTRPCClientError, trpcClient } from "@/trpc/client";
import { trpc as trpcQuery } from "@/trpc/client";
import { useDispatch } from "react-redux";
import { setChannelId } from "@/redux/features/user/userSlice";
import { useRouter } from "next/navigation";
// import { useRouter } from "next/router";

export const CreateChannelForm = () => {
  const router = useRouter()
  const SlugLength=6;
  const dispatch = useDispatch()
  const [channelData, setChannelData] = useState({
    name: "",
    description: "",
  });
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  const {data: dataSlug, isLoading: isLoadingSlug} = trpcQuery.studio.channel.checkChannelSlug.useQuery({ slug }, {
    enabled: slug.length >= SlugLength,
    staleTime: 500 
  });
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (dataSlug?.available === false) {
      return;
    }
    //   onSubmit(channelData);
    try {
      const channel =  await trpcClient.studio.channel.createChannel.mutate({
        name: channelData.name,
        description: channelData.description,
        slug: slug,
      });
      dispatch(setChannelId(channel.id))
      router.refresh()

    } catch (err) {
        if (isTRPCClientError(err)) {
          setError(err.message)
        } 
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create Your Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel Name</label>
              <Input
                value={channelData.name}
                onChange={e =>
                  setChannelData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter channel name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel Slug</label>
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="Enter channel slug (min 6 characters)"
                required
                minLength={SlugLength}
                className={`${
                  slug.length >= 6
                    ? dataSlug?.available
                      ? "border-green-500 focus:ring-green-500"
                      : "border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {slug.length >= 6 && !isLoadingSlug && (
                <span className={`text-sm ${
                  dataSlug?.available
                    ? "text-green-500"
                    : "text-red-500"
                }`}>
                  {dataSlug?.available
                    ? "Slug is available!"
                    : "Slug is already taken"}
                </span>
              )}
              {slug.length > 0 && slug.length < 6 && (
                <span className="text-sm text-red-500">
                  Slug must be at least 6 characters long
                </span>
              )}
              {/* {isLoadingSlug && slug.length >= 6 && (
                <span className="text-sm text-blue-500">
                  Checking slug availability...
                </span>
              )} */}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel Description</label>
              <Textarea
                value={channelData.description}
                onChange={e =>
                  setChannelData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe your channel"
                required
                rows={4}
              />
            </div>
            {error != "" && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full"
              disabled={slug.length < 6 || !dataSlug?.available}
            >
              Create Channel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
