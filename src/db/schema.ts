import { pgTable, serial, text, integer, real, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    age: integer("age").notNull(),
    attendance: real("attendance").notNull(),
    studyHours: real("study_hours").notNull(),
    previousMarks: real("previous_marks").notNull(),
    assignmentScore: real("assignment_score").notNull(),
    sleepHours: real("sleep_hours").notNull(),
    internetAccess: boolean("internet_access").notNull().default(false),
    extracurricular: boolean("extracurricular").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("students_name_idx").on(t.name)]
);

export const predictions = pgTable(
  "predictions",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    predictedMarks: real("predicted_marks").notNull(),
    category: text("category").notNull(),
    modelVersion: text("model_version").notNull().default("v1.0.0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("predictions_student_idx").on(t.studentId), index("predictions_created_idx").on(t.createdAt)]
);

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;
