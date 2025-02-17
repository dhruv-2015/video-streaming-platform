'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Recharts } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
const { LineChart, Line, XAxis, YAxis, Tooltip } = Recharts;
import { UploadCloud, Settings, Bell } from 'lucide-react'
import { UploadDialog } from '@/components/studio/UploadVideoDialog'


const sampleViewData = [
  { date: '1 Feb', views: 45 },
  { date: '2 Feb', views: 32 },
  { date: '3 Feb', views: 58 },
  { date: '4 Feb', views: 40 },
  { date: '5 Feb', views: 65 },
  { date: '6 Feb', views: 48 },
  { date: '7 Feb', views: 52 }
]

const recentComments = [
  { id: 1, author: 'John Doe', comment: 'Great content!', time: '2 hours ago' },
  { id: 2, author: 'Jane Smith', comment: 'Very helpful video', time: '5 hours ago' },
  // Add more sample comments...
]

const recentSubscribers = [
  { id: 1, name: 'Tech Enthusiast', subscribedDate: '1 day ago' },
  { id: 2, name: 'Creative Mind', subscribedDate: '2 days ago' },
  // Add more sample subscribers...
]

export default function StudioDashboard() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Channel Dashboard</h1>
        <div className="flex gap-4">
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Channel Overview */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Channel Overview</CardTitle>
          </CardHeader>
          <CardContent className='w-full h-auto'>
            <div className="flex flex-col items-center justify-center space-y-4 w-full h-full">
              <UploadCloud className="h-24 w-24 text-muted-foreground" />
              <Button onClick={() => setUploadDialogOpen(true)}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Video Analytics */}
        {/* <Card className="hidden lg:block col-span-2">
          <CardHeader>
            <CardTitle>Video Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <LineChart data={sampleViewData} width={800} height={300}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#8884d8" />
              </LineChart>
            </div>
          </CardContent>
        </Card> */}

        {/* Recent Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentComments.map(comment => (
                <div key={comment.id} className="border-b pb-2">
                  <p className="font-medium">{comment.author}</p>
                  <p className="text-sm text-muted-foreground">{comment.comment}</p>
                  <p className="text-xs text-muted-foreground">{comment.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Subscribers */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSubscribers.map(sub => (
                <div key={sub.id} className="flex items-center space-x-4 border-b pb-2">
                  <div className="w-8 h-8 rounded-full bg-accent" />
                  <div>
                    <p className="font-medium">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.subscribedDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />

    </div>
  )
}