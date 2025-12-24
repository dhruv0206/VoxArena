import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/layout-dashboard";

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

function formatDuration(seconds: number | null): string {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default async function CallLogsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Fetch sessions from backend API
    let sessions: any[] = [];
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/sessions/`,
            {
                headers: {
                    'x-user-id': userId,
                },
                cache: 'no-store',
            }
        );
        if (response.ok) {
            sessions = await response.json();
        }
    } catch (error) {
        console.error("Failed to fetch sessions:", error);
    }

    return (
        <DashboardLayout activeNav="Call Logs">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Call Logs</h1>
                    <p className="text-muted-foreground">View history of all voice sessions</p>
                </div>

                {/* Logs */}
                {sessions.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <PhoneIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="font-semibold mb-2">No calls yet</h3>
                            <p className="text-muted-foreground">Start a voice session to see logs here</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Calls</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {sessions.map((session) => (
                                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <MicrophoneIcon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{session.room_name}</p>
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
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
