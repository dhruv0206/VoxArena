"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CallsAreaChart } from "@/components/dashboard/calls-area-chart"
import type { VoiceSession, Agent, SessionsPage } from "@/lib/api"

type Period = "7d" | "30d" | "90d"

const PERIOD_OPTIONS: { label: string; value: Period; days: number }[] = [
    { label: "7d", value: "7d", days: 7 },
    { label: "30d", value: "30d", days: 30 },
    { label: "90d", value: "90d", days: 90 },
]

function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

function StatCell({
    label,
    value,
    delta,
    positive,
    noData,
}: {
    label: string
    value: string
    delta: string | null
    positive: boolean
    noData?: boolean
}) {
    return (
        <div className="flex-1 px-6 py-5">
            <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {delta !== null ? (
                <p className={`text-xs mt-1 ${positive ? "text-emerald-500" : "text-red-500"}`}>
                    {delta} vs prior period
                </p>
            ) : noData ? (
                <p className="text-xs mt-1 text-muted-foreground/50">No prior period data</p>
            ) : (
                <p className="text-xs mt-1 text-transparent select-none">—</p>
            )}
        </div>
    )
}

interface DashboardStatsProps {
    userId: string
}

export function DashboardStats({ userId }: DashboardStatsProps) {
    const [period, setPeriod] = useState<Period>("30d")
    const [currSessions, setCurrSessions] = useState<VoiceSession[]>([])
    const [prevSessions, setPrevSessions] = useState<VoiceSession[]>([])
    const [currTotal, setCurrTotal] = useState(0)
    const [prevTotal, setPrevTotal] = useState(0)
    const [agents, setAgents] = useState<Agent[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
    const headers = { "x-user-id": userId }

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        const opt = PERIOD_OPTIONS.find(p => p.value === period)!
        const now = new Date()
        const currStart = new Date(now); currStart.setDate(now.getDate() - opt.days)
        const prevStart = new Date(now); prevStart.setDate(now.getDate() - opt.days * 2)

        try {
            const [currRes, prevRes, agentsRes] = await Promise.all([
                fetch(`${apiBase}/sessions/?limit=500&start_date=${currStart.toISOString()}`, { headers }),
                fetch(`${apiBase}/sessions/?limit=500&start_date=${prevStart.toISOString()}&end_date=${currStart.toISOString()}`, { headers }),
                fetch(`${apiBase}/agents/`, { headers }),
            ])

            if (currRes.ok) {
                const d: SessionsPage = await currRes.json()
                setCurrSessions(d.sessions)
                setCurrTotal(d.total)
            }
            if (prevRes.ok) {
                const d: SessionsPage = await prevRes.json()
                setPrevSessions(d.sessions)
                setPrevTotal(d.total)
            }
            if (agentsRes.ok) {
                const d: Agent[] = await agentsRes.json()
                setAgents(d)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }, [period, userId]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // ── Stats ──────────────────────────────────────────────────────────────
    const callsDelta = prevTotal > 0
        ? Math.round(((currTotal - prevTotal) / prevTotal) * 100)
        : null

    const currWithDur = currSessions.filter(s => s.duration !== null && s.duration! > 0)
    const prevWithDur = prevSessions.filter(s => s.duration !== null && s.duration! > 0)
    const avgDur = currWithDur.length > 0
        ? Math.round(currWithDur.reduce((a, s) => a + (s.duration ?? 0), 0) / currWithDur.length)
        : 0
    const prevAvgDur = prevWithDur.length > 0
        ? Math.round(prevWithDur.reduce((a, s) => a + (s.duration ?? 0), 0) / prevWithDur.length)
        : 0
    const durationDelta = prevAvgDur > 0
        ? Math.round(((avgDur - prevAvgDur) / prevAvgDur) * 100)
        : null

    const completedCount = currSessions.filter(s => s.status === "COMPLETED").length
    const prevCompletedCount = prevSessions.filter(s => s.status === "COMPLETED").length
    const successRate = currSessions.length > 0
        ? Math.round((completedCount / currSessions.length) * 100)
        : 0
    const prevSuccessRate = prevSessions.length > 0
        ? Math.round((prevCompletedCount / prevSessions.length) * 100)
        : 0
    const successDelta = prevSessions.length > 0 ? successRate - prevSuccessRate : null

    const activeAgents = agents.filter(a => a.is_active).length

    // Analysis-based metrics
    const sessionsWithAnalysis = currSessions.filter(s => s.analysis)
    const avgSentiment = sessionsWithAnalysis.length > 0
        ? sessionsWithAnalysis.reduce((a, s) => a + (s.analysis?.sentiment_score ?? 0), 0) / sessionsWithAnalysis.length
        : null
    const resolvedCount = sessionsWithAnalysis.filter(s => s.analysis?.outcome === "resolved").length
    const resolutionRate = sessionsWithAnalysis.length > 0
        ? Math.round((resolvedCount / sessionsWithAnalysis.length) * 100)
        : null

    const formatDelta = (d: number | null, suffix = "%") =>
        d === null ? null : `${d >= 0 ? "+" : ""}${d}${suffix}`

    // ── Chart data ─────────────────────────────────────────────────────────
    const opt = PERIOD_OPTIONS.find(p => p.value === period)!

    let chartData: { date: string; calls: number }[]

    if (period === "90d") {
        // Weekly buckets — 13 weeks
        chartData = Array.from({ length: 13 }, (_, i) => {
            const weekStart = new Date()
            weekStart.setDate(weekStart.getDate() - (12 - i) * 7)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 7)
            return {
                date: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                calls: currSessions.filter(
                    s => s.created_at >= weekStart.toISOString() && s.created_at < weekEnd.toISOString()
                ).length,
            }
        })
    } else {
        // Daily buckets
        chartData = Array.from({ length: opt.days }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (opt.days - 1 - i))
            const dayStr = d.toISOString().split("T")[0]
            return {
                date: period === "7d"
                    ? d.toLocaleDateString("en-US", { weekday: "short" })
                    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                calls: currSessions.filter(s => s.created_at.startsWith(dayStr)).length,
            }
        })
    }

    const chartLabel =
        period === "7d" ? "Calls per day — last 7 days" :
            period === "30d" ? "Calls per day — last 30 days" :
                "Calls per week — last 90 days"

    return (
        <>
            {/* Section header — period toggle controls both stat row and chart */}
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Overview</p>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Time range:</span>
                    <div className="flex items-center rounded-md border overflow-hidden">
                        {PERIOD_OPTIONS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`px-3 py-1 text-xs font-medium transition-colors ${period === p.value
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stat Row */}
            <Card className="overflow-hidden">
                <div className="flex divide-x">
                    <StatCell
                        label={`Total Calls`}
                        value={isLoading ? "—" : String(currTotal)}
                        delta={isLoading ? null : formatDelta(callsDelta)}
                        positive={callsDelta === null || callsDelta >= 0}
                        noData={!isLoading && prevTotal === 0}
                    />
                    <StatCell
                        label="Avg Duration"
                        value={isLoading ? "—" : (currWithDur.length > 0 ? formatDuration(avgDur) : "—")}
                        delta={isLoading ? null : formatDelta(durationDelta)}
                        positive={durationDelta === null || durationDelta >= 0}
                        noData={!isLoading && prevWithDur.length === 0}
                    />
                    <StatCell
                        label="Success Rate"
                        value={isLoading ? "—" : `${successRate}%`}
                        delta={isLoading ? null : formatDelta(successDelta, "pp")}
                        positive={successDelta === null || successDelta >= 0}
                        noData={!isLoading && prevSessions.length === 0}
                    />
                    <StatCell
                        label="Avg Sentiment"
                        value={isLoading ? "—" : avgSentiment !== null ? `${(avgSentiment * 100).toFixed(0)}%` : "—"}
                        delta={null}
                        positive={true}
                        noData={!isLoading && sessionsWithAnalysis.length === 0}
                    />
                    <StatCell
                        label="Resolution Rate"
                        value={isLoading ? "—" : resolutionRate !== null ? `${resolutionRate}%` : "—"}
                        delta={null}
                        positive={true}
                        noData={!isLoading && sessionsWithAnalysis.length === 0}
                    />
                    <StatCell
                        label="Active Agents"
                        value={isLoading ? "—" : String(activeAgents)}
                        delta={null}
                        positive={true}
                    />
                </div>
            </Card>

            {/* Call Volume Chart */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Call Volume</CardTitle>
                            <CardDescription className="text-xs">{chartLabel}</CardDescription>
                        </div>
                        <Link href="/dashboard/analytics">
                            <Button variant="ghost" size="sm" className="text-xs">View analytics</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="pb-4">
                    <CallsAreaChart data={chartData} />
                </CardContent>
            </Card>
        </>
    )
}
