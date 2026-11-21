"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Scatter, Doughnut } from "react-chartjs-2";
import {
  Users, Gauge, Trophy, LifeBuoy, CalendarCheck, BookOpenCheck, History, RefreshCw, ArrowRight,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const CATEGORY_COLORS: Record<string, string> = {
  Outstanding: "#10b981",
  Excellent: "#3b82f6",
  Good: "#14b8a6",
  "Needs Improvement": "#f59e0b",
  "At Risk": "#ef4444",
};

interface DashboardData {
  kpis: {
    totalStudents: number; avgPredicted: number; highestPredicted: number; needingSupport: number;
    avgAttendance: number; avgStudyHours: number; totalPredictions: number;
  };
  distribution: { category: string; count: number }[];
  topStudents: { name: string; predicted: number; category: string }[];
  attendanceVsMarks: { x: number; y: number; name: string }[];
  studyVsMarks: { x: number; y: number; name: string }[];
  recentPredictions: { id: number; studentName: string; predictedMarks: number; category: string; createdAt: string }[];
  supportThreshold: number;
}

const gridColor = "#e6ebf5";
const baseTooltip = {
  backgroundColor: "#0a2540",
  titleFont: { weight: 700 as const },
  padding: 12,
  cornerRadius: 10,
  boxPadding: 6,
  usePointStyle: true,
};

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // No synchronous setState — every state update happens after the await,
  // so it is safe to call from an effect (async callback).
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = () => { setLoading(true); void load(); };

  useEffect(() => {
    const t = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  if (loading) return <DashboardSkeleton />;
  if (error || !data)
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-sm font-semibold text-red-600">{error ?? "No data available"}</p>
        <button onClick={refresh} className="btn btn-primary btn-sm mt-4"><RefreshCw size={14} /> Retry</button>
      </div>
    );

  const { kpis } = data;

  const barData = {
    labels: data.topStudents.map((s) => s.name.split(" ")[0] + " " + (s.name.split(" ")[1]?.[0] ?? "") + "."),
    datasets: [{
      label: "Predicted marks",
      data: data.topStudents.map((s) => s.predicted),
      backgroundColor: data.topStudents.map((s) => CATEGORY_COLORS[s.category] ?? "#2563eb"),
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 44,
    }],
  };

  const attendanceData = {
    datasets: [{
      label: "Students",
      data: data.attendanceVsMarks,
      backgroundColor: "rgba(37, 99, 235, 0.75)",
      borderColor: "#1d4ed8",
      pointRadius: 6,
      pointHoverRadius: 8,
    }],
  };

  const studyData = {
    datasets: [{
      label: "Students",
      data: data.studyVsMarks,
      backgroundColor: "rgba(20, 184, 166, 0.75)",
      borderColor: "#0f766e",
      pointRadius: 6,
      pointHoverRadius: 8,
    }],
  };

  const pieData = {
    labels: data.distribution.map((d) => d.category),
    datasets: [{
      data: data.distribution.map((d) => d.count),
      backgroundColor: data.distribution.map((d) => CATEGORY_COLORS[d.category]),
      borderWidth: 2,
      borderColor: "#ffffff",
      hoverOffset: 10,
    }],
  };

  const scatterOptions = (xLabel: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...baseTooltip,
        callbacks: {
          title: (items: { raw: unknown }[]) => (items[0]?.raw as { name: string })?.name ?? "Student",
          label: (item: { raw: unknown }) => {
            const raw = item.raw as { x: number; y: number };
            return `${xLabel}: ${raw.x} · Predicted: ${raw.y}`;
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: xLabel, font: { weight: 700 as const, size: 11 }, color: "#5b6b82" }, grid: { color: gridColor }, ticks: { color: "#5b6b82" } },
      y: { title: { display: true, text: "Predicted Marks (/100)", font: { weight: 700 as const, size: 11 }, color: "#5b6b82" }, grid: { color: gridColor }, min: 0, max: 100, ticks: { color: "#5b6b82" } },
    },
  });

  const kpiCards = [
    { icon: Users, label: "Total Students", value: kpis.totalStudents, sub: `${kpis.totalPredictions} predictions logged`, tint: "bg-[#dbeafe] text-[#1d4ed8]" },
    { icon: Gauge, label: "Avg Predicted Marks", value: `${kpis.avgPredicted}`, sub: "across latest predictions", tint: "bg-[#d1fae5] text-[#065f46]" },
    { icon: Trophy, label: "Highest Prediction", value: `${kpis.highestPredicted}`, sub: "best projected score", tint: "bg-[#fef3c7] text-[#92400e]" },
    { icon: LifeBuoy, label: "Needing Support", value: kpis.needingSupport, sub: `predicted below ${data.supportThreshold}`, tint: "bg-[#fee2e2] text-[#991b1b]" },
  ];

  return (
    <div className="space-y-6">
      {/* ===== KPI row ===== */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpiCards.map((k) => (
          <div key={k.label} className="card kpi-glow p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${k.tint}`}>
              <k.icon size={19} strokeWidth={2.1} />
            </div>
            <div className="text-2xl font-black tracking-tight text-[#0a2540] sm:text-3xl">{k.value}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#5b6b82]">{k.label}</div>
            <div className="text-[10.5px] text-[#8ba0bd]">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ===== Secondary metrics strip ===== */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: CalendarCheck, label: "Avg Attendance", value: `${kpis.avgAttendance}%` },
          { icon: BookOpenCheck, label: "Avg Study Hours", value: `${kpis.avgStudyHours} h/day` },
          { icon: History, label: "Predictions Logged", value: String(kpis.totalPredictions) },
          { icon: LifeBuoy, label: "Support Rate", value: `${kpis.totalStudents ? Math.round((kpis.needingSupport / kpis.totalStudents) * 100) : 0}%` },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-[#e2e8f3] bg-white px-4 py-3">
            <s.icon size={18} className="shrink-0 text-[#2563eb]" />
            <div className="min-w-0">
              <div className="truncate text-base font-extrabold text-[#0a2540]">{s.value}</div>
              <div className="text-[9.5px] font-semibold uppercase tracking-wider text-[#8ba0bd]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Charts row 1: bar + doughnut ===== */}
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="card p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-[#0a2540]">Top Performers — Predicted Marks</h2>
              <p className="text-[11px] text-[#8ba0bd]">Bar colour indicates the performance category</p>
            </div>
            <Link href="/students?sort=marks_desc" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563eb] hover:text-[#1d4ed8]">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="h-64 sm:h-72">
            <Bar data={barData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { ...baseTooltip, callbacks: { title: (items) => data.topStudents[items[0].dataIndex]?.name ?? "", label: (i) => ` Predicted: ${i.parsed.y} / 100` } } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#5b6b82", font: { size: 10 } } },
                y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: "#5b6b82" } },
              },
            }} />
          </div>
        </div>

        <div className="card p-5 xl:col-span-2">
          <h2 className="text-sm font-extrabold text-[#0a2540]">Performance Category Distribution</h2>
          <p className="text-[11px] text-[#8ba0bd]">Latest prediction per registered student</p>
          <div className="relative mx-auto mt-3 h-52 max-w-[280px]">
            <Doughnut data={pieData} options={{
              responsive: true, maintainAspectRatio: false, cutout: "58%",
              plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10.5 }, color: "#44536e" } }, tooltip: { ...baseTooltip, callbacks: { label: (i) => ` ${i.label}: ${i.parsed} students` } } },
            }} />
          </div>
          <div className="mt-3 space-y-1.5">
            {data.distribution.map((d) => (
              <div key={d.category} className="flex items-center gap-2 text-[11px]">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CATEGORY_COLORS[d.category] }} />
                <span className="flex-1 text-[#44536e]">{d.category}</span>
                <span className="font-bold text-[#0a2540]">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Charts row 2: scatters ===== */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-extrabold text-[#0a2540]">Attendance vs Predicted Marks</h2>
          <p className="text-[11px] text-[#8ba0bd]">Each dot is a student — hover for details</p>
          <div className="mt-3 h-64"><Scatter data={attendanceData} options={scatterOptions("Attendance (%)")} /></div>
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-extrabold text-[#0a2540]">Study Hours vs Predicted Marks</h2>
          <p className="text-[11px] text-[#8ba0bd]">Daily self-study hours, per student</p>
          <div className="mt-3 h-64"><Scatter data={studyData} options={scatterOptions("Study hours / day")} /></div>
        </div>
      </div>

      {/* ===== Recent predictions ===== */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#eef0f8] px-5 py-4">
          <div>
            <h2 className="text-sm font-extrabold text-[#0a2540]">Recent Predictions</h2>
            <p className="text-[11px] text-[#8ba0bd]">Latest model outputs stored in PostgreSQL</p>
          </div>
          <Link href="/history" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563eb] hover:text-[#1d4ed8]">Full history <ArrowRight size={12} /></Link>
        </div>
        <ul className="divide-y divide-[#eef0f8]">
          {data.recentPredictions.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-[#f8faff]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eff4ff] text-[12px] font-extrabold text-[#2563eb]">
                {p.studentName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-[#0a2540]">{p.studentName}</div>
                <div className="text-[10.5px] text-[#8ba0bd]">{new Date(p.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-black text-[#0a2540]">{p.predictedMarks}<span className="text-[10px] font-bold text-[#8ba0bd]">/100</span></div>
                <span className="pill" style={{ background: `${CATEGORY_COLORS[p.category]}22`, color: CATEGORY_COLORS[p.category] }}>{p.category}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-32" />)}</div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-16" />)}</div>
      <div className="grid gap-6 xl:grid-cols-5"><div className="card h-80 xl:col-span-3" /><div className="card h-80 xl:col-span-2" /></div>
    </div>
  );
}
