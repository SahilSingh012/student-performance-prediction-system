import type { Metadata } from "next";
import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import StudentsClient from "@/components/StudentsClient";

export const metadata: Metadata = { title: "Student Records" };

export default function StudentsPage() {
  return (
    <AppShell title="Student Records" subtitle="Search, filter and manage the registered synthetic student register">
      <Suspense fallback={<div className="card h-64 animate-pulse" />}>
        <StudentsClient />
      </Suspense>
    </AppShell>
  );
}
