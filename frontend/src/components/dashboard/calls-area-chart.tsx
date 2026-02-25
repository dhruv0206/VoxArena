"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
    calls: {
        label: "Calls",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

interface CallsAreaChartProps {
    data: { date: string; calls: number }[]
}

export function CallsAreaChart({ data }: CallsAreaChartProps) {
    return (
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <AreaChart data={data} margin={{ top: 4, right: 24, bottom: 0, left: -20 }}>
                <defs>
                    <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#callsGradient)"
                    dot={false}
                    activeDot={{ r: 4 }}
                />
            </AreaChart>
        </ChartContainer>
    )
}
