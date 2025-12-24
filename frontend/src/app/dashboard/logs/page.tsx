import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { CallLogsClient } from "./client";

export default async function CallLogsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    return (
        <DashboardLayout activeNav="Call Logs">
            <CallLogsClient userId={userId} />
        </DashboardLayout>
    );
}
