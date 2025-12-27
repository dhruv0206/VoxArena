"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function TrashIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );
}

export interface WebhookDefinition {
    enabled: boolean;
    url: string;
    method: "GET" | "POST";
    timeout: number;
    headers: { key: string; value: string }[];
    // For pre-call: map response keys to variables
    assignments?: { variable: string; path: string }[];
    // For post-call: optional custom body
    body?: string;
}

export interface WebhookConfigState {
    pre_call: WebhookDefinition;
    post_call: WebhookDefinition;
}

interface WebhookConfigProps {
    config: WebhookConfigState;
    onChange: (config: WebhookConfigState) => void;
}

export function WebhookConfig({ config, onChange }: WebhookConfigProps) {
    const updatePreCall = (updates: Partial<WebhookDefinition>) => {
        onChange({
            ...config,
            pre_call: { ...config.pre_call, ...updates },
        });
    };

    const updatePostCall = (updates: Partial<WebhookDefinition>) => {
        onChange({
            ...config,
            post_call: { ...config.post_call, ...updates },
        });
    };

    return (
        <div className="space-y-6">
            {/* Pre-call Webhook */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Pre-call webhook</h3>
                            <p className="text-sm text-muted-foreground">
                                Enable to run an external service before each call connects.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={config.pre_call.enabled}
                                onCheckedChange={(checked: boolean) => updatePreCall({ enabled: checked })}
                            />
                            <Label>Enable</Label>
                        </div>
                    </div>

                    {config.pre_call.enabled && (
                        <div className="p-4 bg-muted/30 rounded-lg space-y-4 border mt-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Executed before each call starts. Use this to fetch external data and populate dynamic variables for personalized conversations.
                            </p>

                            <div className="space-y-2">
                                <Label>Endpoint URL *</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="https://api.example.com/endpoint"
                                        value={config.pre_call.url}
                                        onChange={(e) => updatePreCall({ url: e.target.value })}
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{"{{}}"}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>HTTP Method *</Label>
                                    <Select
                                        value={config.pre_call.method}
                                        onValueChange={(val: "GET" | "POST") => updatePreCall({ method: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GET">GET</SelectItem>
                                            <SelectItem value="POST">POST</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Timeout (seconds) *</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={60}
                                        value={config.pre_call.timeout}
                                        onChange={(e) => updatePreCall({ timeout: parseInt(e.target.value) || 5 })}
                                    />
                                    <p className="text-xs text-muted-foreground">Must be between 1-60 seconds</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Request Headers</Label>
                                {config.pre_call.headers.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No headers defined.</p>
                                )}
                                <div className="space-y-2">
                                    {config.pre_call.headers.map((header, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder="Key"
                                                value={header.key}
                                                onChange={(e) => {
                                                    const newHeaders = [...config.pre_call.headers];
                                                    newHeaders[index].key = e.target.value;
                                                    updatePreCall({ headers: newHeaders });
                                                }}
                                            />
                                            <Input
                                                placeholder="Value"
                                                value={header.value}
                                                onChange={(e) => {
                                                    const newHeaders = [...config.pre_call.headers];
                                                    newHeaders[index].value = e.target.value;
                                                    updatePreCall({ headers: newHeaders });
                                                }}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                const newHeaders = config.pre_call.headers.filter((_, i) => i !== index);
                                                updatePreCall({ headers: newHeaders });
                                            }}>
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary/90 p-0 h-auto gap-1"
                                    onClick={() => updatePreCall({ headers: [...config.pre_call.headers, { key: "", value: "" }] })}
                                >
                                    <PlusIcon className="h-3 w-3" />
                                    Add Header
                                </Button>
                            </div>

                            {/* Assignments for Pre-call */}
                            <div className="space-y-2">
                                <Label>Response Assignments *</Label>
                                <p className="text-sm text-muted-foreground">Map response data to dynamic variables. Variables must be defined in the Variables tab.</p>

                                {(!config.pre_call.assignments || config.pre_call.assignments.length === 0) && (
                                    <p className="text-sm text-muted-foreground">No assignments defined.</p>
                                )}
                                <div className="space-y-2">
                                    {config.pre_call.assignments?.map((assignment, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder="response.path.to.value"
                                                value={assignment.path}
                                                onChange={(e) => {
                                                    const newAssignments = [...(config.pre_call.assignments || [])];
                                                    newAssignments[index].path = e.target.value;
                                                    updatePreCall({ assignments: newAssignments });
                                                }}
                                            />
                                            <span className="self-center">→</span>
                                            <Input
                                                placeholder="variable_name"
                                                value={assignment.variable}
                                                onChange={(e) => {
                                                    const newAssignments = [...(config.pre_call.assignments || [])];
                                                    newAssignments[index].variable = e.target.value;
                                                    updatePreCall({ assignments: newAssignments });
                                                }}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                const newAssignments = config.pre_call.assignments?.filter((_, i) => i !== index);
                                                updatePreCall({ assignments: newAssignments });
                                            }}>
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary/90 p-0 h-auto gap-1"
                                    onClick={() => updatePreCall({ assignments: [...(config.pre_call.assignments || []), { variable: "", path: "" }] })}
                                >
                                    <PlusIcon className="h-3 w-3" />
                                    Add Assignment
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Post-call Webhook */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Post-call webhook</h3>
                            <p className="text-sm text-muted-foreground">
                                Enable to send call transcripts and metadata to your backend.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={config.post_call.enabled}
                                onCheckedChange={(checked) => updatePostCall({ enabled: checked })}
                            />
                            <Label>Enable</Label>
                        </div>
                    </div>

                    {config.post_call.enabled && (
                        <div className="p-4 bg-muted/30 rounded-lg space-y-4 border mt-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Executed after each call ends. Use this for logging, analytics, CRM updates, or triggering follow-up workflows.
                            </p>

                            <div className="space-y-2">
                                <Label>Endpoint URL *</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="https://api.example.com/endpoint"
                                        value={config.post_call.url}
                                        onChange={(e) => updatePostCall({ url: e.target.value })}
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{"{{}}"}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>HTTP Method *</Label>
                                    <Select
                                        value={config.post_call.method}
                                        onValueChange={(val: "GET" | "POST") => updatePostCall({ method: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GET">GET</SelectItem>
                                            <SelectItem value="POST">POST</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Timeout (seconds) *</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={60}
                                        value={config.post_call.timeout}
                                        onChange={(e) => updatePostCall({ timeout: parseInt(e.target.value) || 10 })}
                                    />
                                    <p className="text-xs text-muted-foreground">Must be between 1-60 seconds</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Request Headers</Label>
                                {config.post_call.headers.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No headers defined.</p>
                                )}
                                <div className="space-y-2">
                                    {config.post_call.headers.map((header, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder="Key"
                                                value={header.key}
                                                onChange={(e) => {
                                                    const newHeaders = [...config.post_call.headers];
                                                    newHeaders[index].key = e.target.value;
                                                    updatePostCall({ headers: newHeaders });
                                                }}
                                            />
                                            <Input
                                                placeholder="Value"
                                                value={header.value}
                                                onChange={(e) => {
                                                    const newHeaders = [...config.post_call.headers];
                                                    newHeaders[index].value = e.target.value;
                                                    updatePostCall({ headers: newHeaders });
                                                }}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                const newHeaders = config.post_call.headers.filter((_, i) => i !== index);
                                                updatePostCall({ headers: newHeaders });
                                            }}>
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary/90 p-0 h-auto gap-1"
                                    onClick={() => updatePostCall({ headers: [...config.post_call.headers, { key: "", value: "" }] })}
                                >
                                    <PlusIcon className="h-3 w-3" />
                                    Add Header
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Request Body (JSON)</Label>
                                <div className="relative">
                                    <Textarea
                                        value={config.post_call.body || ""}
                                        onChange={(e) => updatePostCall({ body: e.target.value })}
                                        placeholder='{\n  "key": "{{variable}}"\n}'
                                        className="font-mono text-sm h-32"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{"{{}}"}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Use {"{{variable}}"} for template variables</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
