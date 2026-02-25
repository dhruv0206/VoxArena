"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

function PhoneOutgoingIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 3.75v4.5m0-4.5h-4.5m4.5 0l-6 6m3 2.25c0 8.284-6.716 15-15 15h-2.25a2.25 2.25 0 01-2.25-2.25v-1.372c0-.516.351-.966.852-1.091l4.423-1.106c.44-.11.902.055 1.173.417l.97 1.293c.282.376.769.542 1.21.38a12.035 12.035 0 007.143-7.143c.162-.441-.004-.928-.38-1.21l-1.293-.97a1.125 1.125 0 01-.417-1.173l1.106-4.423c.125-.501.575-.852 1.091-.852H21.75A2.25 2.25 0 0124 4.5v2.25z" />
        </svg>
    );
}

function PhoneXIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15v-2.25A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.055.902-.417 1.173l-.97.97c-.376.282-.542.769-.38 1.21a12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.501.125.852.575.852 1.091V21.75a2.25 2.25 0 01-2.25 2.25h-2.25z" />
        </svg>
    );
}

const COUNTRY_CODES = [
    { code: "+1", country: "US/CA", flag: "US" },
    { code: "+44", country: "UK", flag: "GB" },
    { code: "+61", country: "AU", flag: "AU" },
    { code: "+91", country: "IN", flag: "IN" },
    { code: "+49", country: "DE", flag: "DE" },
    { code: "+33", country: "FR", flag: "FR" },
    { code: "+81", country: "JP", flag: "JP" },
    { code: "+86", country: "CN", flag: "CN" },
    { code: "+55", country: "BR", flag: "BR" },
    { code: "+52", country: "MX", flag: "MX" },
    { code: "+34", country: "ES", flag: "ES" },
    { code: "+39", country: "IT", flag: "IT" },
    { code: "+82", country: "KR", flag: "KR" },
    { code: "+31", country: "NL", flag: "NL" },
    { code: "+46", country: "SE", flag: "SE" },
    { code: "+41", country: "CH", flag: "CH" },
    { code: "+65", country: "SG", flag: "SG" },
    { code: "+972", country: "IL", flag: "IL" },
    { code: "+971", country: "AE", flag: "AE" },
    { code: "+64", country: "NZ", flag: "NZ" },
];

type CallStatus = "idle" | "initiating" | "ringing" | "answered" | "completed" | "failed";

function isValidE164(phone: string): boolean {
    return /^\+[1-9]\d{6,14}$/.test(phone);
}

function formatTimer(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

interface OutboundCallModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agentId: string;
    agentName: string;
    userId: string;
}

