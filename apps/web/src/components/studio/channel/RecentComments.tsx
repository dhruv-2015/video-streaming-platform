import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react'


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
  { id: 11, author: "John Doe", comment: "Great content!", time: "2 hours ago" },
  {
    id: 22,
    author: "Jane Smith",
    comment: "Very helpful video",
    time: "5 hours ago",
  },
  { id: 33, author: "John Doe", comment: "Great content!", time: "2 hours ago" },
  {
    id: 44,
    author: "Jane Smith",
    comment: "Very helpful video",
    time: "5 hours ago",
  },
  { id: 55, author: "John Doe", comment: "Great content!", time: "2 hours ago" },
  {
    id: 66,
    author: "Jane Smith",
    comment: "Very helpful video",
    time: "5 hours ago",
  },
  ];


const RecentComments = async () => {
  return (
    <Card>
            <CardHeader>
              <CardTitle>Recent Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 h-52  pr-3">
              <ScrollArea className='overflow-auto max-h-[350px] px-2'>

                {recentComments.length == 0 && (
                  <div className="space-y-1 flex justify-center items-center pt-5">
                    no comments found
                  </div>
                )}
                {recentComments.map(comment => (
                  <div key={comment.id} className="space-y-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{comment.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {comment.time}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {comment.comment}
                    </p>
                  </div>
                ))}
              </ScrollArea>
              </div>
            </CardContent>
          </Card>
  )
}

export default RecentComments