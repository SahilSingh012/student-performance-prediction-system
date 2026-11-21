import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EduPredict AI — Student Performance Prediction System",
    template: "%s · EduPredict AI",
  },
  description:
    "End-to-end machine learning project that predicts student exam performance from attendance, study hours, previous marks and more. Synthetic demo data, real ML model, interactive dashboard and PDF reports.",
  applicationName: "EduPredict AI",
  keywords: ["student performance prediction", "machine learning", "education analytics", "regression", "data science project"],
};

export const viewport: Viewport = {
  themeColor: "#0a2540",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
