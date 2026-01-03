import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { AgentSettings } from "@/components/agents/agent-settings";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AgentDetailPage({ params }: PageProps) {
    const { userId } = await auth();
    const resolvedParams = await params;

    if (!userId) {
        redirect("/sign-in");
    }

    // Fetch agent from backend API
    let agent = null;
    try {
        const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await fetch(
            `${apiUrl}/agents/${resolvedParams.id}`,
            {
                headers: {
                    'x-user-id': userId,
                },
                cache: 'no-store',
            }
        );
        if (response.ok) {
            agent = await response.json();
        } else if (response.status === 404) {
            notFound();
        }
    } catch (error) {
        console.error("Failed to fetch agent:", error);
    }

    if (!agent) {
        notFound();
    }

    return (
        <DashboardLayout activeNav="Agents">
            <AgentSettings agent={agent} userId={userId} />
        </DashboardLayout>
    );
}
