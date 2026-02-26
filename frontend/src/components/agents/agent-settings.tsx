"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebhookConfig, WebhookConfigState } from "./webhook-config";
import { FunctionConfig, FunctionDefinition } from "./function-config";
import { OutboundCallModal } from "./outbound-call-modal";

function ArrowLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
    );
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
        </svg>
    );
}

function PlayIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
        </svg>
    );
}

function CodeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
    );
}

function TrashIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
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

function PhoneOutgoingIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 3.75v4.5m0-4.5h-4.5m4.5 0l-6 6m3 2.25c0 8.284-6.716 15-15 15h-2.25a2.25 2.25 0 01-2.25-2.25v-1.372c0-.516.351-.966.852-1.091l4.423-1.106c.44-.11.902.055 1.173.417l.97 1.293c.282.376.769.542 1.21.38a12.035 12.035 0 007.143-7.143c.162-.441-.004-.928-.38-1.21l-1.293-.97a1.125 1.125 0 01-.417-1.173l1.106-4.423c.125-.501.575-.852 1.091-.852H21.75A2.25 2.25 0 0124 4.5v2.25z" />
        </svg>
    );
}

interface Agent {
    id: string;
    name: string;
    description: string | null;
    type: string;
    is_active: boolean;
    phone_number?: string | null;
    twilio_sid?: string | null;
    config: {
        system_prompt?: string;
        first_message?: string;
        first_message_mode?: string;
        llm_provider?: string;
        llm_model?: string;
        stt_provider?: string;
        voice_id?: string;
        template?: string;
        webhooks?: WebhookConfigState;
        functions?: FunctionDefinition[];
    };
}

interface AgentSettingsProps {
    agent: Agent;
    userId: string;
}

const LLM_MODELS = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
];

const FIRST_MESSAGE_MODES = [
    { id: "assistant_speaks_first", name: "Assistant speaks first" },
    { id: "assistant_waits", name: "Assistant waits for user" },
];

const STT_PROVIDERS = [
    { id: "deepgram", name: "Deepgram Nova 2" },
    { id: "assemblyai", name: "AssemblyAI" },
    { id: "elevenlabs", name: "ElevenLabs" },
];

interface ResembleVoice {
    id: string;
    name: string;
    language: string;
    source?: string;
    voice_type?: string;
}

interface ResembleVoicesPage {
    voices: ResembleVoice[];
    page: number;
    page_size: number;
    total_pages: number;
    total_count: number;
}

const DEFAULT_WEBHOOK_CONFIG: WebhookConfigState = {
    pre_call: {
        enabled: false,
        url: "",
        method: "GET",
        timeout: 5,
        headers: [],
        assignments: [],
    },
    post_call: {
        enabled: false,
        url: "",
        method: "POST",
        timeout: 10,
        headers: [],
        body: "",
    },
};

