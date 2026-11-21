import { NextResponse } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const studentId = Number(id);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid student id." }, { status: 400 });
    }
    const deleted = await db.delete(students).where(eq(students.id, studentId)).returning({ id: students.id });
    if (deleted.length === 0) {
      return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/students/[id] failed", err);
    return NextResponse.json({ ok: false, error: "Failed to delete student." }, { status: 500 });
  }
}
