/**
 * Client-side PDF report generator (jsPDF).
 * Produces a professional A4 academic prediction report.
 */
import { jsPDF } from "jspdf";
import { CATEGORY_META, type PerformanceCategory } from "@/lib/ml";

export interface ReportData {
  studentName: string;
  predictionId: number | string;
  createdAt?: string;
  features: {
    age: number;
    attendance: number;
    study_hours: number;
    previous_marks: number;
    assignment_score: number;
    sleep_hours: number;
    internet_access: boolean;
    extracurricular: boolean;
  };
  predicted: number;
  rangeLow: number;
  rangeHigh: number;
  category: string;
  deltaVsPrevious: number;
  insights: string[];
  suggestions: string[];
  modelVersion?: string;
}

const NAVY: [number, number, number] = [10, 37, 64];
const BLUE: [number, number, number] = [37, 99, 235];
const MUTED: [number, number, number] = [91, 107, 130];
const LIGHT: [number, number, number] = [239, 244, 255];

export function downloadPredictionReport(data: ReportData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 46;
  let y = 0;

  const checkPage = (needed: number) => {
    if (y + needed > H - 56) {
      addFooter();
      doc.addPage();
      y = 56;
    }
  };

  const addFooter = () => {
    doc.setDrawColor(226, 232, 243);
    doc.line(M, H - 40, W - M, H - 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...MUTED);
    doc.text(
      "EduPredict AI · Synthetic demonstration data — predictions are statistical estimates, not a guarantee of academic outcomes.",
      M,
      H - 26
    );
    doc.text(`Report #${data.predictionId} · Page ${doc.getNumberOfPages()}`, W - M, H - 26, { align: "right" });
  };

  // ---------- Header band ----------
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 96, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 96, W, 4, "F");

  doc.setTextColor(125, 180, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.text("EDUPREDICT AI · STUDENT PERFORMANCE PREDICTION SYSTEM", M, 34);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("Academic Prediction Report", M, 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(190, 210, 235);
  const dateStr = new Date(data.createdAt ?? Date.now()).toLocaleString("en-IN", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  doc.text(`Generated on ${dateStr}  ·  Model ${data.modelVersion ?? "v1.0.0"}  ·  Report ID #${data.predictionId}`, M, 78);

  y = 128;

  // ---------- Student summary card ----------
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, y, W - 2 * M, 54, 10, 10, "F");
  doc.setTextColor(...MUTED);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("STUDENT", M + 16, y + 17);
  doc.setTextColor(...NAVY);
  doc.setFontSize(16);
  doc.text(data.studentName, M + 16, y + 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Age ${data.features.age} years`, W - M - 16, y + 24, { align: "right" });
  doc.text("Synthetic profile · Demo record", W - M - 16, y + 38, { align: "right" });

  y += 78;

  // ---------- Section: Academic profile ----------
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1 · Academic Profile & Input Features", M, y);
  y += 12;

  const rows: [string, string][] = [
    ["Attendance", `${data.features.attendance} %`],
    ["Study hours per day", `${data.features.study_hours} hrs`],
    ["Previous exam marks", `${data.features.previous_marks} / 100`],
    ["Assignment score", `${data.features.assignment_score} / 100`],
    ["Sleep hours per night", `${data.features.sleep_hours} hrs`],
    ["Internet access", data.features.internet_access ? "Yes" : "No"],
    ["Extracurricular activities", data.features.extracurricular ? "Yes" : "No"],
  ];
  const colW = (W - 2 * M) / 2;
  rows.forEach(([k, v], i) => {
    const col = i % 2;
    const rowY = y + Math.floor(i / 2) * 30;
    const x = M + col * colW;
    doc.setDrawColor(226, 232, 243);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x + (col ? 6 : 0), rowY, colW - 12, 24, 6, 6, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(k.toUpperCase(), x + (col ? 6 : 0) + 10, rowY + 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...NAVY);
    doc.text(String(v), x + (col ? 6 : 0) + 10, rowY + 19);
  });
  y += Math.ceil(rows.length / 2) * 30 + 22;

  // ---------- Section: Prediction result ----------
  checkPage(150);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("2 · Predicted Outcome", M, y);
  y += 10;

  const resultH = 108;
  doc.setDrawColor(191, 219, 254);
  doc.setFillColor(248, 251, 255);
  doc.roundedRect(M, y, W - 2 * M, resultH, 10, 10, "FD");

  // Score circle
  const cx = M + 62;
  const cy = y + resultH / 2 + 2;
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(5);
  doc.circle(cx, cy, 34, "S");
  doc.setLineWidth(1);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.setFontSize(22);
  doc.text(String(Math.round(data.predicted)), cx, cy + 2, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("OUT OF 100", cx, cy + 14, { align: "center" });

  const tx = M + 120;
  const meta = CATEGORY_META[data.category as PerformanceCategory];
  const catColor: [number, number, number] = meta ? hexToRgb(meta.bar) : BLUE;

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("PERFORMANCE CATEGORY", tx, y + 22);
  doc.setFillColor(...catColor);
  doc.roundedRect(tx, y + 28, doc.getTextWidth(data.category.toUpperCase()) + 22, 17, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text(data.category.toUpperCase(), tx + 11, y + 40);

  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text("PREDICTED RANGE (± MAE)", tx, y + 62);
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.rangeLow} — ${data.rangeHigh} marks`, tx, y + 77);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text("VS PREVIOUS EXAM", tx + 150, y + 62);
  doc.setTextColor(data.deltaVsPrevious >= 0 ? 16 : 185, data.deltaVsPrevious >= 0 ? 122 : 28, data.deltaVsPrevious >= 0 ? 60 : 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`${data.deltaVsPrevious >= 0 ? "+" : ""}${data.deltaVsPrevious} marks`, tx + 150, y + 77);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(meta?.description ?? "", M + 16, y + resultH - 10, { maxWidth: W - 2 * M - 32 });

  y += resultH + 22;

  // ---------- Section: Insights ----------
  const writeList = (title: string, items: string[], numbered: boolean) => {
    checkPage(60);
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, M, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    items.forEach((item, i) => {
      const lines = doc.splitTextToSize(item, W - 2 * M - 26);
      checkPage(lines.length * 12 + 8);
      doc.setTextColor(...BLUE);
      doc.setFont("helvetica", "bold");
      doc.text(numbered ? `${i + 1}.` : "•", M + 4, y + 12);
      doc.setTextColor(51, 65, 92);
      doc.setFont("helvetica", "normal");
      doc.text(lines, M + 18, y + 12);
      y += lines.length * 12 + 5;
    });
    y += 10;
  };

  writeList("3 · Academic Insights (Model-Informed)", data.insights, false);
  writeList("4 · Personalised Study Recommendations", data.suggestions, true);

  // ---------- Disclaimer ----------
  checkPage(64);
  doc.setDrawColor(253, 230, 138);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(M, y, W - 2 * M, 52, 8, 8, "FD");
  doc.setTextColor(146, 64, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("IMPORTANT — PLEASE READ", M + 14, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  doc.text(
    doc.splitTextToSize(
      "This report is generated from a machine-learning model trained on 600 synthetic (computer-generated) records for educational demonstration. " +
        "It is not a guarantee, diagnosis, or substitute for professional academic assessment, teacher evaluation, or counselling guidance. " +
        "Use it as a supportive signal alongside human judgement.",
      W - 2 * M - 28
    ),
    M + 14,
    y + 29
  );

  addFooter();
  doc.save(`Prediction_Report_${data.studentName.replace(/\s+/g, "_")}_#${data.predictionId}.pdf`);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(n, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
