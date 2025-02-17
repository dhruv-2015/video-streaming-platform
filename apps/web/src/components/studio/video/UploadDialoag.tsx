"use client";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { UploadDialog } from "@/components/studio/UploadVideoDialog";
import { useState } from "react";

export function UploadDialoag() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  return (
    <>
      <Button
        className="ml-auto"
        size="sm"
        onClick={() => setUploadDialogOpen(true)}
      >
        <Upload className="mr-2 h-4 w-4" /> Upload video
      </Button>
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </>
  );
}
