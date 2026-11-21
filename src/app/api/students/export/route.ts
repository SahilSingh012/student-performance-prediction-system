import { db } from "@/db";
import { students, predictions } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const csvEscape = (v: string | number | boolean | null | undefined) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  await ensureSeed();
  const allStudents = await db.select().from(students).orderBy(desc(students.createdAt));
  const allPredictions = await db.select().from(predictions).orderBy(desc(predictions.createdAt));
  const latest = new Map<number, { marks: number; category: string }>();
  for (const p of allPredictions) if (!latest.has(p.studentId)) latest.set(p.studentId, { marks: p.predictedMarks, category: p.category });

  const header = [
    "student_id", "name", "age", "attendance", "study_hours", "previous_marks", "assignment_score",
    "sleep_hours", "internet_access", "extracurricular", "latest_prediction", "latest_category", "registered_on",
  ].join(",");

  const lines = allStudents.map((s) =>
    [
      s.id,
      csvEscape(s.name),
      s.age,
      s.attendance,
      s.studyHours,
      s.previousMarks,
      s.assignmentScore,
      s.sleepHours,
      s.internetAccess ? 1 : 0,
      s.extracurricular ? 1 : 0,
      latest.get(s.id)?.marks ?? "",
      latest.get(s.id)?.category ?? "",
      s.createdAt.toISOString().slice(0, 10),
    ].join(",")
  );

  const body = [header, ...lines].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registered_students.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
