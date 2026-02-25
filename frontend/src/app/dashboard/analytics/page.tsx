import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import AnalyticsClient from "@/components/analytics/analytics-client";

export default async function AnalyticsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    return (
        <DashboardLayout activeNav="Analytics">
            <AnalyticsClient userId={userId} apiUrl={apiUrl} />
        </DashboardLayout>
    );
}
