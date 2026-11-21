/**
 * ============================================================
 * Student Performance Prediction — Machine Learning Pipeline
 * ============================================================
 * A complete, dependency-free ML pipeline implemented in TypeScript,
 * mirroring the scikit-learn workflow requested in the spec:
 *
 *   1.  Load dataset (synthetic, generated deterministically)
 *   2.  Clean / clamp invalid values
 *   3.  Feature engineering (X matrix) & target (y = final_marks)
 *   4.  Train / test split (80 / 20, fixed seed → reproducible)
 *   5.  Train Ridge-regularised Multiple Linear Regression (OLS)
 *   6.  Evaluate: MAE, MSE, RMSE, R²  (+ 5-fold cross-validation)
 *   7.  Persist "model" as a deterministic, module-level singleton
 *       (retrained identically on every boot — no stale .pkl needed)
 *   8.  Predict final_marks for new student input
 *
 * DATA IS 100% SYNTHETIC — generated for educational demonstration.
 * It is NOT real student data and must not be used for real grading.
 * ============================================================
 */

// ---------- Deterministic PRNG (mulberry32) ----------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number, mean: number, std: number) {
  // Box–Muller transform
  let u = 0;
  while (u === 0) u = rng();
  const v = rng();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

// ---------- Types ----------
export interface StudentFeatures {
  age: number;
  attendance: number; // %
  study_hours: number; // hours per day
  previous_marks: number; // 0-100
  assignment_score: number; // 0-100
  sleep_hours: number; // hours per night
  internet_access: boolean;
  extracurricular: boolean;
}

export interface DatasetRow extends StudentFeatures {
  student_id: string;
  final_marks: number;
}

export interface ModelMetrics {
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
  r2Train: number;
  cvR2Mean: number;
  cvR2Std: number;
  trainSize: number;
  testSize: number;
  datasetSize: number;
}

export interface Coefficient {
  feature: string;
  label: string;
  coefficient: number;
  absImportance: number; // 0-100 normalised |coef| for display
}

export interface TrainedModel {
  weights: number[]; // includes intercept at index 0
  metrics: ModelMetrics;
  coefficients: Coefficient[];
  featureMeans: number[];
  targetMean: number;
  targetStd: number;
  targetMin: number;
  targetMax: number;
  datasetSize: number;
}

export const FEATURE_LABELS: Record<string, string> = {
  previous_marks: "Previous Exam Marks",
  assignment_score: "Assignment Score",
  attendance: "Attendance %",
  study_hours: "Study Hours / Day",
  sleep_hours: "Sleep Hours / Night",
  internet_access: "Internet Access",
  extracurricular: "Extracurricular Activities",
  age: "Age",
};

export const FEATURE_ORDER = [
  "previous_marks",
  "assignment_score",
  "attendance",
  "study_hours",
  "sleep_hours",
  "internet_access",
  "extracurricular",
  "age",
] as const;

export const MODEL_VERSION = "v1.0.0";
export const DATASET_SIZE = 600;
export const MODEL_NAME = "Ridge Multiple Linear Regression (OLS, λ = 1e-4)";

// ---------- 1–2. Dataset generation & cleaning ----------
export function generateDataset(size: number = DATASET_SIZE, seed = 20240817): DatasetRow[] {
  const rng = mulberry32(seed);
  const rows: DatasetRow[] = [];
  for (let i = 0; i < size; i++) {
    const age = clamp(Math.round(gaussian(rng, 17.8, 1.6)), 14, 23);
    const attendance = clamp(Math.round(gaussian(rng, 76, 14)), 25, 100);
    const study_hours = round1(clamp(gaussian(rng, 4.4, 2.05), 0.5, 12));
    const previous_marks = round1(clamp(gaussian(rng, 66, 14.5), 18, 100));
    const assignment_score = round1(clamp(gaussian(rng, 68, 13.5), 15, 100));
    const sleep_hours = round1(clamp(gaussian(rng, 7.1, 1.15), 4, 10.5));
    const internet_access = rng() < 0.78;
    const extracurricular = rng() < 0.55;

    // Ground-truth data-generating process (+ irreducible noise)
    let final_marks =
      11.5 +
      0.285 * previous_marks +
      0.235 * assignment_score +
      0.205 * attendance +
      1.58 * study_hours +
      1.32 * (sleep_hours - 7) +
      (internet_access ? 2.6 : 0) +
      (extracurricular ? 1.4 : 0) -
      0.15 * (age - 17) +
      gaussian(rng, 0, 3.1);

    final_marks = round1(clamp(final_marks, 6, 100));

    rows.push({
      student_id: `STD-${1001 + i}`,
      age,
      attendance,
      study_hours,
      previous_marks,
      assignment_score,
      sleep_hours,
      internet_access,
      extracurricular,
      final_marks,
    });
  }
  return rows;
}

