import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ];


const RecentComments = async () => {
  return (
    <Card>
            <CardHeader>
              <CardTitle>Recent Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 h-52 overflow-auto pr-3">
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
              </div>
            </CardContent>
          </Card>
  )
}

export default RecentComments