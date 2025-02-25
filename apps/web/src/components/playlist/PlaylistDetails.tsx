import { useState, useEffect } from "react";
import Image from "next/image";

interface PlaylistDetails {
  title: string;
  description: string;
  isPrivate: boolean;
  videoCount: number;
  thumbnailUrl: string;
}

export default function PlaylistDetails({ playlistId }: { playlistId: string }) {
  const [details, setDetails] = useState<PlaylistDetails | null>(null);

  // TODO: Replace with actual API call
  useEffect(() => {
    // Fetch playlist details
  }, [playlistId]);

  if (!details) return <div>Loading...</div>;

  return (
    <div className="rounded-lg bg-gray-900 p-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        <Image
          src={details.thumbnailUrl}
          alt={details.title}
          fill
          className="object-cover"
        />
      </div>
      
      <h1 className="mt-4 text-2xl font-bold">{details.title}</h1>
      
      <div className="mt-2 text-gray-400">
        {details.videoCount} videos
        <span className="mx-2">•</span>
        {details.isPrivate ? "Private" : "Public"}
      </div>
      
      <p className="mt-4 text-gray-300">{details.description}</p>
    </div>
  );
} 