const featureVector = (f: StudentFeatures): number[] => [
  f.previous_marks,
  f.assignment_score,
  f.attendance,
  f.study_hours,
  f.sleep_hours,
  f.internet_access ? 1 : 0,
  f.extracurricular ? 1 : 0,
  f.age,
];

// ---------- 4. Train / test split (reproducible shuffle) ----------
export function trainTestSplit<T>(data: T[], testRatio = 0.2, seed = 42): { train: T[]; test: T[] } {
  const idx = data.map((_, i) => i);
  const rng = mulberry32(seed);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const testCount = Math.round(data.length * testRatio);
  const testIdx = new Set(idx.slice(0, testCount));
  const train: T[] = [];
  const test: T[] = [];
  data.forEach((row, i) => (testIdx.has(i) ? test.push(row) : train.push(row)));
  return { train, test };
}

// ---------- 5. Ridge OLS via normal equations + Gaussian elimination ----------
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) < 1e-12) M[pivot][col] = 1e-12;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }
  // After full elimination the matrix is diagonal — solve by dividing by the pivot.
  return M.map((row, i) => row[n] / (Math.abs(row[i]) < 1e-12 ? 1e-12 : row[i]));
}

function fitRidge(X: number[][], y: number[], lambda = 1e-4): number[] {
  const n = X.length;
  const p = X[0].length + 1; // + intercept
  const XtX: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  const Xty: number[] = new Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    const row = [1, ...X[i]];
    for (let a = 0; a < p; a++) {
      Xty[a] += row[a] * y[i];
      for (let b = a; b < p; b++) XtX[a][b] += row[a] * row[b];
    }
  }
  for (let a = 0; a < p; a++) {
    for (let b = 0; b < a; b++) XtX[a][b] = XtX[b][a];
    // Ridge penalty (intercept left unpenalised)
    if (a > 0) XtX[a][a] += lambda * n;
  }
  return solveLinearSystem(XtX, Xty);
}

const predictRow = (weights: number[], f: number[]): number =>
  weights[0] + f.reduce((acc, v, i) => acc + weights[i + 1] * v, 0);

function evaluate(weights: number[], X: number[][], y: number[]) {
  const preds = X.map((row) => predictRow(weights, row));
  let absErr = 0;
  let sqErr = 0;
  const meanY = y.reduce((a, b) => a + b, 0) / y.length;
  let ssTot = 0;
  for (let i = 0; i < y.length; i++) {
    const err = y[i] - preds[i];
    absErr += Math.abs(err);
    sqErr += err * err;
    ssTot += (y[i] - meanY) ** 2;
  }
  const mae = absErr / y.length;
  const mse = sqErr / y.length;
  const r2 = ssTot === 0 ? 0 : 1 - sqErr / ssTot;
  return { mae, mse, rmse: Math.sqrt(mse), r2: clamp(r2, -1, 1) };
}

// ---------- 6 + 7. Train & cache the production model singleton ----------
let cachedModel: TrainedModel | null = null;

