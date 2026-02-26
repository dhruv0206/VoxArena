import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import type { VoiceSession, SessionsPage } from "@/lib/api";

// ─── Session label resolver ──────────────────────────────────────────────────
function resolveSessionLabel(session: { agent_name?: string | null; room_name: string }): {
    primary: string
    secondary: string
} {
    const room = session.room_name || ''
    const sipMatch = room.match(/^_?(\+\d{7,15})/)
    if (session.agent_name) {
        if (sipMatch) return { primary: session.agent_name, secondary: `SIP via ${sipMatch[1]}` }
        const shortId = room.replace(/^(preview-|voxarena-)/, '').slice(0, 18)
        return { primary: session.agent_name, secondary: `ID: ${shortId}` }
    }
    if (sipMatch) return { primary: 'SIP Call', secondary: `via ${sipMatch[1]}` }
    if (room.startsWith('preview-')) return { primary: 'Preview', secondary: room.replace('preview-', '').slice(0, 18) }
    return { primary: 'Unassigned Call', secondary: room.replace(/^voxarena-/, '').slice(0, 18) }
}

function MicrophoneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
    );
}

function PhoneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
    );
}

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const user = await currentUser();

    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const headers = { 'x-user-id': userId };

    const recentRes = await fetch(`${apiUrl}/sessions/?limit=5`, { headers, cache: 'no-store' });

    const recentData: SessionsPage | null = recentRes.ok ? await recentRes.json().catch(() => null) : null;
    const recentSessions: VoiceSession[] = recentData?.sessions ?? [];

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <DashboardLayout activeNav="Dashboard">
            <div className="space-y-6">
                {/* Welcome */}
                <div>
                    <p className="text-sm text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
                    <h1 className="text-2xl font-bold">Welcome {user?.firstName || "back"}!</h1>
                </div>

                {/* Stat Row + Call Volume Chart */}
                <DashboardStats userId={userId} />

                {/* Recent Calls */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Recent Calls</CardTitle>
                            <Link href="/dashboard/logs">
                                <Button variant="ghost" size="sm">View all</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentSessions.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                                <PhoneIcon className="h-12 w-12 mb-4 opacity-50" />
                                <p className="font-medium">Oops...</p>
                                <p className="text-sm">You don&apos;t have any calls yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentSessions.map((session) => (
                                    <Link key={session.id} href={`/dashboard/logs/${session.id}`} className="block">
                                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <MicrophoneIcon className="h-5 w-5" />
                                                    {session.analysis?.sentiment && (
                                                        <span
                                                            className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                                                                    session.analysis.sentiment === "positive"
                                                                        ? "bg-emerald-500"
                                                                        : session.analysis.sentiment === "negative"
                                                                            ? "bg-red-500"
                                                                            : "bg-yellow-500"
                                                            }`}
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    {(() => {
                                                        const { primary, secondary } = resolveSessionLabel(session)
                                                        return (
                                                            <p className="font-medium text-sm">
                                                                {primary}
                                                                <span className="text-muted-foreground ml-1 font-normal">
                                                                    — {secondary}
                                                                </span>
                                                            </p>
                                                        )
                                                    })()}
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(session.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{formatDuration(session.duration || 0)}</p>
                                                <Badge variant={session.status === 'COMPLETED' ? 'secondary' : 'default'} className="text-[10px] h-4">
                                                    {session.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="flex gap-4">
                    <Link href="/preview">
                        <Button size="lg" className="gap-2">
                            <MicrophoneIcon className="h-5 w-5" />
                            Start Voice Session
                        </Button>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
