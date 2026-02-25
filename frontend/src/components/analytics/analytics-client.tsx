"use client"

import { useEffect, useState } from "react"
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid,
    XAxis, YAxis, Pie, PieChart, Cell, Line, LineChart
} from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// ─── Color palette ───────────────────────────────────────────────────────────
const C = {
    indigo: "#6366f1",
    teal: "#14b8a6",
    violet: "#8b5cf6",
    emerald: "#10b981",
    sky: "#0ea5e9",
    rose: "#f43f5e",
    amber: "#f59e0b",
    pink: "#ec4899",
} as const

const AGENT_COLORS = [C.indigo, C.teal, C.violet, C.emerald, C.sky, C.amber, C.pink, C.rose]

// ─── Chart configs ────────────────────────────────────────────────────────────
const callsOverTimeConfig = {
    calls: { label: "Calls", color: C.indigo },
} satisfies ChartConfig

const durationConfig = {
    duration: { label: "Avg Duration (s)", color: C.teal },
} satisfies ChartConfig

const byAgentConfig = {
    calls: { label: "Calls", color: C.violet },
} satisfies ChartConfig

const statusConfig = {
    completed: { label: "Completed", color: C.emerald },
    active: { label: "Active", color: C.sky },
    failed: { label: "Failed", color: C.rose },
} satisfies ChartConfig

// ─── Time range options ───────────────────────────────────────────────────────
const TIME_RANGES = [
    { label: "7d", days: 7 },
    { label: "30d", days: 30 },
    { label: "90d", days: 90 },
]

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatDuration(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
}

function getPastDays(days: number) {
    return Array.from({ length: days }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (days - 1 - i))
        return d.toISOString().split("T")[0]
    })
}

/**
 * Resolve a human-readable label for a session.
 * - Named agent  → agent name
 * - SIP call     → "SIP: +1234567890" (extracted from room name like _+1234_abc)
 * - Preview      → "Preview"
 * - Other        → "Unassigned"
 */
export function resolveSessionLabel(session: { agent_name?: string; room_name: string }): string {
    const room = session.room_name || ""
    // LiveKit SIP rooms: _+E164PHONE_RANDOMID  (check first regardless of agent assignment)
    const sipMatch = room.match(/^_?(\+\d{7,15})/)
    if (sipMatch) return session.agent_name ? session.agent_name : `SIP: ${sipMatch[1]}`
    if (session.agent_name) return session.agent_name
    if (room.startsWith("preview-")) return "Preview"
    return "Unassigned"
}

