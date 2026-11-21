import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, predictions } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { NEEDS_SUPPORT_THRESHOLD } from "@/lib/ml";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CATEGORIES = ["Outstanding", "Excellent", "Good", "Needs Improvement", "At Risk"] as const;

export async function GET() {
  try {
    await ensureSeed();

    const allStudents = await db.select().from(students);
    const allPredictions = await db.select().from(predictions).orderBy(desc(predictions.createdAt));

    const latest = new Map<number, { marks: number; category: string }>();
    for (const p of allPredictions) {
      if (!latest.has(p.studentId)) latest.set(p.studentId, { marks: p.predictedMarks, category: p.category });
    }

    const studentLatest = allStudents.map((s) => ({
      id: s.id,
      name: s.name,
      attendance: s.attendance,
      studyHours: s.studyHours,
      sleepHours: s.sleepHours,
      previousMarks: s.previousMarks,
      predicted: latest.get(s.id)?.marks ?? null as number | null,
      category: latest.get(s.id)?.category ?? null as string | null,
    }));

    const withPrediction = studentLatest.filter((s) => s.predicted !== null);
    const marks = withPrediction.map((s) => s.predicted as number);

    const totalStudents = allStudents.length;
    const avgPredicted = marks.length ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10 : 0;
    const highestPredicted = marks.length ? Math.max(...marks) : 0;
    const needingSupport = withPrediction.filter((s) => (s.predicted as number) < NEEDS_SUPPORT_THRESHOLD).length;
    const avgAttendance = allStudents.length
      ? Math.round((allStudents.reduce((a, s) => a + s.attendance, 0) / allStudents.length) * 10) / 10
      : 0;
    const avgStudyHours = allStudents.length
      ? Math.round((allStudents.reduce((a, s) => a + s.studyHours, 0) / allStudents.length) * 10) / 10
      : 0;

    const distribution = CATEGORIES.map((c) => ({
      category: c,
      count: withPrediction.filter((s) => s.category === c).length,
    }));

    const topStudents = [...withPrediction]
      .sort((a, b) => (b.predicted as number) - (a.predicted as number))
      .slice(0, 8)
      .map((s) => ({ name: s.name, predicted: s.predicted as number, category: s.category as string }));

    const attendanceVsMarks = withPrediction.map((s) => ({ x: s.attendance, y: s.predicted as number, name: s.name }));
    const studyVsMarks = withPrediction.map((s) => ({ x: s.studyHours, y: s.predicted as number, name: s.name }));

    const nameById = new Map(allStudents.map((s) => [s.id, s.name]));
    const recentPredictions = allPredictions.slice(0, 6).map((p) => ({
      id: p.id,
      studentName: nameById.get(p.studentId) ?? "Unknown",
      predictedMarks: p.predictedMarks,
      category: p.category,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      kpis: {
        totalStudents,
        avgPredicted,
        highestPredicted,
        needingSupport,
        avgAttendance,
        avgStudyHours,
        totalPredictions: allPredictions.length,
      },
      distribution,
      topStudents,
      attendanceVsMarks,
      studyVsMarks,
      recentPredictions,
      supportThreshold: NEEDS_SUPPORT_THRESHOLD,
    });
  } catch (err) {
    console.error("GET /api/dashboard failed", err);
    return NextResponse.json({ ok: false, error: "Failed to load dashboard." }, { status: 500 });
  }
}