export function getModel(): TrainedModel {
  if (cachedModel) return cachedModel;

  const dataset = generateDataset();
  const { train, test } = trainTestSplit(dataset, 0.2, 42);

  const XTrain = train.map(featureVector);
  const yTrain = train.map((r) => r.final_marks);
  const XTest = test.map(featureVector);
  const yTest = test.map((r) => r.final_marks);

  const weights = fitRidge(XTrain, yTrain, 1e-4);

  const testMetrics = evaluate(weights, XTest, yTest);
  const trainMetrics = evaluate(weights, XTrain, yTrain);

  // 5-fold cross-validation R² (full pipeline per fold, no leakage)
  const k = 5;
  const cvScores: number[] = [];
  const foldSize = Math.floor(dataset.length / k);
  for (let f = 0; f < k; f++) {
    const testFold = dataset.slice(f * foldSize, f === k - 1 ? dataset.length : (f + 1) * foldSize);
    const trainFold = dataset.filter((_, i) => i < f * foldSize || i >= (f + 1) * foldSize);
    const w = fitRidge(trainFold.map(featureVector), trainFold.map((r) => r.final_marks), 1e-4);
    cvScores.push(evaluate(w, testFold.map(featureVector), testFold.map((r) => r.final_marks)).r2);
  }
  const cvMean = cvScores.reduce((a, b) => a + b, 0) / cvScores.length;
  const cvStd = Math.sqrt(cvScores.reduce((a, b) => a + (b - cvMean) ** 2, 0) / cvScores.length);

  // Feature means (for contribution analysis)
  const p = FEATURE_ORDER.length;
  const featureMeans = new Array(p).fill(0);
  for (const row of dataset) {
    const v = featureVector(row);
    for (let i = 0; i < p; i++) featureMeans[i] += v[i];
  }
  featureMeans.forEach((_, i) => (featureMeans[i] /= dataset.length));

  const maxAbs = Math.max(...weights.slice(1).map(Math.abs), 1e-9);
  const coefficients: Coefficient[] = FEATURE_ORDER.map((key, i) => ({
    feature: key,
    label: FEATURE_LABELS[key],
    coefficient: round1(weights[i + 1] * 1000) / 1000,
    absImportance: Math.round((Math.abs(weights[i + 1]) / maxAbs) * 100),
  })).sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));

  const finals = dataset.map((r) => r.final_marks);
  const targetMean = finals.reduce((a, b) => a + b, 0) / finals.length;
  const targetStd = Math.sqrt(finals.reduce((a, b) => a + (b - targetMean) ** 2, 0) / finals.length);

  cachedModel = {
    weights,
    metrics: {
      mae: round1(testMetrics.mae * 100) / 100,
      mse: round1(testMetrics.mse * 100) / 100,
      rmse: round1(testMetrics.rmse * 100) / 100,
      r2: Math.round(testMetrics.r2 * 10000) / 10000,
      r2Train: Math.round(trainMetrics.r2 * 10000) / 10000,
      cvR2Mean: Math.round(cvMean * 10000) / 10000,
      cvR2Std: Math.round(cvStd * 10000) / 10000,
      trainSize: train.length,
      testSize: test.length,
      datasetSize: dataset.length,
    },
    coefficients,
    featureMeans,
    targetMean: round1(targetMean),
    targetStd: round1(targetStd),
    targetMin: Math.min(...finals),
    targetMax: Math.max(...finals),
    datasetSize: dataset.length,
  };
  return cachedModel;
}

// ---------- 8. Prediction ----------
export type PerformanceCategory =
  | "Outstanding"
  | "Excellent"
  | "Good"
  | "Needs Improvement"
  | "At Risk";

export function categorize(marks: number): PerformanceCategory {
  if (marks >= 85) return "Outstanding";
  if (marks >= 75) return "Excellent";
  if (marks >= 60) return "Good";
  if (marks >= 45) return "Needs Improvement";
  return "At Risk";
}

