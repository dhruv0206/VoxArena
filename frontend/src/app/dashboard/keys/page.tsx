import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/dashboard/layout-dashboard";

function KeyIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function CopyIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
    );
}

// Mock API keys - replace with actual data
const mockKeys = [
    {
        id: "1",
        name: "Production Key",
        prefix: "vox_prod_****",
        created: "Dec 15, 2024",
    },
];

export default async function APIKeysPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    return (
        <DashboardLayout activeNav="API Keys">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">API Keys</h1>
                        <p className="text-muted-foreground">Manage your API keys for programmatic access</p>
                    </div>
                    <Button className="gap-2">
                        <PlusIcon className="h-4 w-4" />
                        Create Key
                    </Button>
                </div>

                {/* Keys List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your API Keys</CardTitle>
                        <CardDescription>
                            Use these keys to authenticate API requests
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {mockKeys.length === 0 ? (
                            <div className="py-8 text-center">
                                <KeyIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">No API keys created yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {mockKeys.map((key) => (
                                    <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                <KeyIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{key.name}</p>
                                                <p className="text-sm text-muted-foreground font-mono">{key.prefix}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-muted-foreground">Created {key.created}</p>
                                            <Button variant="ghost" size="sm">
                                                <CopyIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