export function OutboundCallModal({ open, onOpenChange, agentId, agentName, userId }: OutboundCallModalProps) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    // Dialer state
    const [countryCode, setCountryCode] = useState("+1");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [callStatus, setCallStatus] = useState<CallStatus>("idle");
    const [callId, setCallId] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [calledNumber, setCalledNumber] = useState("");

    // Refs for intervals
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fullNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;
    const isValidNumber = phoneNumber.length > 0 && isValidE164(fullNumber);

    // Clean up intervals on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, []);

    // Poll call status
    const startPolling = useCallback((id: string) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${apiUrl}/telephony/outbound/call/${id}/status`, {
                    headers: { "x-user-id": userId },
                });
                if (!res.ok) return;
                const data = await res.json();
                const status = data.status as string;

                if (status === "answered" || status === "in-progress") {
                    setCallStatus("answered");
                } else if (status === "completed") {
                    setCallStatus("completed");
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                } else if (status === "failed" || status === "busy" || status === "no-answer" || status === "canceled") {
                    setCallStatus("failed");
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                }
            } catch {
                // Polling error — continue
            }
        }, 2000);
    }, [apiUrl, userId]);

    // Start duration timer when call is answered
    useEffect(() => {
        if (callStatus === "answered") {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setDuration(0);
            timerIntervalRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        }
        return () => {
            if (callStatus === "completed" || callStatus === "failed") {
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            }
        };
    }, [callStatus]);

    const handleInitiateCall = useCallback(async () => {
        if (!isValidNumber) return;
        setCallStatus("initiating");
        setCalledNumber(fullNumber);
        setDuration(0);

        try {
            const res = await fetch(`${apiUrl}/telephony/outbound/call`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": userId,
                },
                body: JSON.stringify({
                    agent_id: agentId,
                    phone_number: fullNumber,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to initiate call");
            }

            const data = await res.json();
            setCallId(data.call_id);
            setCallStatus("ringing");
            startPolling(data.call_id);
            toast.success("Call initiated!");
        } catch (error: any) {
            setCallStatus("failed");
            toast.error(error.message || "Failed to initiate call");
        }
    }, [apiUrl, userId, agentId, fullNumber, isValidNumber, startPolling]);

    const handleEndCall = useCallback(async () => {
        if (!callId) return;

        try {
            await fetch(`${apiUrl}/telephony/outbound/call/${callId}/end`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": userId,
                },
            });
            setCallStatus("completed");
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            toast.success("Call ended.");
        } catch {
            toast.error("Failed to end call");
        }
    }, [apiUrl, userId, callId]);

    const handleReset = () => {
        setCallStatus("idle");
        setCallId(null);
        setDuration(0);
        setPhoneNumber("");
        setCalledNumber("");
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };

    const handleClose = () => {
        if (callStatus === "ringing" || callStatus === "answered" || callStatus === "initiating") {
            // Don't allow closing during active call
            return;
        }
        handleReset();
        onOpenChange(false);
    };

    const isCallActive = callStatus === "ringing" || callStatus === "answered" || callStatus === "initiating";

    const statusDisplay: Record<CallStatus, { label: string; color: string }> = {
        idle: { label: "Ready", color: "text-muted-foreground" },
        initiating: { label: "Initiating...", color: "text-yellow-500" },
        ringing: { label: "Ringing...", color: "text-yellow-500" },
        answered: { label: "Connected", color: "text-emerald-500" },
        completed: { label: "Call Ended", color: "text-muted-foreground" },
        failed: { label: "Call Failed", color: "text-red-500" },
    };

    return (
        <Dialog open={open} onOpenChange={isCallActive ? undefined : handleClose}>
            <DialogContent showCloseButton={!isCallActive}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PhoneOutgoingIcon className="h-5 w-5" />
                        Make a Call
                    </DialogTitle>
                    <DialogDescription>
                        Place an outbound call from <strong>{agentName}</strong>
                    </DialogDescription>
                </DialogHeader>

                {/* Dialer View */}
                {callStatus === "idle" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <div className="flex gap-2">
                                <Select value={countryCode} onValueChange={setCountryCode}>
                                    <SelectTrigger className="w-28">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRY_CODES.map((cc) => (
                                            <SelectItem key={cc.code} value={cc.code}>
                                                {cc.code} {cc.country}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="2125551234"
                                    className="flex-1 font-mono"
                                    type="tel"
                                />
                            </div>
                            {phoneNumber.length > 0 && !isValidNumber && (
                                <p className="text-xs text-red-500">
                                    Enter a valid phone number (E.164: {countryCode} + digits)
                                </p>
                            )}
                            {isValidNumber && (
                                <p className="text-xs text-muted-foreground font-mono">
                                    Will call: {fullNumber}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Call In-Progress View */}
                {callStatus !== "idle" && (
                    <div className="space-y-6 py-4">
                        {/* Called number */}
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Calling</p>
                            <p className="text-2xl font-bold font-mono tracking-wide">{calledNumber}</p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-center gap-2">
                            {(callStatus === "ringing" || callStatus === "initiating") && (
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                </span>
                            )}
                            {callStatus === "answered" && (
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            )}
                            <span className={`text-sm font-medium ${statusDisplay[callStatus].color}`}>
                                {statusDisplay[callStatus].label}
                            </span>
                        </div>

                        {/* Duration timer */}
                        {(callStatus === "answered" || callStatus === "completed") && (
                            <div className="text-center">
                                <p className="text-4xl font-mono font-bold tabular-nums">
                                    {formatTimer(duration)}
                                </p>
                            </div>
                        )}

                        {/* End call / New call buttons */}
                        <div className="flex justify-center gap-3">
                            {isCallActive && (
                                <Button
                                    variant="destructive"
                                    size="lg"
                                    onClick={handleEndCall}
                                    className="gap-2 px-8"
                                >
                                    <PhoneXIcon className="h-5 w-5" />
                                    End Call
                                </Button>
                            )}
                            {(callStatus === "completed" || callStatus === "failed") && (
                                <>
                                    <Button variant="outline" onClick={handleReset}>
                                        New Call
                                    </Button>
                                    <Button variant="outline" onClick={() => { handleReset(); onOpenChange(false); }}>
                                        Close
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer with Call button (only in idle state) */}
                {callStatus === "idle" && (
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleInitiateCall}
                            disabled={!isValidNumber}
                            className="gap-2"
                        >
                            <PhoneOutgoingIcon className="h-4 w-4" />
                            Call
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
