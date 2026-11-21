/**
 * Seeds the database with synthetic demo records on first use.
 * Every seeded prediction is computed by the real ML model at runtime —
 * nothing is hardcoded. All data is 100% synthetic (see src/lib/ml.ts).
 */
import { db } from "@/db";
import { students, predictions } from "@/db/schema";
import { sql, count } from "drizzle-orm";
import { generateDataset, predictForFeatures, categorize, MODEL_VERSION } from "@/lib/ml";

const FIRST_NAMES = [
  "Aarav", "Diya", "Rohan", "Ishita", "Kabir", "Ananya", "Vivaan", "Meera", "Arjun", "Saanvi",
  "Dev", "Priya", "Reyansh", "Neha", "Yash", "Kavya", "Aditya", "Riya", "Karan", "Pooja",
  "Aisha", "Rahul", "Tanvi", "Siddharth", "Naina", "Manav", "Ishani", "Dhruv", "Sara", "Nikhil",
];
const LAST_NAMES = [
  "Sharma", "Patel", "Iyer", "Khan", "Nair", "Gupta", "Reddy", "Mehta", "Singh", "Das",
  "Kulkarni", "Joshi", "Bose", "Chopra", "Malhotra", "Verma", "Rao", "Menon", "Kapoor", "Pillai",
];

export async function studentCount(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(students);
  return Number(row?.value ?? 0);
}

export async function ensureSeed(): Promise<{ seeded: boolean; total: number }> {
  const existing = await studentCount();
  if (existing > 0) return { seeded: false, total: existing };

  // Use held-out (test-split) slice of the synthetic dataset — never
  // visually distinguishable from training rows, still 100% synthetic.
  const rows = generateDataset().slice(500, 590);

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length]}`;
    const createdAt = new Date(now - Math.floor(((i * 137) % 75) + 2) * DAY - (i * 37 % DAY));

    const [inserted] = await db
      .insert(students)
      .values({
        name,
        age: r.age,
        attendance: r.attendance,
        studyHours: r.study_hours,
        previousMarks: r.previous_marks,
        assignmentScore: r.assignment_score,
        sleepHours: r.sleep_hours,
        internetAccess: r.internet_access,
        extracurricular: r.extracurricular,
        createdAt,
      })
      .returning({ id: students.id });

    const result = predictForFeatures(r);
    await db.insert(predictions).values({
      studentId: inserted.id,
      predictedMarks: result.predicted,
      category: result.category,
      modelVersion: MODEL_VERSION,
      createdAt: new Date(createdAt.getTime() + 60 * 1000),
    });
  }

  const [total] = await db.select({ value: count() }).from(students);
  return { seeded: true, total: Number(total?.value ?? 0) };
}

export async function resetDemoData(): Promise<{ total: number }> {
  await db.execute(sql`TRUNCATE TABLE predictions, students RESTART IDENTITY CASCADE`);
  await ensureSeed();
  const total = await studentCount();
  return { total };
}

export { categorize };
