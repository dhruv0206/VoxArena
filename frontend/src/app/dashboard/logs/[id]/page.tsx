import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function ArrowLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
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

function UserIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    );
}

function BotIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
    );
}

interface Session {
    id: string;
    room_name: string;
    status: string;
    started_at: string | null;
    ended_at: string | null;
    duration: number | null;
    created_at: string;
    agent_name?: string;
}

interface Transcript {
    id: string;
    content: string;
    speaker: "USER" | "AGENT";
    timestamp: string;
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default async function CallDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
        redirect("/sign-in");
    }

    // Fetch session details
    let session: Session | null = null;
    let transcripts: Transcript[] = [];

    try {
        const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const sessionResponse = await fetch(
            `${apiUrl}/sessions/${id}`,
            { cache: 'no-store' }
        );
        if (sessionResponse.ok) {
            session = await sessionResponse.json();
        }

        const transcriptsResponse = await fetch(
            `${apiUrl}/sessions/${id}/transcripts`,
            { cache: 'no-store' }
        );
        if (transcriptsResponse.ok) {
            transcripts = await transcriptsResponse.json();
        }
    } catch (error) {
        console.error("Failed to fetch call details:", error);
    }

    if (!session) {
        return (
            <DashboardLayout activeNav="Call Logs">
                <div className="text-center py-16">
                    <h1 className="text-2xl font-bold mb-2">Call Not Found</h1>
                    <p className="text-muted-foreground mb-4">This call doesn&apos;t exist or you don&apos;t have access.</p>
                    <Link href="/dashboard/logs">
                        <Button variant="outline">Back to Logs</Button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout activeNav="Call Logs">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/logs">
                        <Button variant="ghost" size="icon">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Call Details</h1>
                        <p className="text-muted-foreground">
                            {session.agent_name
                                ? `${session.agent_name} — ID: ${session.room_name.replace(/^(preview-|voxarena-)/, '')}`
                                : `Call — ID: ${session.room_name.replace(/^(preview-|voxarena-)/, '')}`
                            }
                        </p>
                    </div>
                </div>

                {/* Session Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge
                                variant={
                                    session.status === "COMPLETED" ? "secondary" :
                                        session.status === "ACTIVE" ? "default" :
                                            "destructive"
                                }
                            >
                                {session.status?.toLowerCase() || "created"}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-lg font-semibold">{formatDuration(session.duration)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Started</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-sm">
                                {session.started_at ? new Date(session.started_at).toLocaleString() : "N/A"}
                            </span>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-lg font-semibold">{transcripts.length}</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Transcript */}
                <Card>
                    <CardHeader>
                        <CardTitle>Conversation Transcript</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transcripts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No transcript available for this call.</p>
                                <p className="text-sm mt-2">Transcripts are saved during voice sessions.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {transcripts.map((transcript) => (
                                    <div
                                        key={transcript.id}
                                        className={`flex ${transcript.speaker === "USER" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`flex items-start gap-3 max-w-[80%] ${transcript.speaker === "USER" ? "flex-row-reverse" : ""
                                                }`}
                                        >
                                            <div
                                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${transcript.speaker === "USER"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                                    }`}
                                            >
                                                {transcript.speaker === "USER" ? (
                                                    <UserIcon className="h-4 w-4" />
                                                ) : (
                                                    <BotIcon className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div
                                                className={`rounded-lg px-4 py-2 ${transcript.speaker === "USER"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                                    }`}
                                            >
                                                <p className="text-sm">{transcript.content}</p>
                                                <p className="text-xs opacity-70 mt-1">
                                                    {new Date(transcript.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Audio Player (Placeholder for future) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Audio Recording</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Audio recording not available for this call.</p>
                            <p className="text-sm mt-2">Audio recording feature coming soon.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
