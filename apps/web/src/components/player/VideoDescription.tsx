"use client"
import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Markdown from 'markdown-to-jsx'
import { fixNumber } from '@/lib/utils'

interface VideoDescriptionProps {
  description: string
  views: number
  uploadDate: Date
}

export function VideoDescription({ description, views, uploadDate }: VideoDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-muted/30 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground">{fixNumber(views)} views</span>
        <span>•</span>
        <span className="text-muted-foreground">{uploadDate.toLocaleDateString()}</span>
      </div>
      <div className={`${!isExpanded && 'line-clamp-2'}`}>
        <Markdown>{description}</Markdown>
      </div>
      <Button 
        variant="ghost" 
        className="mt-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <>Show less <ChevronUp className="ml-2 h-4 w-4" /></>
        ) : (
          <>Show more <ChevronDown className="ml-2 h-4 w-4" /></>
        )}
      </Button>
    </div>
  )
}