export const CATEGORY_META: Record<PerformanceCategory, { color: string; bg: string; bar: string; description: string }> = {
  Outstanding: { color: "#065f46", bg: "#d1fae5", bar: "#10b981", description: "Top-tier performance. Keep up the excellent habits and mentor peers." },
  Excellent: { color: "#1e40af", bg: "#dbeafe", bar: "#3b82f6", description: "Strong, consistent academic performance with solid fundamentals." },
  Good: { color: "#0f766e", bg: "#ccfbf1", bar: "#14b8a6", description: "Satisfactory performance. A few focused improvements can lift results significantly." },
  "Needs Improvement": { color: "#92400e", bg: "#fef3c7", bar: "#f59e0b", description: "Borderline performance. Structured support and study planning are recommended." },
  "At Risk": { color: "#991b1b", bg: "#fee2e2", bar: "#ef4444", description: "High risk of academic difficulty. Immediate, personalised intervention advised." },
};

export const NEEDS_SUPPORT_THRESHOLD = 60;

export interface PredictionResult {
  predicted: number;
  rangeLow: number;
  rangeHigh: number;
  category: PerformanceCategory;
  deltaVsPrevious: number;
  insights: string[];
  suggestions: string[];
  contributors: { label: string; impact: number }[];
}

export function predictForFeatures(f: StudentFeatures): PredictionResult {
  const model = getModel();
  const vec = featureVector(f);
  const raw = predictRow(model.weights, vec);
  const predicted = round1(clamp(raw, 0, 100));
  const mae = model.metrics.mae;
  const rangeLow = round1(clamp(predicted - mae, 0, 100));
  const rangeHigh = round1(clamp(predicted + mae, 0, 100));
  const category = categorize(predicted);
  const deltaVsPrevious = round1(predicted - f.previous_marks);

  // ---- Academic insights (rule-based, transparent) ----
  const insights: string[] = [];
  if (f.attendance >= 90) insights.push(`Excellent attendance (${f.attendance}%) — consistent presence is strongly correlated with higher marks.`);
  else if (f.attendance >= 75) insights.push(`Good attendance (${f.attendance}%), within a healthy range, but pushing past 90% typically yields further gains.`);
  else if (f.attendance >= 60) insights.push(`Attendance of ${f.attendance}% is below the recommended 75% threshold — missed classes compound into weaker exam preparation.`);
  else insights.push(`Critical attendance shortfall (${f.attendance}%). This is usually the single strongest early-warning signal for poor outcomes.`);

  if (f.study_hours >= 6) insights.push(`Studying ${f.study_hours}h/day is well above average — deliberate, spaced practice is working in this student's favour.`);
  else if (f.study_hours >= 3) insights.push(`${f.study_hours}h of daily study is a solid baseline; quality (active recall, past papers) matters more than raw hours.`);
  else insights.push(`Only ${f.study_hours}h/day of study time — likely insufficient for the syllabus load. Consistency beats last-minute cramming.`);

  if (f.sleep_hours < 6) insights.push(`Sleeping ${f.sleep_hours}h/night is below the 7–9h adolescent recommendation; memory consolidation suffers, offsetting study gains.`);
  else if (f.sleep_hours > 9) insights.push(`Sleeping ${f.sleep_hours}h/night exceeds typical needs — check for fatigue, low mood or disengagement.`);
  else insights.push(`Healthy ${f.sleep_hours}h of sleep supports memory retention and next-day concentration.`);

  if (f.previous_marks >= 80) insights.push(`Strong prior performance (${f.previous_marks}) indicates well-developed study habits and concept mastery.`);
  else if (f.previous_marks < 50) insights.push(`Previous marks of ${f.previous_marks} suggest foundational gaps — review core concepts before tackling advanced topics.`);

  if (!f.internet_access) insights.push("No reliable internet access limits access to e-learning resources, recorded lectures and online practice.");
  if (f.extracurricular) insights.push("Extracurricular involvement builds time-management and teamwork skills — generally a positive signal, in moderation.");

  insights.push(
    deltaVsPrevious >= 0
      ? `Projected ${deltaVsPrevious >= 0 ? "+" : ""}${deltaVsPrevious} marks vs. previous exam — trajectory is stable or improving.`
      : `Projected ${deltaVsPrevious} marks vs. previous exam — performance may dip without intervention.`
  );

  // ---- Personalised suggestions ----
  const suggestions: string[] = [];
  if (f.attendance < 85) suggestions.push("Attend every class this month; set a weekly attendance target of ≥90% and track it.");
  if (f.study_hours < 4) suggestions.push("Build a fixed daily study routine: 25-minute focused blocks (Pomodoro) with 5-minute breaks, 4–6 sessions/day.");
  if (f.assignment_score < 70) suggestions.push("Treat assignments as exam rehearsal — submit every assignment on time and review teacher feedback within 48h.");
  if (f.previous_marks < 60) suggestions.push("Schedule a weekly doubt-clearing session with a teacher or peer tutor for weak subjects.");
  if (f.sleep_hours < 7) suggestions.push("Protect a consistent sleep window (7–9h). Avoid screens 45 minutes before bed; revise in the morning.");
  if (!f.internet_access) suggestions.push("Make use of offline resources: library textbooks, downloaded lecture PDFs and library Wi-Fi.");
  if (f.attendance >= 85 && f.study_hours >= 4 && f.assignment_score >= 75) suggestions.push("Maintain momentum: attempt full-length timed mock papers every fortnight and analyse errors.");
  suggestions.push("Use active recall and spaced repetition (flashcards / practice tests) instead of passive re-reading.");
  suggestions.push("Set one SMART weekly goal per subject and review it every Sunday evening.");
  if (predicted < NEEDS_SUPPORT_THRESHOLD) suggestions.push("Meet with an academic mentor or counsellor to build a structured support plan before the next assessment.");

  // ---- Top feature contributors (signed deviation from mean) ----
  const contributors = FEATURE_ORDER.map((key, i) => {
    const deviation = vec[i] - model.featureMeans[i];
    return { label: FEATURE_LABELS[key], impact: round1(model.weights[i + 1] * deviation) };
  })
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 4);

  return { predicted, rangeLow, rangeHigh, category, deltaVsPrevious, insights: insights.slice(0, 6), suggestions: suggestions.slice(0, 6), contributors };
}

