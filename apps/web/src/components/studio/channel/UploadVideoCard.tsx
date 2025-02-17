"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";
import React, { useState } from "react";
import { UploadDialog } from "../UploadVideoDialog";

const UploadVideoCard = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Upload Video</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <UploadCloud className="h-24 w-24 text-muted-foreground" />
          <Button onClick={() => setUploadDialogOpen(true)}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Video
          </Button>
        </CardContent>
      </Card>

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </>
  );
};

export default UploadVideoCard;
