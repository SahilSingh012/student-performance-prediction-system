import { datasetToCsv, DATASET_SIZE } from "@/lib/ml";

export const dynamic = "force-dynamic";

export async function GET() {
  const csv = datasetToCsv();
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="student_performance_synthetic_${DATASET_SIZE}rows.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
