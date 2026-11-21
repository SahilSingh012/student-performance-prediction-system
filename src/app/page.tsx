import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap, Wand2, LayoutDashboard, ArrowRight, CheckCircle2, BrainCircuit,
  BarChart3, FileText, Users, Database, ShieldCheck, Sparkles, BookOpenText, ChevronRight,
} from "lucide-react";
import { getModel, MODEL_NAME, DATASET_SIZE } from "@/lib/ml";

export default function HomePage() {
  const model = getModel();
  const m = model.metrics;

  return (
    <div className="min-h-screen bg-[#eef2f9]">
      {/* ============ Navbar ============ */}
      <header className="sticky top-0 z-40 border-b border-[#e2e8f3] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563eb] shadow-md">
              <GraduationCap size={20} className="text-white" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-extrabold tracking-tight text-[#0a2540]">EduPredict <span className="text-[#2563eb]">AI</span></div>
              <div className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#8ba0bd]">Student Performance ML</div>
            </div>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 text-[13px] font-semibold text-[#33415c] md:flex">
            {[["Dashboard", "/dashboard"], ["Predict", "/predict"], ["Model", "/model"], ["Docs", "/docs"], ["About", "/about"]].map(([label, href]) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-2 transition-colors hover:bg-[#eff4ff] hover:text-[#1d4ed8]">{label}</Link>
            ))}
          </nav>
          <Link href="/predict" className="btn btn-primary btn-sm ml-2">Try Predictor <ArrowRight size={14} /></Link>
        </div>
      </header>

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#dbeafe] blur-3xl opacity-70" />
        <div aria-hidden className="pointer-events-none absolute -left-40 top-40 h-[30rem] w-[30rem] rounded-full bg-[#e0e9ff] blur-3xl opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1d4ed8] shadow-sm">
              <Sparkles size={13} /> College Data-Science Project · End-to-End ML
            </div>
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-[#0a2540] sm:text-5xl xl:text-[3.6rem]">
              Predict Student<br />
              Performance with<br />
              <span className="text-[#2563eb]">Real Machine Learning</span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-[#44536e]">
              An end-to-end machine learning system that analyses attendance, study hours, previous marks,
              assignments and lifestyle factors to forecast exam scores — with transparent metrics,
              personalised insights and downloadable PDF reports.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/predict" className="btn btn-primary">Predict a Student’s Marks <ArrowRight size={16} /></Link>
              <Link href="/dashboard" className="btn btn-outline"><LayoutDashboard size={16} /> View Dashboard</Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium text-[#5b6b82]">
              {["600-record synthetic dataset", "80/20 train-test split", `Test R² = ${m.r2}`, `MAE = ${m.mae} marks`].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600" />{t}</span>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative animate-fade-up delay-2">
            <div className="card overflow-hidden !rounded-2xl">
              <Image src="/images/hero.jpg" alt="Students studying together in a modern library" width={1200} height={800} priority className="h-[300px] w-full object-cover sm:h-[380px] lg:h-[430px]" />
            </div>
            {/* Floating metric cards */}
            <div className="card animate-pop-in delay-3 absolute -left-2 top-6 flex items-center gap-3 px-4 py-3 sm:-left-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100"><BarChart3 size={20} className="text-emerald-700" /></div>
              <div>
                <div className="text-lg font-extrabold leading-none text-[#0a2540]">{(m.r2 * 100).toFixed(1)}%</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#5b6b82]">Variance Explained (R²)</div>
              </div>
            </div>
            <div className="card animate-pop-in delay-4 absolute -right-2 bottom-6 flex items-center gap-3 px-4 py-3 sm:-right-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dbeafe]"><BrainCircuit size={20} className="text-[#1d4ed8]" /></div>
              <div>
                <div className="text-lg font-extrabold leading-none text-[#0a2540]">±{m.mae} <span className="text-xs font-bold text-[#5b6b82]">marks</span></div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#5b6b82]">Avg. Prediction Error (MAE)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Live stats strip ============ */}
      <section className="border-y border-[#e2e8f3] bg-[#0a2540] text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 md:grid-cols-4">
          {[
            [String(DATASET_SIZE), "Synthetic training records"],
            [`${m.trainSize} / ${m.testSize}`, "Train / test split"],
            [String(m.cvR2Mean), "5-Fold CV R² (mean)"],
            [MODEL_NAME.split(" (")[0], "Production algorithm"],
          ].map(([v, l]) => (
            <div key={l} className="px-4 py-5 text-center sm:py-6">
              <div className="text-base font-extrabold text-[#7db4ff] sm:text-xl">{v}</div>
              <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#a9bcd8] sm:text-[10px]">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ Features ============ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="label">What’s inside</div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0a2540] sm:text-3xl">A Complete Analytics Platform</h2>
          </div>
          <Link href="/docs" className="inline-flex items-center gap-1 text-sm font-bold text-[#2563eb] hover:text-[#1d4ed8]">Read full documentation <ChevronRight size={15} /></Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Wand2, title: "ML-Powered Prediction", desc: "Ridge-regularised multiple linear regression trained on 600 synthetic records; real MAE, RMSE & R² reported honestly.", href: "/predict" },
            { icon: LayoutDashboard, title: "Interactive Dashboard", desc: "KPIs, top performers, attendance-vs-marks scatter, study-hours correlation and category distribution — live from the database.", href: "/dashboard" },
            { icon: Users, title: "Student Records", desc: "Search, filter, sort and manage every registered student. Export the full register as CSV with one click.", href: "/students" },
            { icon: FileText, title: "PDF Reports", desc: "Branded A4 prediction report with profile, outcome, insights and recommendations — generated client-side, instantly.", href: "/history" },
            { icon: BrainCircuit, title: "Model Transparency", desc: "See coefficients, feature importance, cross-validation scores and the exact training pipeline — no black box.", href: "/model" },
            { icon: ShieldCheck, title: "Honest & Safe", desc: "Synthetic data only, server-side validation, parameterised queries, and clear disclaimers everywhere.", href: "/about" },
          ].map((f) => (
            <Link key={f.title} href={f.href} className="card card-hover group p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#eff4ff] transition-colors group-hover:bg-[#dbeafe]">
                <f.icon size={22} className="text-[#2563eb]" strokeWidth={2} />
              </div>
              <h3 className="text-[15px] font-extrabold text-[#0a2540]">{f.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#5b6b82]">{f.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#2563eb]">Explore <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" /></div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ How it works ============ */}
      <section className="border-t border-[#e2e8f3] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="label">Workflow</div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0a2540] sm:text-3xl">From Raw Data to Prediction in 4 Steps</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              { n: "01", t: "Register / Select Student", d: "Enter demographics and academic history, or pick an existing record from the register." },
              { n: "02", t: "Model Pre-Processes", d: "Features are vectorised, validated and fed to the ridge-regularised linear model in real time." },
              { n: "03", t: "Instant Prediction", d: "Expected final marks, ±MAE confidence band, performance category and delta vs previous exam." },
              { n: "04", t: "Insights & Action Plan", d: "Strengths, risk factors, top contributing features and personalised study recommendations." },
            ].map((s) => (
              <li key={s.n} className="relative rounded-2xl border border-[#e2e8f3] bg-[#f8faff] p-5">
                <div className="text-3xl font-black text-[#c7d6f2]">{s.n}</div>
                <h3 className="mt-2 text-[14px] font-extrabold text-[#0a2540]">{s.t}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-[#5b6b82]">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ Dataset & ethics ============ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="card grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100"><Database size={22} className="text-amber-700" /></div>
            <div>
              <h3 className="text-base font-extrabold text-[#0a2540]">100% Synthetic Data — Clearly Labelled</h3>
              <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-[#5b6b82]">
                The 600-row training dataset is computer-generated with a fixed seed (documented in <code className="rounded bg-[#eef2fb] px-1.5 py-0.5 text-[11px] text-[#1d4ed8]">src/lib/ml.ts</code>).
                No real student information is collected, stored or transmitted. Download the exact CSV used for training.
              </p>
            </div>
          </div>
          <a href="/api/dataset" className="btn btn-navy self-start md:self-center"><Database size={16} /> Download students.csv</a>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="bg-[#0a2540]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6 lg:px-8">
          <BookOpenText size={30} className="text-[#7db4ff]" />
          <h2 className="max-w-2xl text-2xl font-black tracking-tight text-white sm:text-3xl">Ready to see the model in action?</h2>
          <p className="max-w-md text-sm text-[#a9bcd8]">Predict marks, explore the dashboard, inspect the pipeline — all wired to a real trained regression model, not fake numbers.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/predict" className="btn btn-primary">Launch Predictor <ArrowRight size={16} /></Link>
            <Link href="/model" className="btn border-white/25 bg-white/10 text-white hover:bg-white/15">View Model Metrics</Link>
          </div>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="border-t border-white/10 bg-[#081d33] text-[#8ba6c9]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-[12px] sm:grid-cols-3 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2 font-extrabold text-white"><GraduationCap size={16} /> EduPredict AI</div>
            <p className="mt-2 leading-relaxed">Student Performance Prediction System Using Machine Learning — a complete, beginner-friendly college project.</p>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6d87a8]">Project</div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {[["Dashboard", "/dashboard"], ["Predict", "/predict"], ["Records", "/students"], ["Model", "/model"], ["Docs", "/docs"], ["About", "/about"]].map(([l, h]) => <Link key={h} href={h} className="hover:text-white">{l}</Link>)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6d87a8]">Disclaimer</div>
            <p className="mt-2 leading-relaxed">Built for education. Predictions are statistical estimates from synthetic data and must not replace teacher assessment, diagnosis, or institutional decision-making.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
