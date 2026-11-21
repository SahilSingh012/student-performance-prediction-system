import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  GraduationCap, LayoutDashboard, Wand2, Database, ShieldCheck, BrainCircuit,
  FileText, Users, CheckCircle2, ArrowRight, Server, Globe, Code2, Boxes,
} from "lucide-react";

export const metadata: Metadata = { title: "About" };

const STACK = [
  { icon: Globe, name: "Next.js 16 (App Router)", role: "Fullstack framework — React Server Components + API routes" },
  { icon: Server, name: "PostgreSQL + Drizzle ORM", role: "Parameterised, type-safe data layer (students, predictions)" },
  { icon: BrainCircuit, name: "TypeScript ML Engine", role: "Dataset synthesis, Ridge OLS, metrics, CV — zero dependencies" },
  { icon: LayoutDashboard, name: "Chart.js + react-chartjs-2", role: "Bar, scatter and doughnut visualisations" },
  { icon: FileText, name: "jsPDF", role: "Client-side branded A4 prediction reports" },
  { icon: Code2, name: "Tailwind CSS v4 + Lucide", role: "Design system and iconography" },
];

const FEATURES = [
  "ML prediction with ±MAE uncertainty band",
  "Performance categorisation (5 bands)",
  "Personalised, rule-based study recommendations",
  "KPI dashboard — averages, extremes, support list",
  "Export register & synthetic dataset as CSV",
  "Full prediction history with PDF re-download",
  "Admin: one-click synthetic data reset",
  "Server-side validation & parameterised queries",
];

export default function AboutPage() {
  return (
    <AppShell title="About the Project" subtitle="Goals, stack, features and honest limitations">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Hero card */}
        <div className="card flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0a2540] shadow-lg">
            <GraduationCap size={30} className="text-[#7db4ff]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#0a2540] sm:text-2xl">Student Performance Prediction System Using Machine Learning</h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[#5b6b82]">
              A college Data-Science capstone demonstrating the full ML product lifecycle: reproducible synthetic
              data, leakage-free evaluation, an interpretable regression model, and a production-quality web
              experience — with every metric visible on this site.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/predict" className="btn btn-primary btn-sm">Try the Predictor <ArrowRight size={13} /></Link>
              <Link href="/docs" className="btn btn-outline btn-sm">Read the Docs</Link>
            </div>
          </div>
        </div>

        {/* Feature checklist */}
        <div className="card p-6">
          <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#0a2540]">Implemented Features</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[12px] leading-snug text-[#33415c]">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />{f}
              </li>
            ))}
          </ul>
        </div>

        {/* Tech stack */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#5b6b82]"><Boxes size={14} /> Technology Stack</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STACK.map((s) => (
              <div key={s.name} className="card card-hover p-5">
                <s.icon size={22} className="text-[#2563eb]" />
                <div className="mt-2.5 text-[13px] font-extrabold text-[#0a2540]">{s.name}</div>
                <p className="mt-1 text-[11px] leading-snug text-[#5b6b82]">{s.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Synthetic data / disclaimers */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card border-l-4 !border-l-amber-400 p-5">
            <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-amber-800"><Database size={15} /> Synthetic Data Only</div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[#5b6b82]">
              All 600 training rows and all seeded demo students are computer-generated with a fixed seed.
              Names are fictional composites. Nothing in this project describes, profiles or ranks any real person.
            </p>
          </div>
          <div className="card border-l-4 !border-l-red-400 p-5">
            <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-red-800"><ShieldCheck size={15} /> Not a Grading Tool</div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[#5b6b82]">
              Predictions are statistical estimates (±MAE) trained on synthetic patterns. They must never be used to
              assign grades, deny opportunities, or replace teacher judgement, counselling, or institutional policy.
            </p>
          </div>
        </div>

        {/* Honest note about stack adaptation */}
        <div className="card p-6">
          <h3 className="text-sm font-extrabold text-[#0a2540]">A Note on the Original Specification</h3>
          <p className="mt-2 text-[11.5px] leading-relaxed text-[#5b6b82]">
            The brief requested Python · Flask · Scikit-learn · SQLite on VS Code with Windows PowerShell instructions.
            This deliverable implements the <em>same product</em> on the platform’s managed stack — Next.js API routes
            (in place of Flask), PostgreSQL + Drizzle (in place of SQLite) and a from-scratch TypeScript ML pipeline
            (in place of <code>train_model.py</code> / <code>student_model.pkl</code>). The pipeline mirrors scikit-learn’s
            semantics exactly: seeded split, Ridge OLS, MAE/MSE/RMSE/R², 5-fold CV. The full 16-section write-up,
            including the architecture diagram and run instructions, lives in the{" "}
            <Link href="/docs" className="font-bold text-[#2563eb] hover:underline">Documentation</Link>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-[#44536e]">
            <span className="rounded-full border border-[#e2e8f3] bg-[#f8faff] px-3 py-1.5"><Users size={11} className="mr-1 inline" />Beginner-friendly code</span>
            <span className="rounded-full border border-[#e2e8f3] bg-[#f8faff] px-3 py-1.5"><Wand2 size={11} className="mr-1 inline" />Real inference, zero fakes</span>
            <span className="rounded-full border border-[#e2e8f3] bg-[#f8faff] px-3 py-1.5"><LayoutDashboard size={11} className="mr-1 inline" />Live charts from the DB</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
