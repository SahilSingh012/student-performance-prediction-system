import { NextResponse } from "next/server";
import { resetDemoData } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { total } = await resetDemoData();
    return NextResponse.json({ ok: true, total });
  } catch (err) {
    console.error("POST /api/admin/reset failed", err);
    return NextResponse.json({ ok: false, error: "Failed to reset demo data." }, { status: 500 });
  }
}
