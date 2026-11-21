import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import { getModel, MODEL_NAME, MODEL_VERSION, DATASET_SIZE } from "@/lib/ml";
import {
  BrainCircuit, Database, Download, Target, Sigma, Ruler, Repeat2, CheckCircle2, AlertTriangle, Braces, ListOrdered,
} from "lucide-react";

export const metadata: Metadata = { title: "Model & Metrics" };

export default function ModelPage() {
  const model = getModel();
  const m = model.metrics;
  const maxImportance = Math.max(...model.coefficients.map((c) => c.absImportance));

  const metricCards = [
    { icon: Ruler, label: "Mean Absolute Error", value: m.mae.toFixed(2), unit: "marks", sub: "Average absolute gap between prediction & actual", tone: "text-[#1d4ed8] bg-[#dbeafe]" },
    { icon: Sigma, label: "Mean Squared Error", value: m.mse.toFixed(2), unit: "marks²", sub: "Penalises larger errors more heavily", tone: "text-[#0f766e] bg-[#ccfbf1]" },
    { icon: Target, label: "RMSE", value: m.rmse.toFixed(2), unit: "marks", sub: "√MSE — same unit as target variable", tone: "text-[#92400e] bg-[#fef3c7]" },
    { icon: BrainCircuit, label: "R² Score (Test)", value: m.r2.toFixed(4), unit: "", sub: `Train R² = ${m.r2Train.toFixed(4)} · close train/test ⇒ no overfit`, tone: "text-[#065f46] bg-[#d1fae5]" },
    { icon: Repeat2, label: "5-Fold CV R²", value: m.cvR2Mean.toFixed(4), unit: `± ${m.cvR2Std.toFixed(4)}`, sub: "Cross-validation mean ± std across folds", tone: "text-[#4c1d95] bg-[#ede9fe]" },
    { icon: Database, label: "Dataset Size", value: `${m.datasetSize}`, unit: "rows", sub: `${m.trainSize} train · ${m.testSize} test · 80 / 20 split`, tone: "text-[#0a2540] bg-[#e2e8f3]" },
  ];

  const pipeline = [
    "Dataset generation — 600 synthetic rows with seeded PRNG (reproducible, documented)",
    "Cleaning & clamping — invalid/out-of-range values corrected to valid domains",
    "Feature matrix X — 8 numeric/boolean features (one-hot not required)",
    "Target vector y — final_marks (0–100)",
    "Reproducible train/test split (80 / 20, seed = 42)",
    "Model training — closed-form Ridge OLS via normal equations (Gaussian elimination, λ = 1e-4)",
    "Evaluation — MAE, MSE, RMSE, R² on the held-out test set",
    "5-fold cross-validation — pipeline re-fit per fold for unbiased R² estimate",
    "Model persisted as a deterministic singleton — retrained identically on every boot",
    "Inference — raw features are vectorised and scored in < 5 ms",
  ];

  return (
    <AppShell title="Model & Metrics" subtitle="Full transparency into the regression pipeline — no black boxes">
      <div className="space-y-6">
        {/* ===== Header strip ===== */}
        <div className="card flex flex-col gap-4 p-5 md:flex-row md:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0a2540]">
            <BrainCircuit size={26} className="text-[#7db4ff]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold tracking-tight text-[#0a2540]">{MODEL_NAME}</h2>
            <p className="text-[11.5px] text-[#5b6b82]">Version {MODEL_VERSION} · scikit-learn-equivalent workflow implemented natively · trained on synthetic data</p>
          </div>
          <a href="/api/dataset" className="btn btn-navy btn-sm shrink-0"><Download size={14} /> students.csv ({DATASET_SIZE} rows)</a>
        </div>

        {/* ===== Metric cards ===== */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {metricCards.map((c) => (
            <div key={c.label} className="card p-4 sm:p-5">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${c.tone}`}><c.icon size={18} /></div>
              <div className="text-xl font-black tabular-nums tracking-tight text-[#0a2540] sm:text-2xl">
                {c.value}{c.unit && <span className="ml-1 text-[10px] font-bold text-[#8ba0bd]">{c.unit}</span>}
              </div>
              <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#5b6b82]">{c.label}</div>
              <p className="mt-1 hidden text-[10px] leading-snug text-[#8ba0bd] sm:block">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-5">
          {/* ===== Coefficients ===== */}
          <div className="card xl:col-span-3 p-5">
            <div className="flex items-center gap-2">
              <Braces size={17} className="text-[#2563eb]" />
              <h2 className="text-sm font-extrabold text-[#0a2540]">Learned Coefficients & Feature Importance</h2>
            </div>
            <p className="mt-1 text-[11px] text-[#8ba0bd]">Sorted by |impact|. Positive = raises predicted marks; negative = lowers them. Importance is normalised to the largest |coefficient|.</p>
            <div className="mt-4 divide-y divide-[#eef0f8]">
              {model.coefficients.map((c) => (
                <div key={c.feature} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[12px] font-bold text-[#33415c]">{c.label}</span>
                      <span className={`text-[11px] font-extrabold tabular-nums ${c.coefficient >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {c.coefficient >= 0 ? "+" : ""}{c.coefficient}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eef0f8]">
                      <div className={`h-full rounded-full ${c.coefficient >= 0 ? "bg-[#10b981]" : "bg-[#f87171]"}`} style={{ width: `${(c.absImportance / maxImportance) * 100}%` }} />
                    </div>
                  </div>
                  <div className="w-10 text-right text-[10px] font-black tabular-nums text-[#8ba0bd]">{c.absImportance}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#f8faff] p-3 text-[10.5px] leading-relaxed text-[#5b6b82]">
              <strong className="text-[#0a2540]">Reading coefficients:</strong> holding all other features constant,
              one additional study hour per day adds ~{model.weights[4].toFixed(2)} marks; each attendance
              percentage point adds ~{model.weights[3].toFixed(2)} marks. The intercept is {model.weights[0].toFixed(2)}.
            </div>
          </div>

          {/* ===== Pipeline + target stats ===== */}
          <div className="space-y-6 xl:col-span-2">
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <ListOrdered size={17} className="text-[#2563eb]" />
                <h2 className="text-sm font-extrabold text-[#0a2540]">Training Pipeline (as implemented)</h2>
              </div>
              <ol className="mt-3 space-y-2">
                {pipeline.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[11px] leading-snug text-[#44536e]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#eff4ff] text-[9px] font-black text-[#1d4ed8]">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-extrabold text-[#0a2540]">Target Variable — final_marks</h2>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[["Mean", model.targetMean], ["Std Dev", model.targetStd], ["Min", model.targetMin], ["Max", model.targetMax]].map(([l, v]) => (
                  <div key={l as string} className="rounded-xl border border-[#e2e8f3] bg-[#fbfcfe] p-3">
                    <div className="text-lg font-black tabular-nums text-[#0a2540]">{v}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#8ba0bd]">{l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5 text-[11px] text-[#44536e]">
                <p className="flex items-start gap-1.5"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" /> No data leakage — the split shuffles before any statistics are computed; CV re-fits the full pipeline per fold.</p>
                <p className="flex items-start gap-1.5"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" /> Ridge λ = 1e-4 prevents singular matrices on correlated features (e.g. previous marks ↔ assignment score).</p>
                <p className="flex items-start gap-1.5"><AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" /> Synthetic labels were generated with known weights + noise — real-world R² will always be lower. This is teaching material, not an oracle.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
