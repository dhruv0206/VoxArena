"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { toast } from "sonner";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useRoomContext,
    useConnectionState,
    useParticipants,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { ConnectionState, RoomEvent, TranscriptionSegment, Participant, TrackPublication } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

function PhoneOffIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.31 0-15-6.69-15-15 0-.966.09-1.91.264-2.824A3.75 3.75 0 016.264 2.25l2.235.001a2.25 2.25 0 012.159 1.636l1.05 3.674a2.25 2.25 0 01-.514 2.25l-.993.993a.75.75 0 00-.17.79c.33.87.79 1.685 1.365 2.42a.75.75 0 00.79.17l.993-.993a2.25 2.25 0 012.25-.514l3.674 1.05a2.25 2.25 0 011.636 2.159v2.235a3.75 3.75 0 01-2.5 3.535 16.41 16.41 0 01-2.824.264z" />
        </svg>
    );
}

// Models configuration
const sttModels = [
    { id: "deepgram-nova-2", name: "Deepgram Nova-2", provider: "Deepgram" },
];

const llmModels = [
    { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", provider: "Google" },
];

const ttsModels = [
    { id: "resemble-custom", name: "Resemble AI", provider: "Resemble" },
];

// Animated Voice Orb Component
function VoiceOrb({ isActive, isSpeaking }: { isActive: boolean; isSpeaking: boolean }) {
    return (
        <div className="relative flex items-center justify-center">
            {/* Outer pulse rings */}
            {isSpeaking && (
                <>
                    <div className="absolute w-24 h-24 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                    <div className="absolute w-20 h-20 rounded-full bg-green-500/30 animate-ping" style={{ animationDuration: '1s' }} />
                </>
            )}
            {/* Main orb */}
            <div className={`
                relative w-16 h-16 rounded-full flex items-center justify-center
                ${isActive ? 'bg-green-500' : 'bg-gray-400'}
                ${isSpeaking ? 'scale-110' : 'scale-100'}
                transition-all duration-200 shadow-lg
            `}>
                <div className={`
                    absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent
                `} />
            </div>
        </div>
    );
}

// Phone UI Component
function PhoneUI({
    title,
    model,
    isActive,
    isSpeaking,
    time,
}: {
    title: string;
    model: string;
    isActive: boolean;
    isSpeaking: boolean;
    time: string;
}) {
    return (
        <div className="relative w-full max-w-xs mx-auto">
            {/* Phone Frame */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-1 shadow-2xl">
                <div className="bg-black rounded-[22px] overflow-hidden">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between px-6 py-2 text-white text-xs">
                        <span className="font-medium">{time}</span>
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                            </svg>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
                            </svg>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-8 flex flex-col items-center min-h-[200px]">
                        <VoiceOrb isActive={isActive} isSpeaking={isSpeaking} />

                        <div className="mt-6 flex items-center justify-center">
                            <MicrophoneIcon className="w-6 h-6 text-gray-400" />
                        </div>

                        <p className="mt-4 text-white text-sm font-medium">{title}</p>
                        <p className="mt-1 text-gray-400 text-xs">Model: {model}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Transcript Message Component
function TranscriptMessage({
    text,
    isUser,
}: {
    text: string;
    isUser: boolean;
}) {
    return (
        <div className={`
            px-4 py-2 rounded-2xl max-w-[90%] text-sm
            ${isUser
                ? 'bg-gray-700 text-white self-start'
                : 'bg-green-500 text-white self-end'
            }
        `}>
            {text}
        </div>
    );
}

interface Transcript {
    id: string;
    speaker: "user" | "agent";
    text: string;
}

type ConnectionStateType = "idle" | "connecting" | "connected" | "error";

// Preview Content Component
function PreviewContent({
    onDisconnect,
    selectedModel,
}: {
    onDisconnect: () => void;
    selectedModel: string;
}) {
    const room = useRoomContext();
    const connectionState = useConnectionState();
    const participants = useParticipants();
    const [userTranscripts, setUserTranscripts] = useState<Transcript[]>([]);
    const [agentTranscripts, setAgentTranscripts] = useState<Transcript[]>([]);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
    const [seconds, setSeconds] = useState(0);

    // Timer
    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = () => {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    // Listen for transcription events (Standard + DataPacket fallback)
    useEffect(() => {
        if (!room) return;

        // Standard LiveKit Transcription Event
        const handleTranscription = (
            segments: TranscriptionSegment[],
            participant?: Participant,
            publication?: TrackPublication
        ) => {
            for (const segment of segments) {
                if (!segment.final) continue; // Only show final transcripts for now

                const isAgent = participant?.identity?.toLowerCase().includes("agent") || participant?.isAgent;
                const transcript: Transcript = {
                    id: segment.id,
                    speaker: isAgent ? "agent" : "user",
                    text: segment.text,
                };

                if (transcript.speaker === "user") {
                    setUserTranscripts((prev) => [...prev, transcript]);
                    setIsUserSpeaking(true);
                    setTimeout(() => setIsUserSpeaking(false), 1500);
                } else {
                    setAgentTranscripts((prev) => [...prev, transcript]);
                    setIsAgentSpeaking(true);
                    setTimeout(() => setIsAgentSpeaking(false), 2000);
                }
            }
        };

        const handleData = (payload: Uint8Array) => {
            try {
                const text = new TextDecoder().decode(payload);
                const data = JSON.parse(text);

                if (data.type === "transcription" || data.type === "transcript") {
                    const transcript: Transcript = {
                        id: crypto.randomUUID(),
                        speaker: data.speaker === "agent" ? "agent" : "user",
                        text: data.text || data.content,
                    };

                    if (transcript.speaker === "user") {
                        setUserTranscripts((prev) => [...prev, transcript]);
                        setIsUserSpeaking(true);
                        setTimeout(() => setIsUserSpeaking(false), 1500);
                    } else {
                        setAgentTranscripts((prev) => [...prev, transcript]);
                        setIsAgentSpeaking(true);
                        setTimeout(() => setIsAgentSpeaking(false), 2000);
                    }
                }
            } catch {
                // Not JSON
            }
        };

        room.on(RoomEvent.TranscriptionReceived, handleTranscription);
        room.on(RoomEvent.DataReceived, handleData);

        return () => {
            room.off(RoomEvent.TranscriptionReceived, handleTranscription);
            room.off(RoomEvent.DataReceived, handleData);
        };
    }, [room]);

    const isConnected = connectionState === ConnectionState.Connected;
    const agentConnected = participants.some(p =>
        p.identity.toLowerCase().includes("agent") || p.isAgent
    );

    return (
        <div className="flex flex-col h-full">
            {/* Status Bar */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <Badge variant={isConnected ? "default" : "secondary"}>
                        {isConnected ? "Connected" : "Connecting..."}
                    </Badge>
                    {agentConnected && (
                        <Badge variant="outline" className="gap-1">
                            🤖 Agent Active
                        </Badge>
                    )}
                </div>
                <Button variant="destructive" size="sm" onClick={onDisconnect} className="gap-2">
                    <PhoneOffIcon className="h-4 w-4" />
                    End Call
                </Button>
            </div>

            {/* Split View */}
            <div className="flex-1 grid grid-cols-2 gap-4 p-4 overflow-hidden">
                {/* Left Side - User */}
                <div className="flex flex-col gap-4 h-full">
                    <PhoneUI
                        title="Voice Mode Active..."
                        model="Deepgram Nova-2"
                        isActive={isConnected}
                        isSpeaking={isUserSpeaking}
                        time={formatTime()}
                    />

                    {/* User Transcripts */}
                    <Card className="flex-1 overflow-hidden">
                        <CardContent className="p-4 h-full overflow-y-auto">
                            <p className="text-xs text-muted-foreground mb-3 font-medium">Your Speech</p>
                            <div className="flex flex-col gap-2">
                                {userTranscripts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">Start speaking...</p>
                                ) : (
                                    userTranscripts.map((t) => (
                                        <TranscriptMessage key={t.id} text={t.text} isUser={true} />
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side - Agent */}
                <div className="flex flex-col gap-4 h-full">
                    <PhoneUI
                        title={isAgentSpeaking ? "Agent Replying..." : "Agent Listening..."}
                        model="Resemble AI"
                        isActive={agentConnected}
                        isSpeaking={isAgentSpeaking}
                        time={formatTime()}
                    />

                    {/* Agent Transcripts */}
                    <Card className="flex-1 overflow-hidden">
                        <CardContent className="p-4 h-full overflow-y-auto">
                            <p className="text-xs text-muted-foreground mb-3 font-medium">Agent Response</p>
                            <div className="flex flex-col gap-2">
                                {agentTranscripts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">Waiting for response...</p>
                                ) : (
                                    agentTranscripts.map((t) => (
                                        <TranscriptMessage key={t.id} text={t.text} isUser={false} />
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <RoomAudioRenderer />
        </div>
    );
}

export default function PreviewPage() {
    const router = useRouter();
    const { userId } = useAuth();
    const [connectionState, setConnectionState] = useState<ConnectionStateType>("idle");
    const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-exp");
    const [connectionData, setConnectionData] = useState<{
        token: string;
        wsUrl: string;
        roomName: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startSession = useCallback(async () => {
        setConnectionState("connecting");
        setError(null);

        try {
            const roomName = `preview-${Date.now()}`;
            const response = await fetch("/api/livekit/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomName }),
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
            toast.success("Preview session started");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Connection failed";
            setError(message);
            setConnectionState("error");
            toast.error("Connection failed", { description: message });
        }
    }, []);

    const handleDisconnect = useCallback(() => {
        setConnectionState("idle");
        setConnectionData(null);
        toast.info("Preview session ended");
    }, []);

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-72 border-r bg-card flex flex-col">
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
                        <span className="font-bold text-lg">Model Preview</span>
                    </div>
                </div>

                {/* Model Selection */}
                <div className="p-4 space-y-6 flex-1">
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Speech-to-Text
                        </Label>
                        <Select defaultValue="deepgram-nova-2" disabled>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {sttModels.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Language Model
                        </Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {llmModels.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Text-to-Speech
                        </Label>
                        <Select defaultValue="resemble-custom" disabled>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ttsModels.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4">
                        <div className="rounded-lg border bg-muted/50 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Current Pipeline</p>
                            <div className="flex items-center gap-1 text-xs">
                                <Badge variant="outline" className="text-[10px]">Deepgram</Badge>
                                <span>→</span>
                                <Badge variant="outline" className="text-[10px]">Gemini</Badge>
                                <span>→</span>
                                <Badge variant="outline" className="text-[10px]">Resemble</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <div className="p-4 border-t">
                    {connectionState === "idle" && (
                        <Button className="w-full gap-2" onClick={startSession}>
                            <MicrophoneIcon className="h-4 w-4" />
                            Start Preview
                        </Button>
                    )}
                    {connectionState === "connecting" && (
                        <Button className="w-full" disabled>
                            Connecting...
                        </Button>
                    )}
                    {connectionState === "error" && (
                        <div className="space-y-2">
                            <p className="text-xs text-destructive">{error}</p>
                            <Button className="w-full" variant="outline" onClick={startSession}>
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-14 border-b flex items-center justify-between px-6">
                    <h1 className="font-semibold">Model Testing Preview</h1>
                    <ThemeToggle />
                </header>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {connectionState === "idle" && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <MicrophoneIcon className="h-12 w-12 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Model Preview</h2>
                                <p className="text-muted-foreground max-w-md">
                                    Test your voice pipeline in real-time. Select your models and start a preview session.
                                </p>
                            </div>
                        </div>
                    )}

                    {connectionState === "connecting" && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                <p className="text-muted-foreground">Starting preview session...</p>
                            </div>
                        </div>
                    )}

                    {connectionState === "connected" && connectionData && (
                        <LiveKitRoom
                            token={connectionData.token}
                            serverUrl={connectionData.wsUrl}
                            connect={true}
                            audio={true}
                            video={false}
                            onDisconnected={handleDisconnect}
                            className="h-full"
                        >
                            <PreviewContent
                                onDisconnect={handleDisconnect}
                                selectedModel={selectedModel}
                            />
                        </LiveKitRoom>
                    )}

                    {connectionState === "error" && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <span className="text-3xl">⚠️</span>
                                </div>
                                <p className="text-destructive font-medium">Connection Failed</p>
                                <p className="text-muted-foreground mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
