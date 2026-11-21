import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import DashboardClient from "@/components/DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <AppShell title="Performance Dashboard" subtitle="Live analytics computed from registered students and their latest model predictions">
      <DashboardClient />
    </AppShell>
  );
}
