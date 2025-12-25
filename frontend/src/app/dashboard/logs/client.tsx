"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function PhoneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function MicrophoneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
    );
}

function ChevronLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
    );
}

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    );
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface Session {
    id: string;
    room_name: string;
    status: string;
    duration: number | null;
    created_at: string;
    agent_name?: string;
}

interface PaginatedResponse {
    sessions: Session[];
    total: number;
    page: number;
    limit: number;
}

interface CallLogsClientProps {
    userId: string;
}

export function CallLogsClient({ userId }: CallLogsClientProps) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const fetchSessions = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (startDate) params.append("start_date", new Date(startDate).toISOString());
            if (endDate) params.append("end_date", new Date(endDate).toISOString());

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/sessions/?${params}`,
                {
                    headers: { 'x-user-id': userId },
                }
            );

            if (response.ok) {
                const data: PaginatedResponse = await response.json();
                setSessions(data.sessions);
                setTotal(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, page, limit, startDate, endDate]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const totalPages = Math.ceil(total / limit);

    const handleDateFilter = () => {
        setPage(1);
        fetchSessions();
    };

    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Call Logs</h1>
                <p className="text-muted-foreground">View history of all voice sessions</p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Filter by Date</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">From</Label>
                            <Input
                                id="start-date"
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-52"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">To</Label>
                            <Input
                                id="end-date"
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-52"
                            />
                        </div>
                        <Button onClick={handleDateFilter} size="sm">
                            Apply Filter
                        </Button>
                        {(startDate || endDate) && (
                            <Button onClick={clearFilters} variant="outline" size="sm">
                                Clear
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Logs */}
            {isLoading ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <div className="animate-pulse">Loading...</div>
                    </CardContent>
                </Card>
            ) : sessions.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <PhoneIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="font-semibold mb-2">No calls found</h3>
                        <p className="text-muted-foreground">
                            {startDate || endDate ? "Try adjusting your date filters" : "Start a voice session to see logs here"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>
                                Calls ({total})
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <Link key={session.id} href={`/dashboard/logs/${session.id}`} className="block">
                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <MicrophoneIcon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {session.agent_name ? (
                                                        <>
                                                            {session.agent_name}
                                                            <span className="text-muted-foreground ml-2 font-normal text-sm">
                                                                — ID: {session.room_name.replace(/^(preview-|voxarena-)/, '')}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            Call
                                                            <span className="text-muted-foreground ml-2 font-normal text-sm">
                                                                — ID: {session.room_name.replace(/^(preview-|voxarena-)/, '')}
                                                            </span>
                                                        </>
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(session.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <ClockIcon className="h-4 w-4" />
                                                {formatDuration(session.duration)}
                                            </div>
                                            <Badge
                                                variant={
                                                    session.status === "COMPLETED" ? "secondary" :
                                                        session.status === "ACTIVE" ? "default" :
                                                            "destructive"
                                                }
                                            >
                                                {session.status?.toLowerCase() || "created"}
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages} ({total} total calls)
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeftIcon className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        Next
                                        <ChevronRightIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