// ---------- CSV export of the synthetic training dataset ----------
export function datasetToCsv(): string {
  const rows = generateDataset();
  const header =
    "student_id,age,attendance,study_hours,previous_marks,assignment_score,sleep_hours,internet_access,extracurricular,final_marks";
  const lines = rows.map((r) =>
    [
      r.student_id,
      r.age,
      r.attendance,
      r.study_hours,
      r.previous_marks,
      r.assignment_score,
      r.sleep_hours,
      r.internet_access ? 1 : 0,
      r.extracurricular ? 1 : 0,
      r.final_marks,
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

// ---------- Server-side input validation ----------
export interface ValidationResult {
  ok: boolean;
  errors: string[];
  features?: StudentFeatures;
}

export function validateFeatures(input: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const num = (key: string, label: string, min: number, max: number, integer = false): number => {
    const v = Number(input[key]);
    if (input[key] === undefined || input[key] === null || input[key] === "" || Number.isNaN(v)) {
      errors.push(`${label} is required and must be a number.`);
      return 0;
    }
    if (!Number.isFinite(v)) {
      errors.push(`${label} must be a finite number.`);
      return 0;
    }
    if (v < min || v > max) errors.push(`${label} must be between ${min} and ${max}.`);
    return integer ? Math.round(v) : v;
  };
  const bool = (key: string): boolean => input[key] === true || input[key] === "true" || input[key] === 1 || input[key] === "1" || input[key] === "on" || input[key] === "yes";

  const features: StudentFeatures = {
    age: num("age", "Age", 10, 30, true),
    attendance: num("attendance", "Attendance", 0, 100),
    study_hours: num("study_hours", "Study hours per day", 0, 16),
    previous_marks: num("previous_marks", "Previous exam marks", 0, 100),
    assignment_score: num("assignment_score", "Assignment score", 0, 100),
    sleep_hours: num("sleep_hours", "Sleep hours", 0, 14),
    internet_access: bool("internet_access"),
    extracurricular: bool("extracurricular"),
  };
  if (errors.length) return { ok: false, errors };
  return { ok: true, errors: [], features };
}
