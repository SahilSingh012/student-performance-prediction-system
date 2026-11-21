import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import PredictStudio from "@/components/PredictStudio";

export const metadata: Metadata = { title: "Predict Marks" };

export default function PredictPage() {
  return (
    <AppShell title="Predict Performance" subtitle="Enter student factors — the trained ridge regression model estimates final marks out of 100">
      <PredictStudio />
    </AppShell>
  );
}
