"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wand2, Loader2, RotateCcw, UserRound, UsersRound, Wifi, Sparkles, CircleAlert,
  TrendingUp, TrendingDown, Lightbulb, BadgeCheck, Download, History, ChevronDown, BrainCircuit, Trash2,
} from "lucide-react";
import { downloadPredictionReport } from "@/lib/report";
import { CATEGORY_META, type PerformanceCategory } from "@/lib/ml";

interface StudentOption {
  id: number; name: string; age: number; attendance: number; study_hours: number;
  previous_marks: number; assignment_score: number; sleep_hours: number;
  internet_access: boolean; extracurricular: boolean;
}

interface ApiResult {
  ok: boolean;
  predictionId?: number;
  createdAt?: string;
  studentId?: number;
  studentName?: string;
  features?: Record<string, number | boolean>;
  predicted?: number;
  rangeLow?: number;
  rangeHigh?: number;
  category?: string;
  deltaVsPrevious?: number;
  insights?: string[];
  suggestions?: string[];
  contributors?: { label: string; impact: number }[];
  errors?: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Outstanding: "#10b981", Excellent: "#3b82f6", Good: "#14b8a6", "Needs Improvement": "#f59e0b", "At Risk": "#ef4444",
};

const DEFAULT_FIELDS = { age: "17", attendance: "82", study_hours: "4.5", previous_marks: "68", assignment_score: "71", sleep_hours: "7.5" };