export function AgentSettings({ agent, userId }: AgentSettingsProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isTestingCall, setIsTestingCall] = useState(false);
    const [isOutboundCallOpen, setIsOutboundCallOpen] = useState(false);

    // Form state
    const [name, setName] = useState(agent.name);
    const [llmModel, setLlmModel] = useState(agent.config?.llm_model || "gemini-2.5-flash");
    const [firstMessageMode, setFirstMessageMode] = useState(agent.config?.first_message_mode || "assistant_speaks_first");
    const [firstMessage, setFirstMessage] = useState(agent.config?.first_message || "");
    const [systemPrompt, setSystemPrompt] = useState(agent.config?.system_prompt || "");
    const [sttProvider, setSttProvider] = useState(agent.config?.stt_provider || "assemblyai");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    const [voiceId, setVoiceId] = useState(agent.config?.voice_id || "");
    const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
    const [resembleVoices, setResembleVoices] = useState<ResembleVoice[]>([]);
    const [isLoadingVoices, setIsLoadingVoices] = useState(true);
    const [voicePage, setVoicePage] = useState(1);
    const [voiceTotalPages, setVoiceTotalPages] = useState(1);
    const [voiceTotalCount, setVoiceTotalCount] = useState(0);
    const [voiceLanguage, setVoiceLanguage] = useState<string>(""); // "" = All
    const [allLanguages, setAllLanguages] = useState<string[]>([]);
    const VOICES_PER_PAGE = 12;

    // Resolve saved voice name immediately on mount
    useEffect(() => {
        if (!agent.config?.voice_id) return;
        fetch(`${apiUrl}/resemble/voices/${agent.config.voice_id}`)
            .then(r => r.ok ? r.json() : null)
            .then((v: ResembleVoice | null) => { if (v) setSelectedVoiceName(v.name); })
            .catch(() => { });
    }, [apiUrl, agent.config?.voice_id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch distinct language list once on mount
    useEffect(() => {
        fetch(`${apiUrl}/resemble/voices/languages`)
            .then(r => r.ok ? r.json() : [])
            .then((langs: string[]) => setAllLanguages(langs))
            .catch(() => { });
    }, [apiUrl]);

    const fetchVoices = useCallback(async (page: number, lang: string) => {
        setIsLoadingVoices(true);
        try {
            const params = new URLSearchParams({ page: String(page), page_size: String(VOICES_PER_PAGE) });
            if (lang) params.set("language", lang);
            const res = await fetch(`${apiUrl}/resemble/voices?${params}`);
            if (!res.ok) throw new Error("Failed to fetch voices");
            const data: ResembleVoicesPage = await res.json();
            setResembleVoices(data.voices);
            setVoiceTotalPages(data.total_pages);
            setVoiceTotalCount(data.total_count);
            if (!agent.config?.voice_id && page === 1 && data.voices.length > 0) {
                setVoiceId(data.voices[0].id);
                setSelectedVoiceName(data.voices[0].name);
            }
            // Resolve name for existing saved voice if not yet set
            if (agent.config?.voice_id && !selectedVoiceName) {
                const match = data.voices.find(v => v.id === agent.config?.voice_id);
                if (match) setSelectedVoiceName(match.name);
            }
        } catch (e) {
            console.error("Could not load Resemble voices:", e);
        } finally {
            setIsLoadingVoices(false);
        }
    }, [apiUrl, agent.config?.voice_id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchVoices(voicePage, voiceLanguage);
    }, [voicePage, voiceLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLanguageFilter = (lang: string) => {
        setVoiceLanguage(lang);
        setVoicePage(1);
    };


    // Webhook state
    const [webhookConfig, setWebhookConfig] = useState<WebhookConfigState>(
        agent.config?.webhooks || DEFAULT_WEBHOOK_CONFIG
    );

    // Functions state
    const [functions, setFunctions] = useState<FunctionDefinition[]>(
        agent.config?.functions || []
    );

    // Phone number state
    const [phoneNumber, setPhoneNumber] = useState(agent.phone_number || "");
    const [assignPhone, setAssignPhone] = useState("");
    const [searchAreaCode, setSearchAreaCode] = useState("");
    const [searchResults, setSearchResults] = useState<{ phone_number: string; friendly_name: string; locality?: string; region?: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isBuying, setIsBuying] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isReleasing, setIsReleasing] = useState(false);

    const handleSearchNumbers = useCallback(async () => {
        setIsSearching(true);
        try {
            const params = new URLSearchParams({ limit: "5" });
            if (searchAreaCode) params.set("area_code", searchAreaCode);
            const res = await fetch(`${apiUrl}/telephony/numbers/search?${params}`);
            if (!res.ok) throw new Error("Search failed");
            setSearchResults(await res.json());
        } catch (error) {
            toast.error("Failed to search numbers");
        } finally {
            setIsSearching(false);
        }
    }, [apiUrl, searchAreaCode]);

    const handleBuyNumber = useCallback(async (number: string) => {
        setIsBuying(true);
        try {
            const res = await fetch(`${apiUrl}/telephony/numbers/buy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agent_id: agent.id, phone_number: number }),
            });
            if (!res.ok) throw new Error("Purchase failed");
            const data = await res.json();
            setPhoneNumber(data.phone_number);
            setSearchResults([]);
            toast.success(`Number ${data.phone_number} purchased and assigned!`);
        } catch (error) {
            toast.error("Failed to buy number");
        } finally {
            setIsBuying(false);
        }
    }, [apiUrl, agent.id]);

    const handleAssignNumber = useCallback(async () => {
        if (!assignPhone.trim()) return;
        setIsAssigning(true);
        try {
            const res = await fetch(`${apiUrl}/telephony/numbers/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agent_id: agent.id, phone_number: assignPhone }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Assign failed");
            }
            const data = await res.json();
            setPhoneNumber(data.phone_number);
            setAssignPhone("");
            toast.success(`Number ${data.phone_number} assigned!`);
        } catch (error: any) {
            toast.error(error.message || "Failed to assign number");
        } finally {
            setIsAssigning(false);
        }
    }, [apiUrl, agent.id, assignPhone]);

    const handleReleaseNumber = useCallback(async () => {
        if (!confirm("Are you sure you want to release this phone number?")) return;
        setIsReleasing(true);
        try {
            const res = await fetch(`${apiUrl}/telephony/numbers/release`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agent_id: agent.id }),
            });
            if (!res.ok) throw new Error("Release failed");
            setPhoneNumber("");
            toast.success("Phone number released.");
        } catch (error) {
            toast.error("Failed to release number");
        } finally {
            setIsReleasing(false);
        }
    }, [apiUrl, agent.id]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/agents/${agent.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                    },
                    body: JSON.stringify({
                        name,
                        config: {
                            ...agent.config,
                            system_prompt: systemPrompt,
                            first_message: firstMessage,
                            first_message_mode: firstMessageMode,
                            llm_provider: "gemini",
                            llm_model: llmModel,
                            stt_provider: sttProvider,
                            voice_id: voiceId,
                            webhooks: webhookConfig,
                            functions,
                        },
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to save agent');
            }

            toast.success("Changes saved successfully!");
        } catch (error) {
            console.error("Failed to save agent:", error);
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    }, [agent.id, agent.config, userId, name, systemPrompt, firstMessage, firstMessageMode, llmModel, sttProvider, voiceId, webhookConfig, functions]);

    const handleTestCall = () => {
        // Navigate to preview page (could pass agent ID in future)
        router.push("/preview");
    };

    const handleDelete = useCallback(async () => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/agents/${agent.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'x-user-id': userId,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete agent');
            }

            toast.success("Agent deleted successfully");
            router.push("/dashboard/agents");
        } catch (error) {
            console.error("Failed to delete agent:", error);
            toast.error("Failed to delete agent");
        }
    }, [agent.id, userId, name, router]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/agents")}>
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="text-xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                            />
                            <Badge variant="outline" className="text-xs">
                                {agent.config?.template || "custom"}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{agent.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => setIsOutboundCallOpen(true)}>
                        <PhoneOutgoingIcon className="h-4 w-4" />
                        Make a Call
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => { }}>
                        <CodeIcon className="h-4 w-4" />
                        Code
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleTestCall}>
                        <PlayIcon className="h-4 w-4" />
                        Test
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="destructive" size="icon" onClick={handleDelete} title="Delete Agent">
                        <TrashIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="model" className="w-full">
                <TabsList className="grid w-full grid-cols-9 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="model">Model</TabsTrigger>
                    <TabsTrigger value="voice">Voice</TabsTrigger>
                    <TabsTrigger value="transcriber">Transcriber</TabsTrigger>
                    <TabsTrigger value="tools">Functions</TabsTrigger>
                    <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                    <TabsTrigger value="phone">Phone</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                {/* Model Tab */}
                <TabsContent value="model" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Model</CardTitle>
                            <CardDescription>Configure the behavior of the assistant.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Provider & Model */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Provider</Label>
                                    <Select defaultValue="gemini" disabled>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gemini">Gemini</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Model</Label>
                                    <Select value={llmModel} onValueChange={setLlmModel}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LLM_MODELS.map((model) => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* First Message Mode */}
                            <div className="space-y-2">
                                <Label>First Message Mode</Label>
                                <Select value={firstMessageMode} onValueChange={setFirstMessageMode}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FIRST_MESSAGE_MODES.map((mode) => (
                                            <SelectItem key={mode.id} value={mode.id}>
                                                {mode.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* First Message */}
                            <div className="space-y-2">
                                <Label>First Message</Label>
                                <Input
                                    value={firstMessage}
                                    onChange={(e) => setFirstMessage(e.target.value)}
                                    placeholder="Hello! How can I help you today?"
                                />
                            </div>

                            {/* System Prompt */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>System Prompt</Label>
                                    <Button variant="outline" size="sm" className="gap-1">
                                        <SparklesIcon className="h-3 w-3" />
                                        Generate
                                    </Button>
                                </div>
                                <Textarea
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    placeholder="Enter the system prompt that defines how the assistant should behave..."
                                    className="min-h-[300px] font-mono text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Voice Tab */}
                <TabsContent value="voice" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Voice</CardTitle>
                            <CardDescription>Choose a Resemble AI voice for your agent.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* TTS Provider (locked) */}
                                <div className="space-y-2">
                                    <Label>TTS Provider</Label>
                                    <Select defaultValue="resemble" disabled>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="resemble">Resemble AI</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Currently selected voice */}
                                {selectedVoiceName && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/30 text-sm">
                                        <span className="text-primary font-medium">Selected:</span>
                                        <span>{selectedVoiceName}</span>
                                    </div>
                                )}

                                {/* Language filter pills */}
                                {allLanguages.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Filter by language</Label>
                                        <div className="flex flex-wrap gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleLanguageFilter("")}
                                                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${voiceLanguage === ""
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                All
                                            </button>
                                            {allLanguages.map(lang => (
                                                <button
                                                    key={lang}
                                                    type="button"
                                                    onClick={() => handleLanguageFilter(lang)}
                                                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${voiceLanguage === lang
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                                        }`}
                                                >
                                                    {lang}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Voice Preview Cards — paginated */}
                                <div className="rounded-lg border border-border overflow-hidden">
                                    {isLoadingVoices ? (
                                        <p className="text-sm text-muted-foreground py-6 text-center">Loading voices...</p>
                                    ) : resembleVoices.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-6 text-center">
                                            No voices available. Check your <strong>RESEMBLE_API_KEY</strong>.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 p-2">
                                            {resembleVoices.map((voice) => (
                                                <button
                                                    key={voice.id}
                                                    type="button"
                                                    onClick={() => { setVoiceId(voice.id); setSelectedVoiceName(voice.name); }}
                                                    className={`text-left p-3 rounded-lg border transition-colors ${voiceId === voice.id
                                                        ? "border-primary bg-primary/10"
                                                        : "border-border hover:bg-muted/50"
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-lg mt-0.5">🧁</span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium text-sm truncate">
                                                                {voice.name}
                                                                {voiceId === voice.id && (
                                                                    <span className="ml-1 text-xs font-semibold text-primary">✓</span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {voice.language}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Pagination controls */}
                                    {voiceTotalPages > 1 && (
                                        <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
                                            <span className="text-xs text-muted-foreground">
                                                Page {voicePage} of {voiceTotalPages} &middot; {voiceTotalCount} voices
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setVoicePage(p => Math.max(1, p - 1))}
                                                    disabled={voicePage <= 1 || isLoadingVoices}
                                                    className="px-2 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    ← Prev
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setVoicePage(p => Math.min(voiceTotalPages, p + 1))}
                                                    disabled={voicePage >= voiceTotalPages || isLoadingVoices}
                                                    className="px-2 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Next →
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Powered by <strong>Resemble AI</strong>. Multilingual voices can also speak English.
                                    Save changes to apply the new voice.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Transcriber Tab */}
                <TabsContent value="transcriber" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transcriber</CardTitle>
                            <CardDescription>Configure the speech-to-text settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>STT Provider</Label>
                                    <Select value={sttProvider} onValueChange={setSttProvider}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STT_PROVIDERS.map((provider) => (
                                                <SelectItem key={provider.id} value={provider.id}>
                                                    {provider.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Select the speech-to-text provider for transcription. Make sure you have the API key configured in your agent environment.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Functions Tab */}
                <TabsContent value="tools" className="mt-6">
                    <FunctionConfig functions={functions} onChange={setFunctions} />
                </TabsContent>

                {/* Webhooks Tab */}
                <TabsContent value="webhooks" className="mt-6">
                    <WebhookConfig config={webhookConfig} onChange={setWebhookConfig} />
                </TabsContent>

                {/* Phone Number Tab */}
                <TabsContent value="phone" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PhoneIcon className="h-5 w-5" />
                                Phone Number (Twilio SIP)
                            </CardTitle>
                            <CardDescription>
                                Assign a Twilio phone number to this agent. Incoming calls to this number will be routed to this agent via SIP.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Current Number */}
                            {phoneNumber ? (
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Assigned Number</p>
                                        <p className="text-2xl font-bold tracking-wide">{phoneNumber}</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleReleaseNumber}
                                        disabled={isReleasing}
                                    >
                                        {isReleasing ? "Releasing..." : "Release Number"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground">
                                    No phone number assigned. Assign an existing Twilio number or search for a new one below.
                                </div>
                            )}

                            {/* Assign Existing Number */}
                            {!phoneNumber && (
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Assign Existing Number</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enter a Twilio number you already own (E.164 format, e.g. +12125551234).
                                    </p>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="+12125551234"
                                            value={assignPhone}
                                            onChange={(e) => setAssignPhone(e.target.value)}
                                        />
                                        <Button
                                            onClick={handleAssignNumber}
                                            disabled={isAssigning || !assignPhone.trim()}
                                        >
                                            {isAssigning ? "Assigning..." : "Assign"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Search & Buy */}
                            {!phoneNumber && (
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Search &amp; Buy a New Number</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Area code (e.g. 212)"
                                            value={searchAreaCode}
                                            onChange={(e) => setSearchAreaCode(e.target.value)}
                                            className="w-48"
                                        />
                                        <Button variant="outline" onClick={handleSearchNumbers} disabled={isSearching}>
                                            {isSearching ? "Searching..." : "Search"}
                                        </Button>
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div className="space-y-2">
                                            {searchResults.map((num) => (
                                                <div
                                                    key={num.phone_number}
                                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                                >
                                                    <div>
                                                        <p className="font-mono font-medium">{num.phone_number}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {[num.locality, num.region].filter(Boolean).join(", ")}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleBuyNumber(num.phone_number)}
                                                        disabled={isBuying}
                                                    >
                                                        {isBuying ? "Buying..." : "Buy"}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Analysis</CardTitle>
                            <CardDescription>Configure call analysis and insights.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Call analysis configuration coming soon. This will include sentiment analysis, summary generation, and more.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Compliance Tab */}
                <TabsContent value="compliance" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compliance</CardTitle>
                            <CardDescription>Configure compliance and regulatory settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Compliance settings coming soon. This will include HIPAA compliance, call recording consent, and more.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Advanced</CardTitle>
                            <CardDescription>Advanced configuration options.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Advanced settings coming soon. This will include timeout settings, retry logic, and webhook configurations.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Outbound Call Modal */}
            <OutboundCallModal
                open={isOutboundCallOpen}
                onOpenChange={setIsOutboundCallOpen}
                agentId={agent.id}
                agentName={name}
                userId={userId}
            />
        </div>
    );
}
