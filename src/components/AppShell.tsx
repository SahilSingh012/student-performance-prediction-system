"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wand2, Users, History, BrainCircuit, BookOpenText, Info,
  GraduationCap, Menu, X, RotateCcw, ShieldAlert, ExternalLink,
} from "lucide-react";

const NAV = [
  { group: "Overview", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/predict", label: "Predict Marks", icon: Wand2 },
  ]},
  { group: "Manage", items: [
    { href: "/students", label: "Student Records", icon: Users },
    { href: "/history", label: "Prediction History", icon: History },
  ]},
  { group: "System", items: [
    { href: "/model", label: "Model & Metrics", icon: BrainCircuit },
    { href: "/docs", label: "Documentation", icon: BookOpenText },
    { href: "/about", label: "About Project", icon: Info },
  ]},
];

export default function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!window.confirm("Reset the demo? All registered students and predictions will be replaced with 90 fresh synthetic records.")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      const json = await res.json();
      if (json.ok) window.location.reload();
      else window.alert("Reset failed. Please try again.");
    } catch {
      window.alert("Reset failed. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#0a2540] text-slate-200">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563eb] shadow-lg">
            <GraduationCap size={20} strokeWidth={2.2} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-extrabold tracking-tight text-white">EduPredict <span className="text-[#7db4ff]">AI</span></div>
            <div className="text-[9.5px] font-medium uppercase tracking-[0.14em] text-[#8ba6c9]">Student ML Analytics</div>
          </div>
        </Link>
        <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {NAV.map((section) => (
          <div key={section.group}>
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6d87a8]">{section.group}</div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`sidebar-link ${active ? "active" : ""}`}>
                    <Icon size={17} strokeWidth={2} />
                    <span>{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6d87a8]">Admin</div>
          <button onClick={handleReset} disabled={resetting} className="sidebar-link w-full text-left disabled:opacity-60">
            <RotateCcw size={17} strokeWidth={2} className={resetting ? "animate-spin" : ""} />
            <span>{resetting ? "Resetting…" : "Reset Demo Data"}</span>
          </button>
          <a href="/api/students/export" className="sidebar-link" download>
            <ExternalLink size={17} strokeWidth={2} />
            <span>Export Students CSV</span>
          </a>
        </div>
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 p-3">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-[10.5px] leading-snug text-amber-100/90">
            Synthetic demonstration data only. Predictions are statistical estimates, not a substitute for academic assessment.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/55 animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] animate-fade-up shadow-2xl">{sidebar}</aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#e2e8f3] bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6">
          <button className="rounded-lg border border-[#e2e8f3] p-2 text-[#10355c] hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-extrabold tracking-tight text-[#0a2540] sm:text-lg">{title}</h1>
            {subtitle && <p className="hidden truncate text-[11px] text-[#5b6b82] sm:block">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" /> Model Online
            </span>
            <Link href="/predict" className="btn btn-primary btn-sm">
              <Wand2 size={15} /> New Prediction
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
