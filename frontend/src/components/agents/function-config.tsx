"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// ── Icons ───────────────────────────────────────────────────────────────

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

function PencilIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
    );
}

function BoltIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
        </svg>
    );
}

// ── Types ────────────────────────────────────────────────────────────────

export interface FunctionParameter {
    name: string;
    type: "string" | "number" | "boolean" | "array" | "object";
    description: string;
    required: boolean;
}

export interface FunctionEndpoint {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers: { key: string; value: string }[];
    timeout: number;
}

export interface FunctionDefinition {
    id: string;
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema
    endpoint: FunctionEndpoint;
    speak_during_execution: boolean;
    speak_on_send: string;
}

interface FunctionConfigProps {
    functions: FunctionDefinition[];
    onChange: (functions: FunctionDefinition[]) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────

const PARAMETER_TYPES = ["string", "number", "boolean", "array", "object"] as const;

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"] as const;

const METHOD_COLORS: Record<string, string> = {
    GET: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    POST: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    PUT: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    DELETE: "bg-red-500/15 text-red-600 border-red-500/30",
};

function toSnakeCase(str: string): string {
    return str
        .replace(/[^a-zA-Z0-9_\s]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();
}

function parametersToVisual(schema: Record<string, any>): FunctionParameter[] {
    if (!schema?.properties) return [];
    const required: string[] = schema.required || [];
    return Object.entries(schema.properties).map(([name, prop]: [string, any]) => ({
        name,
        type: prop.type || "string",
        description: prop.description || "",
        required: required.includes(name),
    }));
}

function visualToParameters(params: FunctionParameter[]): Record<string, any> {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const p of params) {
        properties[p.name] = { type: p.type, description: p.description };
        if (p.required) required.push(p.name);
    }
    return { type: "object", properties, required };
}

function createEmptyFunction(): FunctionDefinition {
    return {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        parameters: { type: "object", properties: {}, required: [] },
        endpoint: { url: "", method: "POST", headers: [], timeout: 10 },
        speak_during_execution: false,
        speak_on_send: "",
    };
}

// ── Templates ───────────────────────────────────────────────────────────

interface FunctionTemplate {
    label: string;
    fn: FunctionDefinition;
}

function makeTemplate(
    label: string,
    name: string,
    description: string,
    params: FunctionParameter[],
    method: FunctionDefinition["endpoint"]["method"],
): FunctionTemplate {
    return {
        label,
        fn: {
            id: crypto.randomUUID(),
            name,
            description,
            parameters: visualToParameters(params),
            endpoint: { url: "", method, headers: [], timeout: 10 },
            speak_during_execution: true,
            speak_on_send: "",
        },
    };
}

const TEMPLATES: FunctionTemplate[] = [
    makeTemplate("Check Availability", "check_availability", "Check calendar availability for a given date and time", [
        { name: "date", type: "string", description: "Date to check (YYYY-MM-DD)", required: true },
        { name: "time", type: "string", description: "Time to check (HH:MM)", required: true },
    ], "POST"),
    makeTemplate("Look Up Customer", "look_up_customer", "Look up a customer record by email or phone number", [
        { name: "email", type: "string", description: "Customer email address", required: false },
        { name: "phone", type: "string", description: "Customer phone number", required: false },
    ], "GET"),
    makeTemplate("Book Appointment", "book_appointment", "Book an appointment for a customer", [
        { name: "name", type: "string", description: "Customer name", required: true },
        { name: "date", type: "string", description: "Appointment date (YYYY-MM-DD)", required: true },
        { name: "time", type: "string", description: "Appointment time (HH:MM)", required: true },
        { name: "service", type: "string", description: "Service type", required: true },
    ], "POST"),
    makeTemplate("Transfer Call", "transfer_call", "Transfer the current call to another phone number or department", [
        { name: "phone_number", type: "string", description: "Phone number to transfer to", required: true },
        { name: "department", type: "string", description: "Department name", required: false },
    ], "POST"),
    makeTemplate("Send SMS", "send_sms", "Send an SMS message to a phone number", [
        { name: "phone_number", type: "string", description: "Recipient phone number", required: true },
        { name: "message", type: "string", description: "SMS message content", required: true },
    ], "POST"),
];

// ── Function Dialog ─────────────────────────────────────────────────────

interface FunctionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initial: FunctionDefinition | null;
    onSave: (fn: FunctionDefinition) => void;
}

