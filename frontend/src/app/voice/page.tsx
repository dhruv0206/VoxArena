"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { toast } from "sonner";
import { VoiceRoom } from "@/components/livekit/voice-room";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Icons
function MicrophoneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
    );
}

function ArrowLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
    );
}

function LoadingSpinner({ className }: { className?: string }) {
    return (
        <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

type ConnectionState = "idle" | "connecting" | "connected" | "error";

interface Agent {
    id: string;
    name: string;
    type: string;
}

// Default agent that's always available
const defaultAgent: Agent = { id: "default", name: "VoxArena Agent", type: "PIPELINE" };

export default function VoicePage() {
    const router = useRouter();
    const { userId } = useAuth();
    const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
    const [selectedAgent, setSelectedAgent] = useState("default");
    const [agents, setAgents] = useState<Agent[]>([defaultAgent]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(true);
    const [connectionData, setConnectionData] = useState<{
        token: string;
        wsUrl: string;
        roomName: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch user's agents from the API
    useEffect(() => {
        async function fetchAgents() {
            if (!userId) {
                setIsLoadingAgents(false);
                return;
            }
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/agents/`,
                    {
                        headers: {
                            'x-user-id': userId,
                        },
                    }
                );
                if (response.ok) {
                    const userAgents = await response.json();
                    // Combine default agent with user's agents
                    setAgents([defaultAgent, ...userAgents]);
                }
            } catch (error) {
                console.error("Failed to fetch agents:", error);
            } finally {
                setIsLoadingAgents(false);
            }
        }
        fetchAgents();
    }, [userId]);

    const startSession = useCallback(async () => {
        setConnectionState("connecting");
        setError(null);

        try {
            const roomName = `voxarena-${Date.now()}`;
            const response = await fetch("/api/livekit/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomName, agentId: selectedAgent }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to get token");
            }

            const data = await response.json();
            setConnectionData({
                token: data.token,
                wsUrl: data.wsUrl,
                roomName: data.roomName,
            });
            setConnectionState("connected");
            toast.success("Connected to voice session", {
                description: `Room: ${data.roomName}`,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Connection failed";
            setError(message);
            setConnectionState("error");
            toast.error("Connection failed", { description: message });
        }
    }, [selectedAgent]);

    const handleDisconnect = useCallback(async () => {
        // End the session in backend to track duration
        if (connectionData?.roomName) {
            try {
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/sessions/by-room/${connectionData.roomName}/end`,
                    { method: "POST" }
                );
            } catch (error) {
                console.error("Failed to end session:", error);
            }
        }

        setConnectionState("idle");
        setConnectionData(null);
        toast.info("Disconnected from voice session");
    }, [connectionData]);

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card flex flex-col">
                {/* Header */}
                <div className="p-4 border-b">
                    <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeftIcon className="h-4 w-4" />
                        <span className="text-sm">Back to Dashboard</span>
                    </Link>
                </div>

                {/* Logo */}
                <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <MicrophoneIcon className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg">Voice Arena</span>
                    </div>
                </div>

                {/* Agent Selection */}
                <div className="p-4 space-y-4 flex-1">
                    <div className="space-y-2">
                        <Label>Select Agent</Label>
                        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingAgents ? (
                                    <SelectItem value="loading" disabled>
                                        Loading agents...
                                    </SelectItem>
                                ) : (
                                    agents.map((agent) => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            <div className="flex items-center gap-2">
                                                <BotIcon className="h-4 w-4" />
                                                {agent.name}
                                                {agent.id !== "default" && (
                                                    <span className="text-xs text-muted-foreground">({agent.type})</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Status</Label>
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${connectionState === "connected" ? "bg-green-500" :
                                connectionState === "connecting" ? "bg-yellow-500 animate-pulse" :
                                    "bg-muted-foreground"
                                }`} />
                            <span className="text-sm capitalize">{connectionState}</span>
                        </div>
                    </div>
                </div>

                {/* Settings */}
                <div className="p-4 border-t">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        <SettingsIcon className="h-4 w-4" />
                        Voice Settings
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Top Bar */}
                <header className="h-14 border-b flex items-center justify-between px-6">
                    <h1 className="font-semibold">Voice Session</h1>
                    <ThemeToggle />
                </header>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center p-6">
                    {connectionState === "idle" && (
                        <Card className="w-full max-w-md">
                            <CardHeader className="text-center">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <MicrophoneIcon className="h-10 w-10 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Start Voice Session</CardTitle>
                                <CardDescription>
                                    Connect to your AI agent and start a conversation
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Model Stack */}
                                <div className="rounded-lg border bg-card">
                                    <div className="p-3 border-b">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Voice Pipeline</p>
                                    </div>
                                    <div className="divide-y">
                                        <div className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-blue-500">STT</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Deepgram</p>
                                                    <p className="text-xs text-muted-foreground">Speech to Text</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">nova-2</span>
                                        </div>
                                        <div className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-purple-500">LLM</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Google Gemini</p>
                                                    <p className="text-xs text-muted-foreground">Language Model</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">3.0-flash</span>
                                        </div>
                                        <div className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-green-500">TTS</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Resemble AI</p>
                                                    <p className="text-xs text-muted-foreground">Text to Speech</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">custom</span>
                                        </div>
                                    </div>
                                </div>
                                <Button size="lg" onClick={startSession} className="w-full gap-2">
                                    <MicrophoneIcon className="h-5 w-5" />
                                    Start Session
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {connectionState === "connecting" && (
                        <Card className="w-full max-w-md">
                            <CardContent className="py-16 text-center">
                                <LoadingSpinner className="h-12 w-12 mx-auto mb-4 text-primary" />
                                <h3 className="text-xl font-semibold">Connecting...</h3>
                                <p className="text-muted-foreground mt-2">
                                    Setting up your voice session
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {connectionState === "connected" && connectionData && (
                        <div className="w-full h-full">
                            <VoiceRoom
                                token={connectionData.token}
                                serverUrl={connectionData.wsUrl}
                                roomName={connectionData.roomName}
                                onDisconnect={handleDisconnect}
                                agentName={agents.find(a => a.id === selectedAgent)?.name}
                            />
                        </div>
                    )}

                    {connectionState === "error" && (
                        <Card className="w-full max-w-md border-destructive/50">
                            <CardContent className="py-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <span className="text-3xl">⚠️</span>
                                </div>
                                <h3 className="text-xl font-semibold text-destructive">Connection Failed</h3>
                                <p className="text-muted-foreground mt-2 mb-6">{error}</p>
                                <div className="flex gap-4 justify-center">
                                    <Button variant="outline" onClick={() => setConnectionState("idle")}>
                                        Try Again
                                    </Button>
                                    <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                                        Back to Dashboard
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
