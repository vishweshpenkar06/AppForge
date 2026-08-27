'use client'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, CartesianGrid } from 'recharts'

export interface EvalHistoryPoint {
  runId: string
  label: string
  successRate: number
  avgLatency: number
  totalTests: number
  passed: number
  failed: number
  date: string
}

const chartConfig = {
  successRate: {
    label: 'Success Rate',
    color: 'var(--color-success)',
  },
  avgLatency: {
    label: 'Avg Latency',
    color: 'var(--color-secondary)',
  },
} satisfies ChartConfig

export function EvalHistoryChart({ data }: { data: EvalHistoryPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] text-forge-400 text-sm">
        No eval history yet. Run an evaluation to see trends.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-[10px]"
          tick={{ fill: 'var(--color-forge-400)', fontFamily: 'var(--font-mono)' }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value, name) =>
                name === 'successRate'
                  ? [`${Number(value).toFixed(1)}%`, 'Success Rate']
                  : [`${Number(value).toFixed(0)}ms`, 'Avg Latency']
              }
            />
          }
        />
        <Line
          type="monotone"
          dataKey="successRate"
          stroke="var(--color-success)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: 'var(--color-forge-900)', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="avgLatency"
          stroke="var(--color-secondary)"
          strokeWidth={2}
          dot={false}
          strokeDasharray="4 4"
          activeDot={{ r: 4, stroke: 'var(--color-forge-900)', strokeWidth: 2 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
