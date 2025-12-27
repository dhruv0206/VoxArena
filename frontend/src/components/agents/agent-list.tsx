"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AGENT_TEMPLATES, AgentTemplate } from "./agent-templates";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Prebuilt Resemble AI voices
const RESEMBLE_VOICES = [
    { id: "d70f93d1", name: "Juniper", gender: "Female", description: "description" },
    { id: "38a0b764", name: "Aaron", gender: "Male", description: "description" },
    { id: "7213a9ea", name: "Grace", gender: "Female", description: "description" },
];

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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

function HeartIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
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

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    );
}

function DocumentIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function getTemplateIcon(icon: AgentTemplate["icon"], className?: string) {
    switch (icon) {
        case "blank":
            return <PlusIcon className={className} />;
        case "support":
            return <HeartIcon className={className} />;
        case "lead":
            return <UserIcon className={className} />;
        case "calendar":
            return <CalendarIcon className={className} />;
        case "form":
            return <DocumentIcon className={className} />;
        default:
            return <BotIcon className={className} />;
    }
}

interface Agent {
    id: string;
    name: string;
    description: string | null;
    type: "STT" | "LLM" | "TTS" | "PIPELINE";
    is_active: boolean;
    config?: {
        system_prompt?: string;
        first_message?: string;
        llm_model?: string;
        template?: string;
    };
    calls?: number;
    avgDuration?: string;
}

interface AgentListProps {
    initialAgents: Agent[];
    userId: string;
}

export function AgentList({ initialAgents, userId }: AgentListProps) {
    const router = useRouter();
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
    const [agentName, setAgentName] = useState("New Assistant");
    const [selectedVoice, setSelectedVoice] = useState(RESEMBLE_VOICES[0].id);

    const handleSelectTemplate = (template: AgentTemplate) => {
        setSelectedTemplate(template);
    };

    const handleCreate = async () => {
        if (!selectedTemplate || !agentName.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/agents/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: agentName,
                        description: selectedTemplate.description,
                        type: "PIPELINE",
                        config: {
                            system_prompt: selectedTemplate.systemPrompt,
                            first_message: selectedTemplate.firstMessage,
                            first_message_mode: "assistant_speaks_first",
                            llm_provider: "gemini",
                            llm_model: "gemini-2.5-flash",
                            template: selectedTemplate.id,
                            voice_provider: "resemble",
                            voice_id: selectedVoice,
                            voice_name: RESEMBLE_VOICES.find(v => v.id === selectedVoice)?.name,
                        },
                        user_id: userId,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to create agent');
            }

            const newAgent = await response.json();
            setAgents([newAgent, ...agents]);
            setIsOpen(false);
            setSelectedTemplate(null);
            setAgentName("New Assistant");
            setSelectedVoice(RESEMBLE_VOICES[0].id);

            toast.success("Assistant created successfully!", {
                description: `${newAgent.name} is now ready to configure.`,
            });

            // Navigate to agent settings page
            router.push(`/dashboard/agents/${newAgent.id}`);
        } catch (error) {
            console.error("Failed to create agent:", error);
            toast.error("Failed to create assistant", {
                description: "Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAgentClick = (agentId: string) => {
        router.push(`/dashboard/agents/${agentId}`);
    };

    const handleCloseDialog = () => {
        setIsOpen(false);
        setSelectedTemplate(null);
        setAgentName("New Assistant");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Assistants</h1>
                    <p className="text-muted-foreground">Create and manage your voice assistants</p>
                </div>

                <Button className="gap-2" onClick={() => setIsOpen(true)}>
                    <PlusIcon className="h-4 w-4" />
                    Create Assistant
                </Button>
            </div>

            {/* Create Assistant Dialog */}
            <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Create Assistant
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Template Selection */}
                        <div>
                            <h3 className="font-semibold mb-2">Choose a template</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Here's a few templates to get you started, or you can create your own template and use it to create a new assistant.
                            </p>

                            {/* Assistant Name */}
                            <div className="mb-4">
                                <Label htmlFor="name" className="text-sm">
                                    Assistant Name <span className="text-muted-foreground text-xs">(This can be adjusted at any time after creation.)</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={agentName}
                                    onChange={(e) => setAgentName(e.target.value)}
                                    placeholder="New Assistant"
                                    className="mt-1"
                                />
                            </div>

                            {/* Voice Selection */}
                            <div className="mb-4">
                                <Label className="text-sm">Voice</Label>
                                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RESEMBLE_VOICES.map((voice) => (
                                            <SelectItem key={voice.id} value={voice.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{voice.name}</span>
                                                    <span className="text-xs text-muted-foreground">({voice.gender})</span>
                                                    <span className="text-xs text-muted-foreground">- {voice.description}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Blank Template */}
                            <div
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all mb-4 ${selectedTemplate?.id === "blank"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                    }`}
                                onClick={() => handleSelectTemplate(AGENT_TEMPLATES[0])}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                                        <PlusIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Blank Template</h4>
                                        <p className="text-sm text-muted-foreground">
                                            This blank slate template with minimal configurations. It's a starting point for creating your custom assistant.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quickstart Templates */}
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quickstart</p>
                            <div className="grid grid-cols-2 gap-3">
                                {AGENT_TEMPLATES.slice(1).map((template) => (
                                    <div
                                        key={template.id}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                        onClick={() => handleSelectTemplate(template)}
                                    >
                                        <div className="mb-3">
                                            {getTemplateIcon(template.icon, "h-6 w-6 text-muted-foreground")}
                                        </div>
                                        <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                                        <p className="text-xs text-muted-foreground line-clamp-3">
                                            {template.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={handleCloseDialog}>
                            Close
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isLoading || !selectedTemplate || !agentName.trim()}
                            variant="outline"
                            className="border-white/20 bg-white/10 hover:bg-white/20 text-white"
                        >
                            {isLoading ? "Creating..." : "+ Create Assistant"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Agents Grid */}
            {agents.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <BotIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="font-semibold mb-2">No assistants yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first voice assistant to get started</p>
                        <Button className="gap-2" onClick={() => setIsOpen(true)}>
                            <PlusIcon className="h-4 w-4" />
                            Create Assistant
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent) => (
                        <Card
                            key={agent.id}
                            className="hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={() => handleAgentClick(agent.id)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <BotIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{agent.name}</CardTitle>
                                            <CardDescription>
                                                {agent.config?.template || agent.type}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={agent.is_active ? "default" : "secondary"}>
                                        {agent.is_active ? "active" : "inactive"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {agent.description && (
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                        {agent.description}
                                    </p>
                                )}
                                <div className="flex gap-6 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Calls</p>
                                        <p className="font-medium">{agent.calls || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Avg Duration</p>
                                        <p className="font-medium">{agent.avgDuration || "0:00"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
