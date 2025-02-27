"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { isTRPCClientError, trpcClient } from "@/trpc/client";
import {signOut} from "next-auth/react";
import axios from "axios";

export function ProfileForm() {
  const user = useSelector((state: RootState) => state.user);
  if (user.isLoggedin === false) {
    signOut();
    return null;
  }
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const { toast } = useToast();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUpdatingImage(true);
      try {
        const {url, fileId} = await trpcClient.user.getPreSignedUrlForImage.mutate({
          image_name: file.name,
          image_size: file.size,
        })
        
        await axios.put(url, file, {
          headers: {
            'Content-Type': file.type,
          },
        })
        
        await trpcClient.user.updateImage.mutate({
          fileId: fileId,
        })
        
        const imageUrl = URL.createObjectURL(file);
        setImage(imageUrl);
        
        toast({
          title: "Success",
          description: "Your profile image has been updated successfully.",
        });
      } catch (error) {
        if (isTRPCClientError(error)) {
          toast({
            title: "Error updating image",
            description: error.message,
            variant: "destructive",
          });
        } else if (axios.isAxiosError(error)) {
          toast({
            title: "Error updating image",
            description: `${error.response?.statusText} - ${error.response?.data.message}`,
            variant: "destructive",
          });
        }
      } finally {
        setIsUpdatingImage(false);
      }
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingName(true);
    try {
      await trpcClient.user.updateName.mutate({ name });
      toast({
        title: "Success",
        description: "Your name has been updated successfully.",
      });
    } catch (error) {
      if (isTRPCClientError(error)) {
        toast({
          title: "Error updating name",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsUpdatingName(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Image Section */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-32 h-32">
            <AvatarImage src={image} alt="Profile picture" />
            <AvatarFallback>
              {name
                .split(" ")
                .map(n => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center">
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              id="profile-image"
              onChange={handleImageChange}
              disabled={isUpdatingImage}
            />
            <Label
              htmlFor="profile-image"
              className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${
                isUpdatingImage ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUpdatingImage ? "Uploading..." : "Change Image"}
            </Label>
          </div>
        </div>

        {/* Name Section */}
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="flex space-x-2">
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={isUpdatingName}
              />
              <Button type="submit" disabled={isUpdatingName} loading={isUpdatingName}>
                Update Name
              </Button>
            </div>
          </div>
        </form>

        {/* Email Section */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="bg-muted"
          />
        </div>
      </CardContent>
    </Card>
  );
}
