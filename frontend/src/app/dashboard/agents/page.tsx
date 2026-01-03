import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { AgentList } from "@/components/agents/agent-list";

export default async function AgentsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Fetch agents from backend API
    let agents: any[] = [];
    try {
        const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await fetch(
            `${apiUrl}/agents/`,
            {
                headers: {
                    'x-user-id': userId,
                },
                cache: 'no-store', // Always fetch fresh data
            }
        );
        if (response.ok) {
            agents = await response.json();
        }
    } catch (error) {
        console.error("Failed to fetch agents:", error);
    }

    return (
        <DashboardLayout activeNav="Agents">
            <AgentList initialAgents={agents} userId={userId} />
        </DashboardLayout>
    );
}
