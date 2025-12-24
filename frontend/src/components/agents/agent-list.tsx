"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

interface Agent {
    id: string;
    name: string;
    description: string | null;
    type: "STT" | "LLM" | "TTS" | "PIPELINE";
    is_active: boolean;
    calls?: number;
    avgDuration?: string;
}

interface AgentListProps {
    initialAgents: Agent[];
    userId: string;
}

export function AgentList({ initialAgents, userId }: AgentListProps) {
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        type: "PIPELINE" as const,
    });

    const handleCreate = async () => {
        if (!formData.name) return;

        setIsLoading(true);
        try {
            // POST to backend API to persist the agent
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/agents/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        description: formData.description || null,
                        type: formData.type,
                        config: {},
                        user_id: userId,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to create agent');
            }

            const newAgent = await response.json();

            setAgents([newAgent, ...agents]);
            setFormData({ name: "", description: "", type: "PIPELINE" });
            setIsOpen(false);
            toast.success("Agent created successfully!", {
                description: `${newAgent.name} is now ready to use.`,
            });
        } catch (error) {
            console.error("Failed to create agent:", error);
            toast.error("Failed to create agent", {
                description: "Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Agents</h1>
                    <p className="text-muted-foreground">Create and manage your voice agents</p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <PlusIcon className="h-4 w-4" />
                            Create Agent
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Agent</DialogTitle>
                            <DialogDescription>
                                Configure your voice agent settings
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="My Voice Agent"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe what this agent does..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PIPELINE">Full Pipeline (STT + LLM + TTS)</SelectItem>
                                        <SelectItem value="STT">Speech to Text Only</SelectItem>
                                        <SelectItem value="LLM">LLM Only</SelectItem>
                                        <SelectItem value="TTS">Text to Speech Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={isLoading || !formData.name}>
                                {isLoading ? "Creating..." : "Create Agent"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Agents Grid */}
            {agents.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <BotIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="font-semibold mb-2">No agents yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first voice agent to get started</p>
                        <Button className="gap-2" onClick={() => setIsOpen(true)}>
                            <PlusIcon className="h-4 w-4" />
                            Create Agent
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent) => (
                        <Card key={agent.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <BotIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{agent.name}</CardTitle>
                                            <CardDescription>{agent.type}</CardDescription>
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
