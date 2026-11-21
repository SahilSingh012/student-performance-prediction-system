import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, predictions } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface StudentRow {
  id: number;
  name: string;
  age: number;
  attendance: number;
  study_hours: number;
  previous_marks: number;
  assignment_score: number;
  sleep_hours: number;
  internet_access: boolean;
  extracurricular: boolean;
  created_at: string;
  latest_prediction: number | null;
  latest_category: string | null;
  prediction_count: number;
}

async function loadAll(): Promise<StudentRow[]> {
  await ensureSeed();
  const allStudents = await db.select().from(students).orderBy(desc(students.createdAt));
  const allPredictions = await db.select().from(predictions).orderBy(desc(predictions.createdAt));

  const latest = new Map<number, { marks: number; category: string }>();
  const counts = new Map<number, number>();
  for (const p of allPredictions) {
    if (!latest.has(p.studentId)) latest.set(p.studentId, { marks: p.predictedMarks, category: p.category });
    counts.set(p.studentId, (counts.get(p.studentId) ?? 0) + 1);
  }

  return allStudents.map((s) => ({
    id: s.id,
    name: s.name,
    age: s.age,
    attendance: s.attendance,
    study_hours: s.studyHours,
    previous_marks: s.previousMarks,
    assignment_score: s.assignmentScore,
    sleep_hours: s.sleepHours,
    internet_access: s.internetAccess,
    extracurricular: s.extracurricular,
    created_at: s.createdAt.toISOString(),
    latest_prediction: latest.get(s.id)?.marks ?? null,
    latest_category: latest.get(s.id)?.category ?? null,
    prediction_count: counts.get(s.id) ?? 0,
  }));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const category = searchParams.get("category") ?? "";
    const sort = searchParams.get("sort") ?? "recent";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10) || 10));

    let rows = await loadAll();

    if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q));
    if (category) rows = rows.filter((r) => r.latest_category === category);

    switch (sort) {
      case "marks_desc":
        rows.sort((a, b) => (b.latest_prediction ?? -1) - (a.latest_prediction ?? -1));
        break;
      case "marks_asc":
        rows.sort((a, b) => (a.latest_prediction ?? 101) - (b.latest_prediction ?? 101));
        break;
      case "name":
        rows.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "attendance":
        rows.sort((a, b) => b.attendance - a.attendance);
        break;
      default:
        rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const paged = rows.slice(start, start + pageSize);

    return NextResponse.json({ ok: true, rows: paged, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (err) {
    console.error("GET /api/students failed", err);
    return NextResponse.json({ ok: false, error: "Failed to load students." }, { status: 500 });
  }
}
