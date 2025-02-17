import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

const recentSubscribers = [
    { id: 1, name: "Tech Enthusiast", subscribedDate: "1 day ago" },
    { id: 2, name: "Creative Mind", subscribedDate: "2 days ago" },
    { id: 3, name: "Tech Enthusiast", subscribedDate: "1 day ago" },
    { id: 4, name: "Creative Mind", subscribedDate: "2 days ago" },
    { id: 5, name: "Tech Enthusiast", subscribedDate: "1 day ago" },
    { id: 6, name: "Creative Mind", subscribedDate: "2 days ago" },
  ];

const RecentSubscribers = () => {
  return (
    <Card>
            <CardHeader>
              <CardTitle>Recent Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 h-52 overflow-auto">
                {recentSubscribers.map(sub => (
                  <div key={sub.id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-accent" />
                    <div>
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.subscribedDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
  )
}

export default RecentSubscribers