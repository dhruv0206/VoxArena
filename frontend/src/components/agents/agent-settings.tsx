"use client";

import { useState, useCallback } from "react";
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

interface Agent {
    id: string;
    name: string;
    description: string | null;
    type: string;
    is_active: boolean;
    config: {
        system_prompt?: string;
        first_message?: string;
        first_message_mode?: string;
        llm_provider?: string;
        llm_model?: string;
        template?: string;
        webhooks?: WebhookConfigState;
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

    // Form state
    const [name, setName] = useState(agent.name);
    const [llmModel, setLlmModel] = useState(agent.config?.llm_model || "gemini-2.5-flash");
    const [firstMessageMode, setFirstMessageMode] = useState(agent.config?.first_message_mode || "assistant_speaks_first");
    const [firstMessage, setFirstMessage] = useState(agent.config?.first_message || "");
    const [systemPrompt, setSystemPrompt] = useState(agent.config?.system_prompt || "");

    // Webhook state
    const [webhookConfig, setWebhookConfig] = useState<WebhookConfigState>(
        agent.config?.webhooks || DEFAULT_WEBHOOK_CONFIG
    );

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
                            webhooks: webhookConfig,
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
    }, [agent.id, agent.config, userId, name, systemPrompt, firstMessage, firstMessageMode, llmModel, webhookConfig]);

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
                `http://localhost:8000/api/agents/${agent.id}`,
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
                <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="model">Model</TabsTrigger>
                    <TabsTrigger value="voice">Voice</TabsTrigger>
                    <TabsTrigger value="transcriber">Transcriber</TabsTrigger>
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                    <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
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
                            <CardDescription>Configure the text-to-speech settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
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
                                <p className="text-sm text-muted-foreground">
                                    Voice settings are configured in the agent backend. Additional voice customization coming soon.
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
                                    <Select defaultValue="deepgram" disabled>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="deepgram">Deepgram Nova 2</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Transcription settings are configured in the agent backend. Additional customization coming soon.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tools Tab */}
                <TabsContent value="tools" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tools</CardTitle>
                            <CardDescription>Configure function calling and tools for the assistant.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Tool configuration coming soon. This will allow you to define custom functions the assistant can call.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Webhooks Tab */}
                <TabsContent value="webhooks" className="mt-6">
                    <WebhookConfig config={webhookConfig} onChange={setWebhookConfig} />
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
        </div>
    );
}
