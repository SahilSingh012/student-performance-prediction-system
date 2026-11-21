import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, predictions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateFeatures, predictForFeatures, MODEL_VERSION } from "@/lib/ml";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    const validation = validateFeatures(body ?? {});
    if (!validation.ok || !validation.features) {
      return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
    }
    const f = validation.features;

    let studentId: number;
    let studentName: string;

    const rawId = body.student_id ?? body.studentId;
    if (rawId !== undefined && rawId !== null && rawId !== "") {
      // Existing student — reuse the registered record, verify existence.
      const id = Number(rawId);
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ ok: false, errors: ["Invalid student_id."] }, { status: 400 });
      }
      const [existing] = await db.select().from(students).where(eq(students.id, id)).limit(1);
      if (!existing) {
        return NextResponse.json({ ok: false, errors: ["Student not found."] }, { status: 404 });
      }
      studentId = existing.id;
      studentName = existing.name;
      // Persist any edits the user made to the measured features
      await db
        .update(students)
        .set({
          age: f.age,
          attendance: f.attendance,
          studyHours: f.study_hours,
          previousMarks: f.previous_marks,
          assignmentScore: f.assignment_score,
          sleepHours: f.sleep_hours,
          internetAccess: f.internet_access,
          extracurricular: f.extracurricular,
        })
        .where(eq(students.id, id));
    } else {
      // New student — name required (server-side validated)
      const name = String(body.name ?? "").trim();
      if (name.length < 2 || name.length > 80) {
        return NextResponse.json({ ok: false, errors: ["Student name is required (2–80 characters)."] }, { status: 400 });
      }
      if (!/^[\p{L} .'-]+$/u.test(name)) {
        return NextResponse.json({ ok: false, errors: ["Student name contains invalid characters."] }, { status: 400 });
      }
      const [created] = await db
        .insert(students)
        .values({
          name,
          age: f.age,
          attendance: f.attendance,
          studyHours: f.study_hours,
          previousMarks: f.previous_marks,
          assignmentScore: f.assignment_score,
          sleepHours: f.sleep_hours,
          internetAccess: f.internet_access,
          extracurricular: f.extracurricular,
        })
        .returning({ id: students.id, name: students.name });
      studentId = created.id;
      studentName = created.name;
    }

    // ---- Run the real model — never a hardcoded value ----
    const result = predictForFeatures(f);

    const [stored] = await db
      .insert(predictions)
      .values({
        studentId,
        predictedMarks: result.predicted,
        category: result.category,
        modelVersion: MODEL_VERSION,
      })
      .returning({ id: predictions.id, createdAt: predictions.createdAt });

    return NextResponse.json({
      ok: true,
      predictionId: stored.id,
      createdAt: stored.createdAt,
      studentId,
      studentName,
      modelVersion: MODEL_VERSION,
      features: f,
      ...result,
    });
  } catch (err) {
    console.error("POST /api/predict failed", err);
    return NextResponse.json({ ok: false, errors: ["Unexpected server error. Please try again."] }, { status: 500 });
  }
}
