import { VideoTable } from "@/components/studio/video/VideoTable";
import { UploadDialoag } from "@/components/studio/video/UploadDialoag";

export default function StudioVideoPage() {
  
  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-lg font-semibold">Channel content</h1>
            <UploadDialoag />
          </div>
        </div>
        <div className="p-4">
          <VideoTable />
        </div>
      </main>
    </div>
  );
}
