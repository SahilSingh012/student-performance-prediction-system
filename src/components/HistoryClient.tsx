"use client";

import { useCallback, useEffect, useState } from "react";
import { History, FileDown, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { downloadPredictionReport } from "@/lib/report";
import { predictForFeatures } from "@/lib/ml";

interface Row {
  id: number;
  studentId: number;
  studentName: string;
  predictedMarks: number;
  category: string;
  modelVersion: string;
  createdAt: string;
  age: number;
  previousMarks: number;
  assignmentScore: number;
  attendance: number;
  studyHours: number;
  sleepHours: number;
  internetAccess: boolean;
  extracurricular: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Outstanding: "#10b981", Excellent: "#3b82f6", Good: "#14b8a6", "Needs Improvement": "#f59e0b", "At Risk": "#ef4444",
};

export default function HistoryClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No synchronous setState — every update happens after the await,
  // so it is safe to call from an effect.
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions?limit=200", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setRows(json.rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = () => { setLoading(true); void load(); };

  useEffect(() => {
    const t = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const clearAll = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/predictions", { method: "DELETE" });
      if (res.ok) { setRows([]); setConfirmClear(false); }
    } finally {
      setClearing(false);
    }
  };

  const download = (r: Row) => {
    const features = {
      age: r.age, attendance: r.attendance, study_hours: r.studyHours, previous_marks: r.previousMarks,
      assignment_score: r.assignmentScore, sleep_hours: r.sleepHours,
      internet_access: r.internetAccess, extracurricular: r.extracurricular,
    };
    // Regenerate insights deterministically from the same model — report stays consistent
    const derived = predictForFeatures(features);
    downloadPredictionReport({
      studentName: r.studentName,
      predictionId: r.id,
      createdAt: r.createdAt,
      features,
      predicted: r.predictedMarks,
      rangeLow: derived.rangeLow,
      rangeHigh: derived.rangeHigh,
      category: r.category,
      deltaVsPrevious: Math.round((r.predictedMarks - r.previousMarks) * 10) / 10,
      insights: derived.insights,
      suggestions: derived.suggestions,
      modelVersion: r.modelVersion,
    });
  };

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[#0a2540]">
          <History size={17} className="text-[#2563eb]" /> {rows.length} prediction{rows.length === 1 ? "" : "s"} logged
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={refresh} className="btn btn-outline btn-sm"><RefreshCw size={14} /> Refresh</button>
          {confirmClear ? (
            <span className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700">
              Delete all history?
              <button onClick={clearAll} disabled={clearing} className="rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700 disabled:opacity-60">{clearing ? "…" : "Yes, delete"}</button>
              <button onClick={() => setConfirmClear(false)} className="rounded-md border border-red-200 px-2 py-1 hover:bg-white">Keep</button>
            </span>
          ) : (
            <button onClick={() => setConfirmClear(true)} className="btn btn-danger btn-sm"><Trash2 size={14} /> Clear History</button>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] font-semibold text-red-700">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Report</th><th>Student</th><th>Predicted</th><th>vs Prev.</th><th>Category</th><th>Model</th><th>Date</th><th className="text-right">PDF</th></tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => <tr key={i}><td colSpan={8}><div className="h-8 animate-pulse rounded-lg bg-[#eef2f9]" /></td></tr>)
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center">
                <History size={26} className="mx-auto text-[#c3cede]" />
                <p className="mt-2 text-sm font-semibold text-[#5b6b82]">No predictions yet</p>
                <p className="text-[11px] text-[#9aa7bc]">Run your first prediction from the Predict page.</p>
              </td></tr>
            ) : (
              rows.map((r) => {
                const delta = Math.round((r.predictedMarks - r.previousMarks) * 10) / 10;
                return (
                  <tr key={r.id}>
                    <td className="text-[11px] font-bold text-[#8ba0bd]">#{r.id}</td>
                    <td className="font-bold text-[#0a2540]">{r.studentName}</td>
                    <td className="font-extrabold tabular-nums text-[#0a2540]">{r.predictedMarks}<span className="text-[10px] font-bold text-[#8ba0bd]">/100</span></td>
                    <td className={`tabular-nums text-[12px] font-bold ${delta >= 0 ? "text-emerald-700" : "text-red-600"}`}>{delta >= 0 ? "+" : ""}{delta}</td>
                    <td><span className="pill" style={{ background: `${CATEGORY_COLORS[r.category]}1f`, color: CATEGORY_COLORS[r.category] }}>{r.category}</span></td>
                    <td className="text-[10.5px] font-semibold text-[#8ba0bd]">{r.modelVersion}</td>
                    <td className="whitespace-nowrap text-[11px] text-[#5b6b82]">{new Date(r.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="text-right">
                      <button onClick={() => download(r)} className="rounded-lg border border-[#dbeafe] bg-[#eff4ff] p-1.5 text-[#1d4ed8] transition-all hover:bg-[#dbeafe]" aria-label={`Download report for ${r.studentName}`} title="Download PDF report">
                        <FileDown size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-center text-[10.5px] text-[#9aa7bc]">PDFs are regenerated with the current model — insights shown may be newer than the original prediction.</p>
    </div>
  );
}
