"use client";

import React, { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Settings, Bell, Edit2 } from "lucide-react";
import { UploadDialog } from "@/components/studio/UploadVideoDialog";
import { trpc } from "@/trpc/client";
// import {trpc} from "@/trpc/server"

// Sample channel data - in real app, this would come from your API/database
const userChannel = {
  hasChannel: true, // Set this to false to see the create channel form
  name: "Tech Tutorials",
  description: "Sharing the latest in technology and programming tutorials",
  stats: {
    totalViews: 12500,
    totalSubscribers: 850,
    totalVideos: 25,
  },
};

const recentComments = [
  { id: 1, author: "John Doe", comment: "Great content!", time: "2 hours ago" },
  {
    id: 2,
    author: "Jane Smith",
    comment: "Very helpful video",
    time: "5 hours ago",
  },
  { id: 3, author: "John Doe", comment: "Great content!", time: "2 hours ago" },
  {
    id: 4,
    author: "Jane Smith",
    comment: "Very helpful video",
    time: "5 hours ago",
  },
  { id: 5, author: "John Doe", comment: "Great content!", time: "2 hours ago" },
  {
    id: 6,
    author: "Jane Smith",
    comment: "Very helpful video",
    time: "5 hours ago",
  },
];

const recentSubscribers = [
  { id: 1, name: "Tech Enthusiast", subscribedDate: "1 day ago" },
  { id: 2, name: "Creative Mind", subscribedDate: "2 days ago" },
  { id: 3, name: "Tech Enthusiast", subscribedDate: "1 day ago" },
  { id: 4, name: "Creative Mind", subscribedDate: "2 days ago" },
  { id: 5, name: "Tech Enthusiast", subscribedDate: "1 day ago" },
  { id: 6, name: "Creative Mind", subscribedDate: "2 days ago" },
];

const CreateChannelForm = ({
  onSubmit,
}: {
  onSubmit: (data: { name: string; description: string }) => void;
}) => {
  const [channelData, setChannelData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(channelData);
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
            <Button type="submit" className="w-full">
              Create Channel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// export default function StudioDashboard() {
//   const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);

//   trpc.studio.channel.
  
//   const [channelData, setChannelData] = useState({
//     name: userChannel.name,
//     description: userChannel.description,
//   });

//   const handleCreateChannel = (data: { name: string; description: string }) => {
//     // Handle channel creation - in real app, this would make an API call
//     console.log("Creating channel:", data);
//   };

//   const handleUpdateChannel = () => {
//     // Handle channel update - in real app, this would make an API call
//     console.log("Updating channel:", channelData);
//     setIsEditing(false);
//   };

//   if (!userChannel.hasChannel) {
//     return <CreateChannelForm onSubmit={handleCreateChannel} />;
//   }

//   return (
//     <div className="min-h-screen bg-background p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">Channel Dashboard</h1>
//         {/* <div className="flex gap-4">
//           <Button variant="outline" size="icon">
//             <Bell className="h-4 w-4" />
//           </Button>
//           <Button variant="outline" size="icon">
//             <Settings className="h-4 w-4" />
//           </Button>
//         </div> */}
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {/* Channel Overview */}
//         <Card className="col-span-1 md:col-span-2 lg:col-span-1">
//           <CardHeader className="flex flex-row items-center justify-between">
//             <CardTitle>Channel Details</CardTitle>
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => setIsEditing(!isEditing)}
//             >
//               <Edit2 className="h-4 w-4" />
//             </Button>
//           </CardHeader>
//           <CardContent>
//             {isEditing ? (
//               <div className="space-y-4">
//                 <div>
//                   <label className="text-sm font-medium">Channel Name</label>
//                   <Input
//                     value={channelData.name}
//                     onChange={e =>
//                       setChannelData(prev => ({
//                         ...prev,
//                         name: e.target.value,
//                       }))
//                     }
//                     className="mt-1"
//                   />
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium">Description</label>
//                   <Textarea
//                     value={channelData.description}
//                     onChange={e =>
//                       setChannelData(prev => ({
//                         ...prev,
//                         description: e.target.value,
//                       }))
//                     }
//                     className="mt-1"
//                     rows={4}
//                   />
//                 </div>
//                 <Button onClick={handleUpdateChannel}>Save Changes</Button>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 <div>
//                   <h3 className="font-medium">Channel Name</h3>
//                   <p className="text-muted-foreground">{channelData.name}</p>
//                 </div>
//                 <div>
//                   <h3 className="font-medium">Description</h3>
//                   <p className="text-muted-foreground">
//                     {channelData.description}
//                   </p>
//                 </div>
//                 <div className="grid grid-cols-3 gap-4 pt-4">
//                   <div>
//                     <p className="text-2xl font-bold">
//                       {userChannel.stats.totalViews}
//                     </p>
//                     <p className="text-sm text-muted-foreground">Total Views</p>
//                   </div>
//                   <div>
//                     <p className="text-2xl font-bold">
//                       {userChannel.stats.totalSubscribers}
//                     </p>
//                     <p className="text-sm text-muted-foreground">Subscribers</p>
//                   </div>
//                   <div>
//                     <p className="text-2xl font-bold">
//                       {userChannel.stats.totalVideos}
//                     </p>
//                     <p className="text-sm text-muted-foreground">Videos</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Upload Section */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Upload Video</CardTitle>
//           </CardHeader>
//           <CardContent className="flex flex-col items-center justify-center space-y-4">
//             <UploadCloud className="h-24 w-24 text-muted-foreground" />
//             <Button onClick={() => setUploadDialogOpen(true)}>
//               <UploadCloud className="mr-2 h-4 w-4" />
//               Upload Video
//             </Button>
//           </CardContent>
//         </Card>

//         {/* Recent Comments */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Recent Comments</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4 h-52 overflow-auto pr-3">
//               {recentComments.length == 0 && (
//                 <div className="space-y-1 flex justify-center items-center pt-5">
//                   no comments found
//                 </div>
//               )}
//               {recentComments.map(comment => (
//                 <div key={comment.id} className="space-y-1">
//                   <div className="flex justify-between">
//                     <p className="font-medium">{comment.author}</p>
//                     <p className="text-xs text-muted-foreground">
//                       {comment.time}
//                     </p>
//                   </div>
//                   <p className="text-sm text-muted-foreground">
//                     {comment.comment}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//         {/* Recent Subscribers */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Recent Subscribers</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4 h-52 overflow-auto">
//               {recentSubscribers.map(sub => (
//                 <div key={sub.id} className="flex items-center space-x-4">
//                   <div className="w-8 h-8 rounded-full bg-accent" />
//                   <div>
//                     <p className="font-medium">{sub.name}</p>
//                     <p className="text-xs text-muted-foreground">
//                       {sub.subscribedDate}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <UploadDialog
//         open={uploadDialogOpen}
//         onOpenChange={setUploadDialogOpen}
//       />
//     </div>
//   );
// }
