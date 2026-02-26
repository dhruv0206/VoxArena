import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import CostsClient from "@/components/costs/costs-client";

export default async function CostsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    return (
        <DashboardLayout activeNav="Costs">
            <CostsClient userId={userId} apiUrl={apiUrl} />
        </DashboardLayout>
    );
}
