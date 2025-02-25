"use client"

import { Button } from "@/components/ui/button"
import { isTRPCClientError } from "@/trpc/client"
import { AlertCircle } from "lucide-react"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  const message = isTRPCClientError(error) ? error.data?.message ?? error.message : error.message ?? "Internal Server Error"

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <h2 className="text-lg font-semibold">{message??"Internal Server Error"}</h2>
      </div>
      {/* <p className="text-muted-foreground">Something went wrong on our end. Please try again.</p> */}
      <Button 
        variant="outline"
        onClick={() => reset()}
      >
        Try again
      </Button>
    </div>
  )
}
