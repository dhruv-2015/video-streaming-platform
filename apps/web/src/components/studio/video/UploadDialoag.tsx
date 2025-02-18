"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button"
import { UploadDialog } from "../UploadVideoDialog";

export function UploadDialoag() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="ml-auto">
      <Button onClick={() => setOpen(true)} className="ml-4">
        <Upload className="mr-2 h-4 w-4" />
        Upload
      </Button>
      <UploadDialog open={open} onOpenChange={setOpen}/>
    </div>
  );
}