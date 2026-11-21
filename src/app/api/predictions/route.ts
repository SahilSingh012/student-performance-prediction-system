import { NextResponse } from "next/server";
import { db } from "@/db";
import { predictions, students } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await ensureSeed();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") ?? 100) || 100));

    const rows = await db
      .select({
        id: predictions.id,
        studentId: predictions.studentId,
        studentName: students.name,
        predictedMarks: predictions.predictedMarks,
        category: predictions.category,
        modelVersion: predictions.modelVersion,
        createdAt: predictions.createdAt,
        age: students.age,
        previousMarks: students.previousMarks,
        assignmentScore: students.assignmentScore,
        attendance: students.attendance,
        studyHours: students.studyHours,
        sleepHours: students.sleepHours,
        internetAccess: students.internetAccess,
        extracurricular: students.extracurricular,
      })
      .from(predictions)
      .innerJoin(students, eq(predictions.studentId, students.id))
      .orderBy(desc(predictions.createdAt))
      .limit(limit);

    return NextResponse.json({ ok: true, rows });
  } catch (err) {
    console.error("GET /api/predictions failed", err);
    return NextResponse.json({ ok: false, error: "Failed to load prediction history." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.delete(predictions);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/predictions failed", err);
    return NextResponse.json({ ok: false, error: "Failed to clear history." }, { status: 500 });
  }
}
