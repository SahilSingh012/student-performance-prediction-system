import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import { getModel, DATASET_SIZE } from "@/lib/ml";
import { BookOpenText, Terminal, FileDown } from "lucide-react";

export const metadata: Metadata = { title: "Documentation" };

export default function DocsPage() {
  const m = getModel().metrics;

  return (
    <AppShell title="Project Documentation" subtitle="Complete write-up — abstract to references, plus local setup instructions">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="card flex flex-wrap items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0a2540]"><BookOpenText size={22} className="text-[#7db4ff]" /></div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-[#0a2540]">Student Performance Prediction System Using Machine Learning</h2>
            <p className="text-[11px] text-[#5b6b82]">College Data-Science Project · Next.js 16 + PostgreSQL + TypeScript ML pipeline (original spec: Python · Flask · SQLite — adapted to this platform’s stack)</p>
          </div>
          <a href="/api/dataset" className="btn btn-outline btn-sm"><FileDown size={14} /> Dataset CSV</a>
        </div>

        <article className="doc card p-6 sm:p-8">
          <h2>Project Abstract</h2>
          <p>
            This project implements a <strong>Student Performance Prediction System</strong> — an end-to-end machine-learning
            application that forecasts a student’s final examination marks from eight observable factors:
            <strong> attendance, daily study hours, previous exam marks, assignment scores, sleep hours, age, internet access and extracurricular participation</strong>.
            A regularised multiple linear regression model is trained on a 600-record synthetic dataset, evaluated with
            MAE / MSE / RMSE / R² on a held-out test set, and served through a web dashboard with interactive charts,
            student records management, prediction history and downloadable PDF reports.
            <strong> All data is synthetic</strong>; the system is an educational demonstration, not an assessment instrument.
          </p>

          <h2>1 · Introduction</h2>
          <p>
            Educational institutions collect rich behavioural and academic data but rarely convert it into early,
            actionable insight. Early identification of at-risk students enables timely mentoring, personalised
            study plans and better learning outcomes. This project demonstrates how classical supervised machine
            learning — specifically regularised linear regression — can surface meaningful, explainable predictions
            without opaque black-box models.
          </p>

          <h2>2 · Problem Statement</h2>
          <p>
            Given a student’s academic and lifestyle profile collected before the final examination, predict the
            expected final marks (0–100) and classify the performance band, so that educators can intervene early
            with supportive, personalised recommendations.
          </p>

          <h2>3 · Objectives</h2>
          <ul>
            <li>Build a clean, leakage-free ML pipeline: load → clean → split → train → evaluate.</li>
            <li>Report honest evaluation metrics (MAE, MSE, RMSE, R², cross-validation).</li>
            <li>Deliver an interactive web app: registration, prediction, dashboard, history, PDF reports.</li>
            <li>Keep every claim transparent — coefficients, data provenance and disclaimers are visible in-app.</li>
            <li>Remain beginner-friendly: modular code, documented decisions, reproducible seeds.</li>
          </ul>

          <h2>4 · Existing System</h2>
          <p>
            Traditional systems rely on manual spreadsheets and end-of-term grading — reactive rather than predictive.
            Typical limitations: no early-warning signal, no quantified uncertainty, poor visualisation, and
            predictions detached from actionable guidance. Commercial tools are often closed, expensive, and trained
            on opaque data.
          </p>

          <h2>5 · Proposed System</h2>
          <p>
            A self-contained web application where a user registers a student (or selects an existing record),
            the trained regression model scores the profile in milliseconds, and the app returns:
            <strong> predicted marks, an uncertainty band (±MAE), a performance category, top contributing factors,
            natural-language insights and personalised study recommendations</strong> — all persisted to a database with
            full history and one-click PDF export.
          </p>

          <h2>6 · Methodology</h2>
          <ol>
            <li><strong>Dataset synthesis</strong> — 600 rows generated with a seeded PRNG (Box–Muller gaussian noise) with known ground-truth weights; clearly labelled synthetic.</li>
            <li><strong>Cleaning</strong> — features clamped to valid domains (e.g. attendance ∈ [0,100]); booleans encoded 0/1.</li>
            <li><strong>Split</strong> — reproducible shuffle, 80/20 train/test (seed 42).</li>
            <li><strong>Training</strong> — closed-form Ridge OLS (normal equations + Gaussian elimination, λ = 1e-4, intercept unpenalised).</li>
            <li><strong>Evaluation</strong> — MAE, MSE, RMSE, R² on held-out test data + 5-fold CV.</li>
            <li><strong>Inference</strong> — deterministic re-training at boot; predictions &lt; 5 ms; both stored in PostgreSQL.</li>
          </ol>

          <h2>7 · System Architecture</h2>
          <pre className="overflow-x-auto rounded-xl border border-[#e2e8f3] bg-[#0a2540] p-4 text-[10.5px] leading-relaxed text-[#a9e5c5]">
{`┌───────────────────────── CLIENT (Browser) ─────────────────────────┐
│  Home · Predict Studio · Dashboard · Records · History · Docs      │
│  Chart.js visualisations · jsPDF report generation                 │
└───────────────┬───────────────────────────────────▲────────────────┘
                │ REST/JSON                          │ PDF (client-side)
┌───────────────▼───────────────────────────────────┴────────────────┐
│                 SERVER (Next.js App Router)                        │
│  /api/predict   validateFeatures() → predictForFeatures()          │
│  /api/students  CRUD + CSV export      /api/dashboard  aggregates  │
│  /api/predictions  history (+ DELETE)  /api/dataset  training CSV  │
│  /api/admin/reset  reseed demo data    /api/health   healthcheck   │
│                                                                    │
│  src/lib/ml.ts   seeded dataset · Ridge OLS · MAE/RMSE/R² · CV     │
│  src/lib/seed.ts first-run synthetic demo records (real model)     │
└───────────────┬────────────────────────────────────────────────────┘
                │ Drizzle ORM (parameterised SQL)
┌───────────────▼────────────────────┐
│  PostgreSQL                        │
│  students · predictions (CASCADE)  │
└────────────────────────────────────┘`}
          </pre>
          <p>The original brief specified Python · Flask · SQLite. This implementation honours the same architecture with the platform’s required stack — Next.js (API routes in place of Flask), PostgreSQL via Drizzle ORM (in place of SQLite), and a native TypeScript ML pipeline (in place of scikit-learn) with identical mathematical semantics.</p>

          <h2>8 · Algorithm — Ridge Multiple Linear Regression</h2>
          <p>
            Linear regression models the target as a linear combination of features: <code>y = β₀ + Σ βᵢxᵢ + ε</code>.
            Ordinary least squares minimises the residual sum of squares; Ridge adds an L2 penalty
            <code>λΣβᵢ²</code> that stabilises coefficient estimates when features are correlated.
            Solved in closed form via the normal equations <code>(XᵀX + λI)β = Xᵀy</code> using Gaussian elimination with partial pivoting.
          </p>
          <p>
            <strong>Why not Random Forest?</strong> With 8 well-conditioned numeric features and a near-linear
            data-generating process, a regularised linear model is the better bias/variance trade-off — it is
            fully interpretable (coefficients are human-readable), trains in microseconds, and generalises as well
            as an ensemble here. The pipeline is modular: a tree ensemble can be swapped in behind <code>getModel()</code> without touching the UI.
          </p>

          <h2>9 · Dataset Description (Synthetic)</h2>
          <ul>
            <li><strong>Rows</strong>: {DATASET_SIZE} synthetic students (<code>STD-1001…</code>). Columns: student_id, age, attendance, study_hours, previous_marks, assignment_score, sleep_hours, internet_access, extracurricular, final_marks.</li>
            <li><strong>Generation</strong>: features drawn from gaussian distributions (Box–Muller), clamped to realistic domains; target = weighted sum (attendance 0.205/pt, previous 0.285/pt, assignment 0.235/pt, study 1.58/h, sleep deviation ±1.32/h, internet +2.6, extracurricular +1.4) + gaussian noise (σ = 3.1), clamped [6, 100].</li>
            <li><strong>Ethics</strong>: no real students, no PII. Clearly labelled synthetic in UI, PDF footer, and docs.</li>
            <li><strong>Download</strong>: the exact training CSV is available at <code>/api/dataset</code> and from the Model page.</li>
          </ul>

          <h2>10 · Results &amp; Evaluation (live from the running model)</h2>
          <div className="my-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["MAE", `${m.mae.toFixed(2)} marks`], ["RMSE", `${m.rmse.toFixed(2)} marks`], ["Test R²", m.r2.toFixed(4)], ["CV R² (5-fold)", `${m.cvR2Mean.toFixed(4)} ± ${m.cvR2Std.toFixed(4)}`]].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-[#dbeafe] bg-[#eff4ff] p-3 text-center">
                <div className="text-lg font-black tabular-nums text-[#1d4ed8]">{v}</div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#5b6b82]">{l}</div>
              </div>
            ))}
          </div>
          <p>
            Interpretation: on unseen test data the model explains ~<strong>{(m.r2 * 100).toFixed(1)}%</strong> of variance in final marks with a typical
            error of <strong>{m.mae.toFixed(2)} marks</strong>. Train ({m.r2Train.toFixed(4)}) vs test R² are close, indicating negligible overfitting;
            5-fold CV ({m.cvR2Mean.toFixed(4)} ± {m.cvR2Std.toFixed(4)}) confirms stability. Because labels were synthesised from a near-linear
            process, real-world performance would be lower — a key lesson in dataset realism.
          </p>

          <h2>11 · Advantages</h2>
          <ul>
            <li>End-to-end and self-contained: trains, evaluates, serves, visualises and exports.</li>
            <li>Fully interpretable — every prediction ships with signed factor contributions.</li>
            <li>No external ML dependencies; deterministic and auditable.</li>
            <li>Production-grade hygiene: validation, parameterised queries, cascade deletes, health checks.</li>
          </ul>

          <h2>12 · Limitations</h2>
          <ul>
            <li>Synthetic training data — coefficients reflect the generator, not reality; no causal claims.</li>
            <li>Linear model cannot capture non-linear interactions (e.g. attendance × study-hours synergy).</li>
            <li>Does not account for socio-economic context, teacher quality or mental health.</li>
            <li>Predictions must never be used for grading, sanctions or triage without human oversight.</li>
          </ul>

          <h2>13 · Future Scope</h2>
          <ul>
            <li>Train on real, consented institutional datasets with privacy-preserving aggregation.</li>
            <li>Benchmark RandomForest / XGBoost / gradient boosting behind the same pipeline interface.</li>
            <li>Per-student longitudinal tracking with trend charts and early-warning alerts.</li>
            <li>Explainability via SHAP values; intervention A/B testing; guardian-facing reports.</li>
            <li>Authentication (RBAC) for students, teachers and admins; audit logs.</li>
          </ul>

          <h2>14 · Conclusion</h2>
          <p>
            This project demonstrates the complete lifecycle of an applied ML product — from reproducible data synthesis
            and leakage-free evaluation to a polished, honest user experience. It is intentionally pedagogy-first:
            every number on screen is real, computed by the running model, and documented with its caveats.
          </p>

          <h2>15 · Running Locally (VS Code)</h2>
          <div className="rounded-xl border border-[#e2e8f3] bg-[#0a2540] p-4 font-mono text-[11px] leading-relaxed text-[#a9e5c5]">
            <div className="flex items-center gap-2 text-[#7db4ff]"><Terminal size={13} /> WINDOWS POWERSHELL</div>
            <pre className="mt-2 whitespace-pre-wrap">{`git clone <repo> student-performance-prediction
cd student-performance-prediction
npm install                # install dependencies
# .env must define DATABASE_URL=postgresql://user:pass@host:5432/db
npx drizzle-kit push       # create tables (students, predictions)
npm run dev                # develop at http://localhost:3000
npm run build && npm start # production build & serve
npm run lint               # static checks`}</pre>
          </div>
          <p className="mt-2">No manual model file is needed — the model re-trains deterministically at server boot (equivalent to the spec’s <code>train_model.py → student_model.pkl → app.py</code> flow, minus stale-artefact risk). Project tree:</p>
          <pre className="overflow-x-auto rounded-xl border border-[#e2e8f3] bg-[#f8faff] p-4 text-[10.5px] leading-relaxed text-[#33415c]">
{`student-performance-prediction/
├─ src/app/(home)/page.tsx        Landing page
├─ src/app/dashboard|predict|students|history|model|docs|about
├─ src/app/api/                   REST endpoints (predict, students, …)
├─ src/components/                AppShell, PredictStudio, DashboardClient…
├─ src/lib/ml.ts                  Dataset · Ridge OLS · metrics · CV · insights
├─ src/lib/seed.ts                First-run demo data (model-scored)
├─ src/db/schema.ts               students · predictions (Drizzle ORM)
└─ public/images/hero.jpg`}
          </pre>

          <h2>16 · References</h2>
          <ul>
            <li>Scikit-learn developers — Linear Models: Ordinary Least Squares &amp; Ridge Regression. scikit-learn.org</li>
            <li>James, Witten, Hastie &amp; Tibshirani — <em>An Introduction to Statistical Learning (ISLR)</em>, §3 &amp; §6.</li>
            <li>Kaggle — “Students Performance in Exams” &amp; UCI Student Performance datasets (inspiration for feature set).</li>
            <li>Box, G.E.P. &amp; Muller, M.E. (1958). A note on the generation of random normal deviates. Annals of Mathematical Statistics.</li>
            <li>Drizzle ORM documentation — orm.drizzle.team · Chart.js — chartjs.org · jsPDF — github.com/parallax/jsPDF</li>
          </ul>
        </article>
      </div>
    </AppShell>
  );
}
