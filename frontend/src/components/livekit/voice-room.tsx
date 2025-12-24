"use client";

import { useCallback, useEffect, useState } from "react";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useLocalParticipant,
    useConnectionState,
    useDataChannel,
    useParticipants,
    useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { ConnectionState, RoomEvent } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Icons
function MicrophoneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
    );
}

function MicrophoneOffIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3zM2.25 2.25l19.5 19.5" />
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

function BotIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
    );
}

interface Transcript {
    id: string;
    speaker: "user" | "agent";
    text: string;
    timestamp: Date;
}

interface VoiceRoomProps {
    token: string;
    serverUrl: string;
    roomName: string;
    onDisconnect: () => void;
}

function ControlBar({ onDisconnect }: { onDisconnect: () => void }) {
    const { localParticipant } = useLocalParticipant();
    const [isMuted, setIsMuted] = useState(false);

    const toggleMicrophone = useCallback(async () => {
        if (localParticipant) {
            await localParticipant.setMicrophoneEnabled(isMuted);
            setIsMuted(!isMuted);
        }
    }, [localParticipant, isMuted]);

    return (
        <div className="flex items-center justify-center gap-4 p-4">
            <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="h-14 w-14 rounded-full"
                onClick={toggleMicrophone}
            >
                {isMuted ? (
                    <MicrophoneOffIcon className="h-6 w-6" />
                ) : (
                    <MicrophoneIcon className="h-6 w-6" />
                )}
            </Button>
            <Button
                variant="destructive"
                size="lg"
                className="h-14 w-14 rounded-full"
                onClick={onDisconnect}
            >
                <PhoneOffIcon className="h-6 w-6" />
            </Button>
        </div>
    );
}

function ConnectionStatus() {
    const connectionState = useConnectionState();
    const participants = useParticipants();

    // Check if agent is connected (usually has "agent" in identity)
    const agentConnected = participants.some(p =>
        p.identity.toLowerCase().includes("agent") ||
        p.isAgent
    );

    const statusConfig = {
        [ConnectionState.Connected]: {
            label: agentConnected ? "Agent Connected" : "Waiting for Agent...",
            variant: agentConnected ? "default" as const : "secondary" as const
        },
        [ConnectionState.Connecting]: { label: "Connecting...", variant: "secondary" as const },
        [ConnectionState.Disconnected]: { label: "Disconnected", variant: "destructive" as const },
        [ConnectionState.Reconnecting]: { label: "Reconnecting...", variant: "secondary" as const },
        [ConnectionState.SignalReconnecting]: { label: "Reconnecting...", variant: "secondary" as const },
    };

    const config = statusConfig[connectionState] || { label: "Unknown", variant: "secondary" as const };

    return (
        <div className="flex items-center gap-2">
            <Badge variant={config.variant} className="text-sm">
                {config.label}
            </Badge>
            {agentConnected && (
                <Badge variant="outline" className="text-sm gap-1">
                    <BotIcon className="h-3 w-3" />
                    AI Agent Active
                </Badge>
            )}
        </div>
    );
}

