'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { datefns } from "@/components/ui/calendar"
const { format } = datefns;
import { useState } from "react"
import { Recharts } from "@/components/ui/chart"
const { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } = Recharts

type TimeRange = 'hour' | 'day' | 'month' | 'year' | 'custom'

interface AnalyticsData {
  date: string
  views: number
  watchTime: number
  subscribers: number
}

const Analytics = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('day')
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  // Get current date at start of day for consistent comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handleFromDateSelect = (date: Date | undefined) => {
    setDateFrom(date)
    // If "to date" is before "from date" or undefined, set it to "from date"
    if (date && (!dateTo || dateTo < date)) {
      setDateTo(date)
    }
  }

  const handleToDateSelect = (date: Date | undefined) => {
    // Ensure "to date" is not before "from date"
    if (date && dateFrom && date >= dateFrom) {
      setDateTo(date)
    }
  }

  // Sample data - replace with actual data
  const data: AnalyticsData[] = [
    { date: '21 Jan 2025', views: 0, watchTime: 0, subscribers: 0 },
    { date: '26 Jan 2025', views: 1, watchTime: 0.5, subscribers: 1 },
    { date: '30 Jan 2025', views: 2, watchTime: 1.2, subscribers: 2 },
    { date: '4 Feb 2025', views: 1, watchTime: 0.8, subscribers: 1 },
    { date: '8 Feb 2025', views: 3, watchTime: 2.1, subscribers: 2 },
    { date: '13 Feb 2025', views: 2, watchTime: 1.5, subscribers: 3 },
    { date: '17 Feb 2025', views: 1, watchTime: 0.9, subscribers: 2 },
  ]

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-x-2 flex items-center">
              <Select
                value={timeRange}
                onValueChange={(value: TimeRange) => {
                  setTimeRange(value)
                  // Reset dates when changing time range
                  if (value !== 'custom') {
                    setDateFrom(undefined)
                    setDateTo(undefined)
                  }
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Hour</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              {timeRange === 'custom' && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal w-[240px]",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : "From date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={handleFromDateSelect}
                        disabled={(date) => 
                          date > today || // Disable future dates
                          date < new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()) // Disable dates more than 1 year ago
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal w-[240px]",
                          !dateTo && "text-muted-foreground"
                        )}
                        disabled={!dateFrom} // Disable if no from date is selected
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : "To date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={handleToDateSelect}
                        disabled={(date) => 
                          date > today || // Disable future dates
                          (dateFrom ? date < dateFrom : false) // Disable dates before from date
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Views</h3>
              <p className="text-2xl font-bold">—</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Watch time (hours)</h3>
              <p className="text-2xl font-bold">—</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Subscribers</h3>
              <p className="text-2xl font-bold">—</p>
            </Card>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="watchTime"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="subscribers"
                  stroke="#ffc658"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Analytics