/** True only if the label comes from a configured, named agent (not SIP/preview/unassigned) */
export function isNamedAgent(session: { agent_name?: string }): boolean {
    return !!session.agent_name
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Session {
    id: string
    room_name: string
    agent_name?: string
    status: "CREATED" | "ACTIVE" | "COMPLETED" | "FAILED" | string
    duration?: number
    created_at: string
}

interface AgentRecord {
    id: string
    name: string
    is_active: boolean
}

interface AnalyticsClientProps {
    userId: string
    apiUrl: string
}

export default function AnalyticsClient({ userId, apiUrl }: AnalyticsClientProps) {
    const [sessions, setSessions] = useState<Session[]>([])
    const [agents, setAgents] = useState<AgentRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [rangeDays, setRangeDays] = useState(30)
    const [agentPage, setAgentPage] = useState(1)
    const AGENTS_PER_PAGE = 5

    // Fetch agents list once (not range-dependent)
    useEffect(() => {
        fetch(`${apiUrl}/agents`, { headers: { "x-user-id": userId }, cache: "no-store" })
            .then(r => r.ok ? r.json() : [])
            .then((data: AgentRecord[]) => setAgents(Array.isArray(data) ? data : []))
            .catch(() => { })
    }, [userId, apiUrl])

    useEffect(() => {
        async function fetchSessions() {
            setLoading(true)
            try {
                // Fetch enough history for both current and previous period comparison
                const lookbackDays = rangeDays * 2
                const startDate = new Date()
                startDate.setDate(startDate.getDate() - lookbackDays)
                const startDateISO = startDate.toISOString()

                // Paginate to collect all sessions in the range
                let allSessions: Session[] = []
                let page = 1
                const pageSize = 1000
                while (true) {
                    const res = await fetch(
                        `${apiUrl}/sessions/?limit=${pageSize}&page=${page}&start_date=${encodeURIComponent(startDateISO)}`,
                        { headers: { "x-user-id": userId }, cache: "no-store" }
                    )
                    if (!res.ok) break
                    const data = await res.json()
                    const batch: Session[] = data.sessions || []
                    allSessions = allSessions.concat(batch)
                    if (allSessions.length >= (data.total ?? 0) || batch.length < pageSize) break
                    page++
                }
                setSessions(allSessions)
            } catch (e) {
                console.error("Failed to fetch sessions", e)
            } finally {
                setLoading(false)
            }
        }
        fetchSessions()
    }, [userId, apiUrl, rangeDays])

    // Reset agent page when range changes
    useEffect(() => { setAgentPage(1) }, [rangeDays])

    // ── Filter by range ──────────────────────────────────────────────────────
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - rangeDays)
    const filtered = sessions.filter(s => new Date(s.created_at) >= cutoff)

    // ── Previous period (for % change) ───────────────────────────────────────
    const prevCutoff = new Date()
    prevCutoff.setDate(prevCutoff.getDate() - rangeDays * 2)
    const prevFiltered = sessions.filter(s => {
        const d = new Date(s.created_at)
        return d >= prevCutoff && d < cutoff
    })

    // ── Calls over time ──────────────────────────────────────────────────────
    const days = getPastDays(rangeDays)
    const callsOverTime = days.map(day => {
        const label = rangeDays <= 7
            ? new Date(day).toLocaleDateString("en-US", { weekday: "short" })
            : new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        return {
            date: label,
            calls: filtered.filter(s => s.created_at?.startsWith(day)).length,
        }
    })
    // Reduce density for 30d/90d
    const callsChartData = rangeDays <= 7
        ? callsOverTime
        : callsOverTime.filter((_, i) => i % (rangeDays <= 30 ? 1 : 3) === 0)

    // ── Avg duration over time ────────────────────────────────────────────────
    const durationOverTime = days.map(day => {
        const daySessions = filtered.filter(s => s.created_at?.startsWith(day) && (s.duration ?? 0) > 0)
        const avg = daySessions.length
            ? Math.round(daySessions.reduce((a, s) => a + (s.duration ?? 0), 0) / daySessions.length)
            : 0
        return {
            date: rangeDays <= 7
                ? new Date(day).toLocaleDateString("en-US", { weekday: "short" })
                : new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            duration: avg,
        }
    }).filter((_, i) => rangeDays <= 30 || i % 3 === 0)

    // ── Calls by agent ────────────────────────────────────────────────────────
    // Group all sessions by resolved label (named agent, SIP number, preview, etc.)
    const agentMap = new Map<string, { calls: number; isNamed: boolean }>()
    filtered.forEach(s => {
        const label = resolveSessionLabel(s)
        const existing = agentMap.get(label) ?? { calls: 0, isNamed: isNamedAgent(s) }
        agentMap.set(label, { calls: existing.calls + 1, isNamed: existing.isNamed })
    })
    const callsByAgent = Array.from(agentMap.entries())
        .sort((a, b) => b[1].calls - a[1].calls)
        .map(([agent, { calls, isNamed }]) => ({ agent, calls, isNamed }))
    const agentPageCount = Math.ceil(callsByAgent.length / AGENTS_PER_PAGE)
    const pagedAgents = callsByAgent.slice((agentPage - 1) * AGENTS_PER_PAGE, agentPage * AGENTS_PER_PAGE)

    // ── Status breakdown ──────────────────────────────────────────────────────
    const statusCounts = { COMPLETED: 0, ACTIVE: 0, FAILED: 0, CREATED: 0 }
    filtered.forEach(s => {
        const st = s.status?.toUpperCase() as keyof typeof statusCounts
        if (st in statusCounts) statusCounts[st]++
    })
    const statusData = [
        { status: "Completed", value: statusCounts.COMPLETED, fill: C.emerald },
        { status: "Active", value: statusCounts.ACTIVE + statusCounts.CREATED, fill: C.sky },
        { status: "Failed", value: statusCounts.FAILED, fill: C.rose },
    ].filter(d => d.value > 0)

    // ── Summary KPIs + deltas ─────────────────────────────────────────────────
    const totalCalls = filtered.length
    const prevTotalCalls = prevFiltered.length
    const callsDelta = prevTotalCalls > 0 ? Math.round(((totalCalls - prevTotalCalls) / prevTotalCalls) * 100) : null

    const avgDuration = filtered.length
        ? Math.round(filtered.reduce((a, s) => a + (s.duration ?? 0), 0) / filtered.length)
        : 0
    const prevAvgDuration = prevFiltered.length
        ? Math.round(prevFiltered.reduce((a, s) => a + (s.duration ?? 0), 0) / prevFiltered.length)
        : 0
    const durationDelta = prevAvgDuration > 0 ? Math.round(((avgDuration - prevAvgDuration) / prevAvgDuration) * 100) : null

    const successRate = filtered.length
        ? Math.round((statusCounts.COMPLETED / filtered.length) * 100)
        : 0
    const prevStatusCounts = { COMPLETED: 0, ACTIVE: 0, FAILED: 0, CREATED: 0 }
    prevFiltered.forEach(s => {
        const st = s.status?.toUpperCase() as keyof typeof prevStatusCounts
        if (st in prevStatusCounts) prevStatusCounts[st]++
    })
    const prevSuccessRate = prevFiltered.length
        ? Math.round((prevStatusCounts.COMPLETED / prevFiltered.length) * 100)
        : 0
    const successDelta = prevFiltered.length > 0 ? successRate - prevSuccessRate : null

    const uniqueAgents = new Set(filtered.filter(s => s.agent_name).map(s => s.agent_name)).size
    const prevUniqueAgents = new Set(prevFiltered.filter(s => s.agent_name).map(s => s.agent_name)).size
    const agentsDelta = prevUniqueAgents > 0 ? uniqueAgents - prevUniqueAgents : null

    // Active agents: same source of truth as the dashboard (is_active flag)
    const activeAgentsCount = agents.filter(a => a.is_active).length
    const totalAgentsCount = agents.length

    const fmtDelta = (d: number | null, suffix = "%") =>
        d === null ? null : `${d >= 0 ? "+" : ""}${d}${suffix}`

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center space-y-2">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm">Loading analytics…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    <p className="text-muted-foreground text-sm">Track your voice agent performance</p>
                </div>
                <div className="flex gap-1 border rounded-lg p-1">
                    {TIME_RANGES.map(r => (
                        <Button
                            key={r.days}
                            variant={rangeDays === r.days ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setRangeDays(r.days)}
                            className="h-7 px-3 text-xs"
                        >
                            {r.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Calls */}
                <Card className="overflow-hidden">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardDescription>Total Calls</CardDescription>
                        <div className="flex items-end justify-between gap-2">
                            <CardTitle className="text-3xl">{totalCalls}</CardTitle>
                            {callsDelta !== null && (
                                <span className={`text-xs font-semibold mb-1 ${callsDelta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {fmtDelta(callsDelta)}
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ChartContainer config={callsOverTimeConfig} className="h-[56px] w-full">
                            <AreaChart data={callsChartData.slice(-14)} margin={{ top: 8, right: 12, bottom: 4, left: 12 }}>
                                <defs>
                                    <linearGradient id="kpiGrad1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={C.indigo} stopOpacity={0.35} />
                                        <stop offset="100%" stopColor={C.indigo} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="calls" stroke={C.indigo} strokeWidth={1.5} fill="url(#kpiGrad1)" dot={false} />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Avg Duration */}
                <Card className="overflow-hidden">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardDescription>Avg Duration</CardDescription>
                        <div className="flex items-end justify-between gap-2">
                            <CardTitle className="text-3xl">{formatDuration(avgDuration)}</CardTitle>
                            {durationDelta !== null && (
                                <span className={`text-xs font-semibold mb-1 ${durationDelta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {fmtDelta(durationDelta)}
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ChartContainer config={durationConfig} className="h-[56px] w-full">
                            <AreaChart data={durationOverTime.slice(-14)} margin={{ top: 8, right: 12, bottom: 4, left: 12 }}>
                                <defs>
                                    <linearGradient id="kpiGrad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={C.teal} stopOpacity={0.35} />
                                        <stop offset="100%" stopColor={C.teal} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="duration" stroke={C.teal} strokeWidth={1.5} fill="url(#kpiGrad2)" dot={false} />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Success Rate */}
                <Card className="overflow-hidden">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardDescription>Success Rate</CardDescription>
                        <div className="flex items-end justify-between gap-2">
                            <CardTitle className="text-3xl">{successRate}%</CardTitle>
                            {successDelta !== null && (
                                <span className={`text-xs font-semibold mb-1 ${successDelta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {fmtDelta(successDelta, "pp")}
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ChartContainer config={callsOverTimeConfig} className="h-[56px] w-full">
                            <AreaChart
                                data={callsChartData.slice(-14).map(d => ({
                                    ...d,
                                    calls: d.calls > 0
                                        ? Math.round((filtered.filter(s => s.created_at?.includes(d.date) && s.status?.toUpperCase() === "COMPLETED").length / d.calls) * 100)
                                        : 0,
                                }))}
                                margin={{ top: 8, right: 12, bottom: 4, left: 12 }}
                            >
                                <defs>
                                    <linearGradient id="kpiGrad3" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={C.emerald} stopOpacity={0.35} />
                                        <stop offset="100%" stopColor={C.emerald} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="calls" stroke={C.emerald} strokeWidth={1.5} fill="url(#kpiGrad3)" dot={false} />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Active Agents */}
                <Card className="overflow-hidden">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardDescription>Active Agents</CardDescription>
                        <div className="flex items-end justify-between gap-2">
                            <CardTitle className="text-3xl">{activeAgentsCount}</CardTitle>
                            {totalAgentsCount > 0 && (
                                <span className="text-xs text-muted-foreground mb-1">
                                    of {totalAgentsCount}
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ChartContainer config={byAgentConfig} className="h-[56px] w-full">
                            <AreaChart data={callsChartData.slice(-14).map(d => ({
                                ...d,
                                calls: new Set(
                                    filtered.filter(s => s.created_at?.includes(d.date) && s.agent_name).map(s => s.agent_name)
                                ).size,
                            }))} margin={{ top: 8, right: 12, bottom: 4, left: 12 }}>
                                <defs>
                                    <linearGradient id="kpiGrad4" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={C.violet} stopOpacity={0.35} />
                                        <stop offset="100%" stopColor={C.violet} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="calls" stroke={C.violet} strokeWidth={1.5} fill="url(#kpiGrad4)" dot={false} />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Row 1: Calls over time (wide) + Status donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Calls Over Time</CardTitle>
                        <CardDescription>Daily call volume for the last {rangeDays} days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {totalCalls === 0 ? (
                            <EmptyChart />
                        ) : (
                            <ChartContainer config={callsOverTimeConfig} className="h-[220px] w-full">
                                <AreaChart data={callsChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                    <defs>
                                        <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={C.indigo} stopOpacity={0.35} />
                                            <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Area type="monotone" dataKey="calls" stroke={C.indigo} strokeWidth={2} fill="url(#aGrad)" dot={false} activeDot={{ r: 4, fill: C.indigo }} />
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Call Status</CardTitle>
                        <CardDescription>Breakdown by outcome</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statusData.length === 0 ? (
                            <EmptyChart />
                        ) : (
                            <>
                                <ChartContainer config={statusConfig} className="h-[180px] w-full">
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                        <Pie data={statusData} dataKey="value" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                                            {statusData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                                <div className="flex flex-col gap-1 mt-2">
                                    {statusData.map(d => (
                                        <div key={d.status} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                                                <span className="text-muted-foreground">{d.status}</span>
                                            </div>
                                            <span className="font-medium">{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Avg Duration + Calls by Agent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Avg Call Duration</CardTitle>
                        <CardDescription>Seconds per day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {totalCalls === 0 ? (
                            <EmptyChart />
                        ) : (
                            <ChartContainer config={durationConfig} className="h-[200px] w-full">
                                <LineChart data={durationOverTime} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="duration" stroke={C.teal} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: C.teal }} />
                                </LineChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle>Calls by Agent</CardTitle>
                            <CardDescription>All calls grouped by agent, SIP number, or type</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {callsByAgent.length === 0 ? (
                            <EmptyChart />
                        ) : (
                            <ChartContainer config={byAgentConfig} className="h-[200px] w-full">
                                <BarChart data={callsByAgent} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                                    <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="agent"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 11 }}
                                        width={90}
                                        tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="calls" radius={[0, 4, 4, 0]}>
                                        {callsByAgent.map((_, i) => (
                                            <Cell key={i} fill={AGENT_COLORS[i % AGENT_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Agents Table */}
            {callsByAgent.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle>Top Performing Agents</CardTitle>
                            <CardDescription>Ranked by call volume in the selected period</CardDescription>
                        </div>
                        <span className="text-xs text-muted-foreground">{callsByAgent.length} group{callsByAgent.length !== 1 ? "s" : ""}</span>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {pagedAgents.map((a, i) => {
                                const globalIdx = (agentPage - 1) * AGENTS_PER_PAGE + i
                                const agentSessions = filtered.filter(s => resolveSessionLabel(s) === a.agent)
                                const agentAvgDur = agentSessions.length
                                    ? Math.round(agentSessions.reduce((acc, s) => acc + (s.duration ?? 0), 0) / agentSessions.length)
                                    : 0
                                const agentSuccess = agentSessions.length
                                    ? Math.round((agentSessions.filter(s => s.status?.toUpperCase() === "COMPLETED").length / agentSessions.length) * 100)
                                    : 0
                                return (
                                    <div key={a.agent} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                                        <div
                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                            style={{ background: AGENT_COLORS[globalIdx % AGENT_COLORS.length] }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{a.agent}</p>
                                            {!a.isNamed && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    {a.agent.startsWith("SIP:") ? "SIP call — no agent configured for this number" : "No agent assigned"}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                            <span><span className="font-semibold text-foreground">{a.calls}</span> call{a.calls !== 1 ? "s" : ""}</span>
                                            <span><span className="font-semibold text-foreground">{formatDuration(agentAvgDur)}</span> avg</span>
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                                style={agentSuccess >= 80
                                                    ? { color: C.emerald, borderColor: C.emerald + "60", background: C.emerald + "15" }
                                                    : undefined}
                                            >
                                                {agentSuccess}% success
                                            </Badge>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Pagination */}
                        {agentPageCount > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                <span className="text-xs text-muted-foreground">
                                    Page {agentPage} of {agentPageCount}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => setAgentPage(1)}
                                        disabled={agentPage === 1}
                                    >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                                        </svg>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => setAgentPage(p => Math.max(1, p - 1))}
                                        disabled={agentPage === 1}
                                    >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                        </svg>
                                    </Button>
                                    {Array.from({ length: agentPageCount }, (_, idx) => idx + 1)
                                        .filter(p => p === 1 || p === agentPageCount || Math.abs(p - agentPage) <= 1)
                                        .reduce<(number | "...")[]>((acc, p, i, arr) => {
                                            if (i > 0 && typeof arr[i - 1] === "number" && (p as number) - (arr[i - 1] as number) > 1) acc.push("...")
                                            acc.push(p)
                                            return acc
                                        }, [])
                                        .map((p, i) =>
                                            p === "..." ? (
                                                <span key={`ellipsis-${i}`} className="text-xs text-muted-foreground px-1">…</span>
                                            ) : (
                                                <Button
                                                    key={p}
                                                    variant={agentPage === p ? "default" : "outline"}
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-xs"
                                                    onClick={() => setAgentPage(p as number)}
                                                >
                                                    {p}
                                                </Button>
                                            )
                                        )
                                    }
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => setAgentPage(p => Math.min(agentPageCount, p + 1))}
                                        disabled={agentPage === agentPageCount}
                                    >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => setAgentPage(agentPageCount)}
                                        disabled={agentPage === agentPageCount}
                                    >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function EmptyChart() {
    return (
        <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">No data for this period</p>
        </div>
    )
}
