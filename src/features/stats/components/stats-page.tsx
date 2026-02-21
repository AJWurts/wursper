import { Clock, Flame, MessageSquare, Mic, TrendingUp } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { useTranscriptionsStore } from '@/features/transcriptions'
import { cn } from '@/lib/cn'

// Vibrant color palette
const COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  pink: '#ec4899',
}

export function StatsPage() {
  const { transcriptions, initialized, initialize, getStats } =
    useTranscriptionsStore()

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])

  const stats = getStats()

  // Process data for charts
  const chartData = useMemo(() => {
    // Group transcriptions by day for the area chart (last 14 days)
    const dailyData: Record<string, { words: number; count: number }> = {}
    const now = new Date()

    for (let i = 13; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      dailyData[key] = { words: 0, count: 0 }
    }

    transcriptions.forEach(t => {
      const date = new Date(t.timestamp).toISOString().split('T')[0]
      if (dailyData[date]) {
        dailyData[date].words += t.wordCount
        dailyData[date].count += 1
      }
    })

    const activityData = Object.entries(dailyData).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      words: data.words,
      transcriptions: data.count,
    }))

    // Hourly distribution
    const hourlyDistribution: Record<number, number> = {}
    for (let i = 0; i < 24; i++) {
      hourlyDistribution[i] = 0
    }

    transcriptions.forEach(t => {
      const hour = new Date(t.timestamp).getHours()
      hourlyDistribution[hour] += 1
    })

    const hourlyData = Object.entries(hourlyDistribution).map(
      ([hour, count]) => ({
        hour: `${hour.padStart(2, '0')}:00`,
        count,
      })
    )

    // Radar chart data for performance metrics
    const avgWords = stats.avgWordsPerTranscription
    const radarData = [
      {
        metric: 'Speed',
        value: Math.min(100, (stats.wordsPerMinute / 200) * 100),
        fullMark: 100,
      },
      {
        metric: 'Volume',
        value: Math.min(100, (stats.totalTranscriptions / 100) * 100),
        fullMark: 100,
      },
      {
        metric: 'Consistency',
        value: Math.min(100, calculateStreak() * 10),
        fullMark: 100,
      },
      {
        metric: 'Depth',
        value: Math.min(100, (avgWords / 100) * 100),
        fullMark: 100,
      },
      {
        metric: 'Diversity',
        value: Math.min(100, stats.languageStats.uniqueLanguages * 20),
        fullMark: 100,
      },
    ]

    return { activityData, hourlyData, radarData }
  }, [transcriptions, stats])

  // Calculate streak
  function calculateStreak() {
    if (transcriptions.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dates = new Set(
      transcriptions.map(t => {
        const date = new Date(t.timestamp)
        date.setHours(0, 0, 0, 0)
        return date.getTime()
      })
    )

    let streak = 0
    let checkDate = today.getTime()

    while (dates.has(checkDate)) {
      streak++
      checkDate -= 24 * 60 * 60 * 1000
    }

    return streak
  }

  const streak = calculateStreak()

  // Custom tooltip style
  const tooltipStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#fff',
  }

  // Calculate time comparison
  const typingTimeMinutes = Math.round(stats.totalWords / 40) // 40 WPM typing
  const speakingTimeMinutes = Math.round(stats.totalDuration / 60)
  const savedPercentage =
    typingTimeMinutes > 0
      ? Math.round(
          ((typingTimeMinutes - speakingTimeMinutes) / typingTimeMinutes) * 100
        )
      : 0

  // Empty state
  if (stats.totalTranscriptions === 0) {
    return (
      <div className="h-full w-full flex flex-col px-8">
        <div className="shrink-0 pt-16 pb-6">
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            Statistics
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Track your transcription activity and productivity
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
            <Mic className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No transcriptions yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Start recording with the keyboard shortcut to see your statistics
            and beautiful charts here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col px-8 pb-8 overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 pt-16 pb-6">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Statistics
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Your transcription insights at a glance
        </p>
      </div>

      {/* Bento Grid - tighter gaps */}
      <div className="grid grid-cols-12 gap-3">
        {/* Total Transcriptions - Large */}
        <BentoCard className="col-span-4 row-span-2">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Mic className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">
                Total Transcriptions
              </span>
            </div>
            <div className="flex-1 flex items-center">
              <span className="text-6xl font-bold tracking-tight">
                {stats.totalTranscriptions}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-emerald-500 font-medium">
                +{stats.todayCount}
              </span>
              <span>today</span>
            </div>
          </div>
        </BentoCard>

        {/* Words */}
        <BentoCard className="col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Words</span>
              </div>
              <span className="text-3xl font-bold">
                {stats.totalWords.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">avg per session</p>
              <p className="text-lg font-semibold text-emerald-500">
                {stats.avgWordsPerTranscription}
              </p>
            </div>
          </div>
        </BentoCard>

        {/* Time Saved - visual comparison */}
        <BentoCard className="col-span-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">Time Saved</span>
            <span className="ml-auto text-xs font-medium text-emerald-500">
              {savedPercentage}% faster
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-14">
                Speaking
              </span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${typingTimeMinutes > 0 ? (speakingTimeMinutes / typingTimeMinutes) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs font-medium w-12 text-right">
                {speakingTimeMinutes}m
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-14">Typing</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500/60 rounded-full w-full" />
              </div>
              <span className="text-xs font-medium w-12 text-right text-muted-foreground">
                {typingTimeMinutes}m
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Streak */}
        <BentoCard className="col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Streak</span>
              </div>
              <span className="text-3xl font-bold">{streak} days</span>
            </div>
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => {
                const dayOffset = 6 - i
                const checkDate = new Date()
                checkDate.setDate(checkDate.getDate() - dayOffset)
                checkDate.setHours(0, 0, 0, 0)
                const hasActivity = transcriptions.some(t => {
                  const tDate = new Date(t.timestamp)
                  tDate.setHours(0, 0, 0, 0)
                  return tDate.getTime() === checkDate.getTime()
                })
                return (
                  <div
                    key={i}
                    className={cn(
                      'w-3 h-8 rounded-sm',
                      hasActivity ? 'bg-orange-500' : 'bg-white/10'
                    )}
                  />
                )
              })}
            </div>
          </div>
        </BentoCard>

        {/* WPM */}
        <BentoCard className="col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-pink-500" />
                <span className="text-sm text-muted-foreground">
                  Speaking Speed
                </span>
              </div>
              <span className="text-3xl font-bold">
                {stats.wordsPerMinute}{' '}
                <span className="text-lg font-normal text-muted-foreground">
                  wpm
                </span>
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">
                vs avg typing
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-emerald-500">
                  {stats.wordsPerMinute > 40
                    ? `${Math.round((stats.wordsPerMinute / 40) * 100 - 100)}%`
                    : '0%'}
                </span>
                <span className="text-xs text-muted-foreground">faster</span>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Activity Chart */}
        <BentoCard className="col-span-8 row-span-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">Activity</span>
            <span className="text-xs text-muted-foreground">Last 14 days</span>
          </div>
          <div className="h-[220px] mt-3 [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.activityData}>
                <defs>
                  <linearGradient
                    id="colorGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={COLORS.blue}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor={COLORS.blue}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'transparent' }}
                />
                <Area
                  type="monotone"
                  dataKey="words"
                  stroke={COLORS.blue}
                  strokeWidth={2}
                  fill="url(#colorGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Radar Chart - Performance */}
        <BentoCard className="col-span-4 row-span-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">Performance</span>
          </div>
          <div className="h-[220px] mt-1 [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={chartData.radarData}
                cx="50%"
                cy="50%"
                outerRadius="70%"
              >
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke={COLORS.violet}
                  fill={COLORS.violet}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Peak Hours */}
        <BentoCard className="col-span-12">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">Peak Hours</span>
            <span className="text-xs text-muted-foreground">
              When you transcribe
            </span>
          </div>
          <div className="h-[100px] mt-2 [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.hourlyData}>
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  formatter={value => [`${value}`, 'Transcriptions']}
                />
                <Bar
                  dataKey="count"
                  fill={COLORS.emerald}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>
      </div>
    </div>
  )
}

interface BentoCardProps {
  children: React.ReactNode
  className?: string
}

function BentoCard({ children, className }: BentoCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.04] hover:border-white/[0.12]',
        className
      )}
    >
      {children}
    </div>
  )
}