function TranscriptDisplay({ transcripts }: { transcripts: Transcript[] }) {
    return (
        <Card className="w-full max-w-2xl max-h-64 overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-48">
                {transcripts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                        Start speaking to see transcriptions...
                    </p>
                ) : (
                    <div className="space-y-3">
                        {transcripts.map((t) => (
                            <div
                                key={t.id}
                                className={`flex ${t.speaker === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 ${t.speaker === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                        }`}
                                >
                                    <p className="text-sm">{t.text}</p>
                                    <p className="text-xs opacity-70 mt-1">
                                        {t.speaker === "user" ? "You" : "Agent"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AudioVisualizer() {
    const [levels, setLevels] = useState([20, 30, 40, 30, 20]);

    useEffect(() => {
        const interval = setInterval(() => {
            setLevels(prev => prev.map(() => 15 + Math.random() * 50));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center justify-center gap-1 h-16">
            {levels.map((height, i) => (
                <div
                    key={i}
                    className="w-2 bg-primary rounded-full transition-all duration-100"
                    style={{ height: `${height}px` }}
                />
            ))}
        </div>
    );
}

function CallDuration() {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center justify-center gap-2 text-lg font-mono">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-foreground">{formatTime(seconds)}</span>
        </div>
    );
}

function RoomContent({ onDisconnect, roomName }: { onDisconnect: () => void; roomName: string }) {
    const room = useRoomContext();
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);

    // Function to save transcript to backend
    const saveTranscriptToBackend = useCallback(async (text: string, speaker: "user" | "agent") => {
        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/sessions/by-room/${roomName}/transcripts`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: text,
                        speaker: speaker.toUpperCase(),
                    }),
                }
            );
        } catch (error) {
            console.error("Failed to save transcript:", error);
        }
    }, [roomName]);

    // Listen for transcription data from the agent
    useEffect(() => {
        if (!room) return;

        const handleTranscription = (payload: Uint8Array) => {
            try {
                const text = new TextDecoder().decode(payload);
                const data = JSON.parse(text);

                if (data.type === "transcription" || data.type === "transcript") {
                    const speaker = data.speaker === "agent" ? "agent" : "user";
                    const transcriptText = data.text || data.content;

                    setTranscripts(prev => [...prev, {
                        id: crypto.randomUUID(),
                        speaker: speaker,
                        text: transcriptText,
                        timestamp: new Date(),
                    }]);

                    // Save to backend
                    saveTranscriptToBackend(transcriptText, speaker);
                }
            } catch {
                // Not JSON, might be raw text
            }
        };

        room.on(RoomEvent.DataReceived, handleTranscription);
        return () => {
            room.off(RoomEvent.DataReceived, handleTranscription);
        };
    }, [room, saveTranscriptToBackend]);

    // Listen for agent transcription events (LiveKit Agent Builder format)
    useEffect(() => {
        if (!room) return;

        const handleTranscription = (
            segments: { text: string; final: boolean; id: string }[],
            participant?: { identity: string; isAgent?: boolean },
        ) => {
            segments.forEach(segment => {
                if (segment.final && segment.text.trim()) {
                    // Determine if this is from the agent or user
                    // Agent typically has "agent" in identity or isAgent flag
                    const isAgent = participant?.isAgent ||
                        participant?.identity?.toLowerCase().includes("agent") ||
                        participant?.identity?.toLowerCase().includes("voxarena");

                    const speaker = isAgent ? "agent" : "user";

                    setTranscripts(prev => [...prev, {
                        id: segment.id || crypto.randomUUID(),
                        speaker: speaker,
                        text: segment.text,
                        timestamp: new Date(),
                    }]);

                    // Save to backend
                    saveTranscriptToBackend(segment.text, speaker);
                }
            });
        };

        // @ts-ignore - transcription event from LiveKit
        room.on("transcriptionReceived", handleTranscription);
        return () => {
            // @ts-ignore
            room.off("transcriptionReceived", handleTranscription);
        };
    }, [room, saveTranscriptToBackend]);

    return (
        <div className="flex flex-col items-center justify-center gap-6 p-8">
            <ConnectionStatus />

            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <div className="text-center mb-4">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <BotIcon className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">VoxArena Agent</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            Room: {room.name}
                        </p>
                        <div className="mt-3">
                            <CallDuration />
                        </div>
                    </div>
                    <AudioVisualizer />
                </CardContent>
            </Card>

            <Separator className="w-full max-w-2xl" />

            <TranscriptDisplay transcripts={transcripts} />

            <ControlBar onDisconnect={onDisconnect} />
            <RoomAudioRenderer />
        </div>
    );
}

export function VoiceRoom({ token, serverUrl, roomName, onDisconnect }: VoiceRoomProps) {
    return (
        <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={onDisconnect}
            className="h-full"
        >
            <RoomContent onDisconnect={onDisconnect} roomName={roomName} />
        </LiveKitRoom>
    );
}