function FunctionDialog({ open, onOpenChange, initial, onSave }: FunctionDialogProps) {
    const isEditing = initial !== null;
    const [fn, setFn] = useState<FunctionDefinition>(initial || createEmptyFunction());
    const [visualParams, setVisualParams] = useState<FunctionParameter[]>(
        initial ? parametersToVisual(initial.parameters) : [],
    );
    const [rawMode, setRawMode] = useState(false);
    const [rawJson, setRawJson] = useState("");

    // Reset state when dialog opens with new data
    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen && !open) {
            const base = initial || createEmptyFunction();
            setFn(base);
            setVisualParams(parametersToVisual(base.parameters));
            setRawMode(false);
            setRawJson(JSON.stringify(base.parameters, null, 2));
        }
        onOpenChange(nextOpen);
    };

    const updateFn = (updates: Partial<FunctionDefinition>) => setFn(prev => ({ ...prev, ...updates }));
    const updateEndpoint = (updates: Partial<FunctionEndpoint>) =>
        setFn(prev => ({ ...prev, endpoint: { ...prev.endpoint, ...updates } }));

    const addParam = () => setVisualParams(prev => [...prev, { name: "", type: "string", description: "", required: false }]);
    const removeParam = (index: number) => setVisualParams(prev => prev.filter((_, i) => i !== index));
    const updateParam = (index: number, updates: Partial<FunctionParameter>) =>
        setVisualParams(prev => prev.map((p, i) => (i === index ? { ...p, ...updates } : p)));

    const handleSave = () => {
        let parameters: Record<string, any>;
        if (rawMode) {
            try {
                parameters = JSON.parse(rawJson);
            } catch {
                return; // invalid JSON — don't save
            }
        } else {
            parameters = visualToParameters(visualParams);
        }
        onSave({ ...fn, parameters });
        onOpenChange(false);
    };

    const canSave = fn.name.trim() !== "" && fn.endpoint.url.trim() !== "";

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Function" : "Add Function"}</DialogTitle>
                    <DialogDescription>
                        Define a function that the voice agent can call during conversations.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                            placeholder="check_availability"
                            className="font-mono"
                            value={fn.name}
                            onChange={(e) => updateFn({ name: toSnakeCase(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">Auto-formatted to snake_case. Used as the tool name sent to the LLM.</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Description *</Label>
                        <Textarea
                            placeholder="Describe what this function does — this is sent to the LLM to help it decide when to call this function."
                            value={fn.description}
                            onChange={(e) => updateFn({ description: e.target.value })}
                            className="min-h-[80px]"
                        />
                    </div>

                    {/* Parameters */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Parameters</Label>
                            <button
                                type="button"
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => {
                                    if (!rawMode) {
                                        setRawJson(JSON.stringify(visualToParameters(visualParams), null, 2));
                                    } else {
                                        try {
                                            setVisualParams(parametersToVisual(JSON.parse(rawJson)));
                                        } catch { /* keep visual as-is */ }
                                    }
                                    setRawMode(!rawMode);
                                }}
                            >
                                {rawMode ? "Switch to visual editor" : "Switch to JSON Schema"}
                            </button>
                        </div>

                        {rawMode ? (
                            <Textarea
                                className="font-mono text-sm min-h-[160px]"
                                value={rawJson}
                                onChange={(e) => setRawJson(e.target.value)}
                                placeholder='{"type":"object","properties":{},"required":[]}'
                            />
                        ) : (
                            <div className="space-y-2">
                                {visualParams.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No parameters defined.</p>
                                )}
                                {visualParams.map((param, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <Input
                                            placeholder="name"
                                            className="font-mono flex-1"
                                            value={param.name}
                                            onChange={(e) => updateParam(index, { name: e.target.value })}
                                        />
                                        <Select
                                            value={param.type}
                                            onValueChange={(val) => updateParam(index, { type: val as FunctionParameter["type"] })}
                                        >
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PARAMETER_TYPES.map((t) => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            placeholder="description"
                                            className="flex-1"
                                            value={param.description}
                                            onChange={(e) => updateParam(index, { description: e.target.value })}
                                        />
                                        <div className="flex items-center gap-1.5 pt-2">
                                            <Switch
                                                checked={param.required}
                                                onCheckedChange={(checked: boolean) => updateParam(index, { required: checked })}
                                            />
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">Req</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeParam(index)}>
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary/90 p-0 h-auto gap-1"
                                    onClick={addParam}
                                >
                                    <PlusIcon className="h-3 w-3" />
                                    Add Parameter
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Endpoint Configuration */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Endpoint Configuration</Label>

                        <div className="space-y-2">
                            <Label>URL *</Label>
                            <Input
                                placeholder="https://api.example.com/endpoint"
                                value={fn.endpoint.url}
                                onChange={(e) => updateEndpoint({ url: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>HTTP Method</Label>
                                <Select
                                    value={fn.endpoint.method}
                                    onValueChange={(val) => updateEndpoint({ method: val as FunctionEndpoint["method"] })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HTTP_METHODS.map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Timeout (seconds)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={60}
                                    value={fn.endpoint.timeout}
                                    onChange={(e) => updateEndpoint({ timeout: parseInt(e.target.value) || 10 })}
                                />
                            </div>
                        </div>

                        {/* Headers */}
                        <div className="space-y-2">
                            <Label>Headers</Label>
                            {fn.endpoint.headers.length === 0 && (
                                <p className="text-sm text-muted-foreground">No headers defined.</p>
                            )}
                            <div className="space-y-2">
                                {fn.endpoint.headers.map((header, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            placeholder="Key"
                                            value={header.key}
                                            onChange={(e) => {
                                                const newHeaders = [...fn.endpoint.headers];
                                                newHeaders[index] = { ...newHeaders[index], key: e.target.value };
                                                updateEndpoint({ headers: newHeaders });
                                            }}
                                        />
                                        <Input
                                            placeholder="Value"
                                            value={header.value}
                                            onChange={(e) => {
                                                const newHeaders = [...fn.endpoint.headers];
                                                newHeaders[index] = { ...newHeaders[index], value: e.target.value };
                                                updateEndpoint({ headers: newHeaders });
                                            }}
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            updateEndpoint({ headers: fn.endpoint.headers.filter((_, i) => i !== index) });
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
                                onClick={() => updateEndpoint({ headers: [...fn.endpoint.headers, { key: "", value: "" }] })}
                            >
                                <PlusIcon className="h-3 w-3" />
                                Add Header
                            </Button>
                        </div>
                    </div>

                    {/* Speech Configuration */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Speech Configuration</Label>

                        <div className="flex items-center gap-3">
                            <Switch
                                checked={fn.speak_during_execution}
                                onCheckedChange={(checked: boolean) => updateFn({ speak_during_execution: checked })}
                            />
                            <div>
                                <Label>Speak while executing</Label>
                                <p className="text-xs text-muted-foreground">Agent says a message while waiting for the function result.</p>
                            </div>
                        </div>

                        {fn.speak_during_execution && (
                            <div className="space-y-2">
                                <Label>Say this when calling function</Label>
                                <Input
                                    placeholder="Let me check that for you..."
                                    value={fn.speak_on_send}
                                    onChange={(e) => updateFn({ speak_on_send: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!canSave}>
                        {isEditing ? "Save Changes" : "Add Function"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Main Component ──────────────────────────────────────────────────────

export function FunctionConfig({ functions, onChange }: FunctionConfigProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFunction, setEditingFunction] = useState<FunctionDefinition | null>(null);

    const handleAdd = () => {
        setEditingFunction(null);
        setDialogOpen(true);
    };

    const handleEdit = (fn: FunctionDefinition) => {
        setEditingFunction(fn);
        setDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        onChange(functions.filter((f) => f.id !== id));
    };

    const handleSave = (fn: FunctionDefinition) => {
        if (editingFunction) {
            onChange(functions.map((f) => (f.id === fn.id ? fn : f)));
        } else {
            onChange([...functions, fn]);
        }
    };

    const handleAddTemplate = (template: FunctionTemplate) => {
        const fn = { ...template.fn, id: crypto.randomUUID() };
        setEditingFunction(null);
        // Open dialog pre-filled with template
        setEditingFunction(null);
        // Directly add and open for editing so user can set the URL
        setEditingFunction(fn);
        setDialogOpen(true);
    };

    const paramCount = (fn: FunctionDefinition) =>
        Object.keys(fn.parameters?.properties || {}).length;

    return (
        <div className="space-y-6">
            {/* Header actions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-medium">Functions</h3>
                            <p className="text-sm text-muted-foreground">
                                Define functions your agent can call during conversations — like booking appointments, looking up data, or sending messages.
                            </p>
                        </div>
                        <Button className="gap-1.5" onClick={handleAdd}>
                            <PlusIcon className="h-4 w-4" />
                            Add Function
                        </Button>
                    </div>

                    {/* Function cards */}
                    {functions.length > 0 ? (
                        <div className="space-y-3">
                            {functions.map((fn) => (
                                <div
                                    key={fn.id}
                                    className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-medium text-sm">{fn.name}</span>
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${METHOD_COLORS[fn.endpoint.method] || ""}`}>
                                                {fn.endpoint.method}
                                            </Badge>
                                            {paramCount(fn) > 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    {paramCount(fn)} param{paramCount(fn) !== 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </div>
                                        {fn.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-1">{fn.description}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1 truncate font-mono">{fn.endpoint.url || "No endpoint URL"}</p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-3 shrink-0">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(fn)} title="Edit">
                                            <PencilIcon className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(fn.id)} title="Delete">
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Empty state */
                        <div className="py-10 text-center border border-dashed rounded-lg">
                            <BoltIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                            <h4 className="text-sm font-medium mb-1">No functions defined</h4>
                            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                                Functions let your agent take real-world actions during calls — like checking calendars, booking appointments, or sending messages.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {TEMPLATES.map((t) => (
                                    <Button
                                        key={t.fn.name}
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() => handleAddTemplate(t)}
                                    >
                                        <BoltIcon className="h-3 w-3" />
                                        {t.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Template quick-add when functions exist */}
                    {functions.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Quick-add from templates:</p>
                            <div className="flex flex-wrap gap-2">
                                {TEMPLATES.map((t) => (
                                    <Button
                                        key={t.fn.name}
                                        variant="outline"
                                        size="sm"
                                        className="gap-1 text-xs h-7"
                                        onClick={() => handleAddTemplate(t)}
                                    >
                                        <BoltIcon className="h-3 w-3" />
                                        {t.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog */}
            <FunctionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                initial={editingFunction}
                onSave={handleSave}
            />
        </div>
    );
}