function useCountUp(target: number | undefined, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === undefined) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(2, -10 * p);
      setValue(p >= 1 ? target : Math.round(target * eased * 10) / 10);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default function PredictStudio() {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [name, setName] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [fields, setFields] = useState({ ...DEFAULT_FIELDS });
  const [internet, setInternet] = useState(true);
  const [extracurricular, setExtracurricular] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  const setField = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
  };

  const setFieldNum = (key: keyof typeof fields, v: string) => setFields((f) => ({ ...f, [key]: v }));

  useEffect(() => {
    if (mode !== "existing") return;
    fetch("/api/students?pageSize=100&sort=name", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => json.ok && setStudents(json.rows))
      .catch(() => setErrors(["Could not load student list."]));
  }, [mode]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const s = students.find((st) => String(st.id) === id);
    if (s) {
      setFields({
        age: String(s.age), attendance: String(s.attendance), study_hours: String(s.study_hours),
        previous_marks: String(s.previous_marks), assignment_score: String(s.assignment_score), sleep_hours: String(s.sleep_hours),
      });
      setInternet(s.internet_access);
      setExtracurricular(s.extracurricular);
    }
  };

  const validateClient = (): string[] => {
    const errs: string[] = [];
    if (mode === "new" && name.trim().length < 2) errs.push("Student name is required (min 2 characters).");
    if (mode === "existing" && !selectedId) errs.push("Please select a student from the register.");
    const checks: [keyof typeof fields, string, number, number][] = [
      ["age", "Age", 10, 30], ["attendance", "Attendance", 0, 100], ["study_hours", "Study hours", 0, 16],
      ["previous_marks", "Previous marks", 0, 100], ["assignment_score", "Assignment score", 0, 100], ["sleep_hours", "Sleep hours", 0, 14],
    ];
    for (const [key, label, min, max] of checks) {
      const v = Number(fields[key]);
      if (fields[key] === "" || Number.isNaN(v)) errs.push(`${label} is required.`);
      else if (v < min || v > max) errs.push(`${label} must be between ${min} and ${max}.`);
    }
    return errs;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateClient();
    setErrors(errs);
    if (errs.length) return;

    setSubmitting(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = {
        ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, Number(v)])),
        internet_access: internet,
        extracurricular,
      };
      if (mode === "existing") payload.student_id = Number(selectedId);
      else payload.name = name.trim();

      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as ApiResult;
      if (!res.ok || !json.ok) {
        setErrors(json.errors ?? ["Prediction failed. Please check the inputs."]);
        return;
      }
      setResult(json);
    } catch {
      setErrors(["Network error — could not reach the prediction service."]);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setResult(null);
    setErrors([]);
    setName("");
    setSelectedId("");
    setFields({ ...DEFAULT_FIELDS });
    setInternet(true);
    setExtracurricular(true);
  };

  const animatedPredicted = useCountUp(result?.predicted);
  const dialOffset = useMemo(() => {
    if (result?.predicted === undefined) return 2 * Math.PI * 52;
    const c = 2 * Math.PI * 52;
    return c * (1 - result.predicted / 100);
  }, [result?.predicted]);

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      {/* ================= FORM ================= */}
      <form onSubmit={onSubmit} className="card xl:col-span-2 h-fit p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-[#0a2540]">Student Details</h2>
          <div className="flex rounded-lg bg-[#eef2f9] p-1 text-[11px] font-bold">
            {([["new", "New Student", UserRound], ["existing", "Existing", UsersRound]] as const).map(([m, label, Icon]) => (
              <button key={m} type="button" onClick={() => { setMode(m); setErrors([]); setResult(null); }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${mode === m ? "bg-white text-[#1d4ed8] shadow-sm" : "text-[#5b6b82]"}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Name / selector */}
        <div className="mt-5">
          {mode === "new" ? (
            <>
              <label className="label" htmlFor="name">Student Name *</label>
              <input id="name" className="input" placeholder="e.g. Aarav Sharma" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
              <p className="mt-1 text-[10.5px] text-[#8ba0bd]">The student will be registered and linked to this prediction.</p>
            </>
          ) : (
            <>
              <label className="label" htmlFor="student-select">Select Registered Student *</label>
              <div className="relative">
                <select id="student-select" className="input appearance-none pr-9" value={selectedId} onChange={(e) => handleSelect(e.target.value)}>
                  <option value="">— Choose from register —</option>
                  {students.map((s) => <option key={s.id} value={s.id}>#{s.id} · {s.name}</option>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba0bd]" />
              </div>
              <p className="mt-1 text-[10.5px] text-[#8ba0bd]">Selecting a student pre-fills their stored data — edit any field to run a what-if scenario.</p>
            </>
          )}
        </div>

        {/* Numeric inputs */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Age" unit="yrs">
            <input type="number" min={10} max={30} className="input" value={fields.age} onChange={setField("age")} />
          </Field>
          <Field label="Sleep Hours" unit="h/night">
            <input type="number" min={0} max={14} step={0.5} className="input" value={fields.sleep_hours} onChange={setField("sleep_hours")} />
          </Field>
        </div>

        <div className="mt-4 space-y-4">
          <SliderField label="Attendance" value={fields.attendance} min={0} max={100} step={1} unit="%"
            hint={Number(fields.attendance) < 75 ? "Below 75% threshold" : Number(fields.attendance) >= 90 ? "Excellent" : "Healthy"}
            onChange={(v) => setFieldNum("attendance", v)} />
          <SliderField label="Study Hours / Day" value={fields.study_hours} min={0} max={12} step={0.5} unit="h"
            hint={Number(fields.study_hours) < 2 ? "Very low" : Number(fields.study_hours) >= 5 ? "Strong routine" : "Moderate"}
            onChange={(v) => setFieldNum("study_hours", v)} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Previous Exam Marks" unit="/100">
            <input type="number" min={0} max={100} className="input" value={fields.previous_marks} onChange={setField("previous_marks")} />
          </Field>
          <Field label="Assignment Score" unit="/100">
            <input type="number" min={0} max={100} className="input" value={fields.assignment_score} onChange={setField("assignment_score")} />
          </Field>
        </div>

        {/* Toggles */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Toggle label="Internet Access" icon={<Wifi size={15} />} value={internet} onChange={setInternet} />
          <Toggle label="Extracurricular" icon={<Sparkles size={15} />} value={extracurricular} onChange={setExtracurricular} />
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
            {errors.map((e) => (
              <p key={e} className="flex items-start gap-2 text-[11.5px] font-medium text-red-700"><CircleAlert size={13} className="mt-0.5 shrink-0" />{e}</p>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center gap-2">
          <button type="submit" disabled={submitting} className="btn btn-primary flex-1 justify-center !py-3 disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? <><Loader2 size={17} className="animate-spin" /> Analysing…</> : <><Wand2 size={17} /> Predict Performance</>}
          </button>
          <button type="button" onClick={resetAll} className="btn btn-outline !px-3" title="Clear form" aria-label="Clear form"><Trash2 size={17} /></button>
        </div>
        <p className="mt-3 text-center text-[10px] leading-snug text-[#9aa7bc]">Synthetic-data model · estimates carry ±MAE uncertainty · not a guarantee of results</p>
      </form>

      {/* ================= RESULT ================= */}
      <div className="xl:col-span-3">
        {!result ? <EmptyState /> : (
          <div className="space-y-5">
            {/* Outcome card */}
            <div className="card animate-pop-in overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-[#eef0f8] bg-[#f8faff] px-6 py-3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1d4ed8]"><BadgeCheck size={14} /> Prediction Complete · Report #{result.predictionId}</div>
                <span className="text-[10.5px] font-semibold text-[#8ba0bd]">{result.studentName}</span>
              </div>
              <div className="grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr]">
                {/* Dial */}
                <div className="relative mx-auto">
                  <svg width="150" height="150" viewBox="0 0 130 130" role="img" aria-label={`Predicted marks ${result.predicted} out of 100`}>
                    <circle cx="65" cy="65" r="52" fill="none" stroke="#e8edf7" strokeWidth="11" />
                    <circle cx="65" cy="65" r="52" fill="none" stroke={CATEGORY_COLORS[result.category ?? "Good"]} strokeWidth="11"
                      strokeLinecap="round" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={dialOffset}
                      transform="rotate(-90 65 65)" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }} />
                    <text x="65" y="61" textAnchor="middle" fontSize="27" fontWeight="800" fill="#0a2540">{animatedPredicted.toFixed(animatedPredicted % 1 ? 1 : 0)}</text>
                    <text x="65" y="78" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8ba0bd" letterSpacing="1">OUT OF 100</text>
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="pill !px-4 !py-1.5 !text-[12px] text-white" style={{ background: CATEGORY_COLORS[result.category ?? "Good"] }}>{result.category}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5b6b82]">Range {result.rangeLow}–{result.rangeHigh} (±MAE)</span>
                  </div>
                  <p className="mt-3 text-[12px] leading-relaxed text-[#5b6b82]">{CATEGORY_META[result.category as PerformanceCategory]?.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-[12px] font-bold">
                    {(result.deltaVsPrevious ?? 0) >= 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700"><TrendingUp size={14} /> +{result.deltaVsPrevious} vs previous exam</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-red-700"><TrendingDown size={14} /> {result.deltaVsPrevious} vs previous exam</span>
                    )}
                  </div>
                  {/* Contributors */}
                  <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8ba0bd]">Top factors driving this prediction</div>
                    <ul className="mt-2 space-y-1.5">
                      {result.contributors?.map((c) => (
                        <li key={c.label} className="flex items-center gap-2 text-[11px]">
                          <span className="w-40 truncate text-[#44536e]">{c.label}</span>
                          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#eef0f8]">
                            <div className={`absolute top-0 h-full rounded-full ${c.impact >= 0 ? "left-1/2 bg-emerald-500" : "right-1/2 bg-red-400"}`}
                              style={{ width: `${Math.min(50, Math.abs(c.impact) * 2.2)}%` }} />
                          </div>
                          <span className={`w-11 text-right font-bold tabular-nums ${c.impact >= 0 ? "text-emerald-700" : "text-red-600"}`}>{c.impact >= 0 ? "+" : ""}{c.impact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-[#eef0f8] bg-white px-6 py-4">
                <button onClick={() => downloadPredictionReport({
                  studentName: result.studentName ?? "Student",
                  predictionId: result.predictionId ?? 0,
                  createdAt: result.createdAt,
                  features: result.features as never,
                  predicted: result.predicted!, rangeLow: result.rangeLow!, rangeHigh: result.rangeHigh!,
                  category: result.category!, deltaVsPrevious: result.deltaVsPrevious!,
                  insights: result.insights!, suggestions: result.suggestions!, modelVersion: "v1.0.0",
                })} className="btn btn-navy btn-sm"><Download size={14} /> Download PDF Report</button>
                <a href="/history" className="btn btn-outline btn-sm"><History size={14} /> View History</a>
                <button onClick={resetAll} className="btn btn-ghost btn-sm ml-auto"><RotateCcw size={14} /> New Prediction</button>
              </div>
            </div>

            {/* Insights + suggestions */}
            <div className="grid gap-5 md:grid-cols-2">
              <InsightCard title="Academic Insights" icon={<BrainCircuit size={16} className="text-[#2563eb]" />} items={result.insights ?? []} accent="bg-[#eff4ff] text-[#1d4ed8]" />
              <InsightCard title="Personalised Suggestions" icon={<Lightbulb size={16} className="text-amber-600" />} items={result.suggestions ?? []} accent="bg-amber-50 text-amber-800" numbered />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Sub components ---------- */
function Field({ label, unit, children }: { label: string; unit?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}{unit && <span className="ml-1 normal-case text-[#9aa7bc]">({unit})</span>}</label>
      {children}
    </div>
  );
}

function SliderField({ label, value, min, max, step, unit, hint, onChange }: {
  label: string; value: string; min: number; max: number; step: number; unit: string; hint?: string; onChange: (v: string) => void;
}) {
  const num = Number(value) || 0;
  return (
    <div>
      <div className="mb-1 flex items-end justify-between gap-2">
        <label className="label !mb-0">{label}</label>
        <div className="flex items-baseline gap-2">
          <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)}
            className="w-16 rounded-md border border-[#e2e8f3] bg-[#fbfcfe] px-2 py-1 text-right text-[13px] font-extrabold text-[#0a2540] focus:border-[#2563eb] focus:outline-none" aria-label={label} />
          <span className="text-[11px] font-bold text-[#8ba0bd]">{unit}</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={num} onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} slider`}
        className="h-2 w-full cursor-pointer accent-[#2563eb]" />
      {hint && <div className="mt-1 text-[10px] font-semibold text-[#8ba0bd]">{hint}</div>}
    </div>
  );
}

function Toggle({ label, icon, value, onChange }: { label: string; icon: React.ReactNode; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} aria-pressed={value}
      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${value ? "border-[#2563eb] bg-[#eff4ff]" : "border-[#e2e8f3] bg-[#fbfcfe] hover:border-[#c4cfe4]"}`}>
      <span className={value ? "text-[#2563eb]" : "text-[#8ba0bd]"}>{icon}</span>
      <span className="flex-1 text-[11px] font-bold leading-tight text-[#33415c]">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${value ? "bg-[#2563eb]" : "bg-[#cbd5e8]"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="card flex h-full min-h-[420px] flex-col items-center justify-center border-dashed p-10 text-center" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #dbe3f0 1px, transparent 0)", backgroundSize: "18px 18px" }}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eff4ff]"><BrainCircuit size={30} className="text-[#2563eb]" /></div>
      <h2 className="mt-4 text-lg font-extrabold text-[#0a2540]">Awaiting Student Data</h2>
      <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-[#5b6b82]">Fill the form and press <strong>Predict Performance</strong>. The ridge regression model will compute expected final marks, confidence range, and an action plan.</p>
      <div className="mt-6 grid grid-cols-2 gap-2 text-left text-[10.5px] font-semibold text-[#44536e] sm:grid-cols-4">
        {["Attendance", "Study Hours", "Previous Marks", "Assignments", "Sleep", "Internet", "Extracurricular", "Age"].map((t) => (
          <div key={t} className="rounded-lg border border-[#e2e8f3] bg-white px-2.5 py-2 text-center shadow-sm">{t}</div>
        ))}
      </div>
    </div>
  );
}

function InsightCard({ title, icon, items, accent, numbered }: { title: string; icon: React.ReactNode; items: string[]; accent: string; numbered?: boolean }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">{icon}<h3 className="text-[13px] font-extrabold text-[#0a2540]">{title}</h3></div>
      <ul className="mt-3 space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-[#33415c]">
            <span className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md px-1 text-[9px] font-black ${accent}`}>{numbered ? i + 1 : "•"}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
