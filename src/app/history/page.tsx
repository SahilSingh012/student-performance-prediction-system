import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import HistoryClient from "@/components/HistoryClient";

export const metadata: Metadata = { title: "Prediction History" };

export default function HistoryPage() {
  return (
    <AppShell title="Prediction History" subtitle="Every model output stored in PostgreSQL — re-download any PDF report">
      <HistoryClient />
    </AppShell>
  );
}
