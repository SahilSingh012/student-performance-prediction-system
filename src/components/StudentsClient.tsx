"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search, Trash2, Download, ChevronLeft, ChevronRight, ArrowUpDown, Users, X, Check,
} from "lucide-react";

interface Row {
  id: number; name: string; age: number; attendance: number; study_hours: number;
  previous_marks: number; assignment_score: number; sleep_hours: number;
  internet_access: boolean; extracurricular: boolean; created_at: string;
  latest_prediction: number | null; latest_category: string | null; prediction_count: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Outstanding: "#10b981", Excellent: "#3b82f6", Good: "#14b8a6", "Needs Improvement": "#f59e0b", "At Risk": "#ef4444",
};
const CATEGORIES = ["Outstanding", "Excellent", "Good", "Needs Improvement", "At Risk"];

export default function StudentsClient() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "recent");
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (p: number, query: string, cat: string, srt: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: "10", q: query, category: cat, sort: srt });
      const res = await fetch(`/api/students?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setRows(json.rows); setTotal(json.total); setPages(json.pages); setPage(json.page);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(1, q, category, sort), 250);
    return () => clearTimeout(t);
  }, [q, category, sort, load]);

  const doDelete = async (id: number) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDelete(null);
        load(page, q, category, sort);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ===== Toolbar ===== */}
      <div className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba0bd]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students by name…" className="input !pl-9" aria-label="Search students" />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba0bd] hover:text-[#0a2540]" aria-label="Clear search"><X size={15} /></button>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input w-44" aria-label="Filter by category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-44" aria-label="Sort">
            <option value="recent">Sort: Recently added</option>
            <option value="marks_desc">Sort: Highest predicted</option>
            <option value="marks_asc">Sort: Lowest predicted</option>
            <option value="name">Sort: Name (A–Z)</option>
            <option value="attendance">Sort: Attendance</option>
          </select>
          <a href="/api/students/export" className="btn btn-navy btn-sm" download><Download size={14} /> Export CSV</a>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-[#5b6b82]">
        <span className="inline-flex items-center gap-1.5"><Users size={13} /> {total} student{total === 1 ? "" : "s"} found</span>
        <span>Page {page} of {pages}</span>
      </div>

      {/* ===== Table ===== */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Student</th><th>Att. %</th><th>Study h</th><th>Prev.</th><th>Assign.</th><th>Predicted</th><th>Category</th><th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={9}><div className="h-8 animate-pulse rounded-lg bg-[#eef2f9]" /></td></tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="py-10 text-center text-sm text-[#8ba0bd]">No students match “{q}”. <button className="font-bold text-[#2563eb]" onClick={() => { setQ(""); setCategory(""); }}>Clear filters</button></td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-[11px] font-bold text-[#8ba0bd]">STD-{1000 + r.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eff4ff] text-[10px] font-extrabold text-[#2563eb]">
                        {r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-bold text-[#0a2540]">{r.name}</div>
                        <div className="text-[10px] text-[#8ba0bd]">Age {r.age} · {r.prediction_count} prediction{r.prediction_count === 1 ? "" : "s"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="tabular-nums">{r.attendance}%</td>
                  <td className="tabular-nums">{r.study_hours}</td>
                  <td className="tabular-nums">{r.previous_marks}</td>
                  <td className="tabular-nums">{r.assignment_score}</td>
                  <td className="font-extrabold tabular-nums text-[#0a2540]">{r.latest_prediction ?? "—"}</td>
                  <td>
                    {r.latest_category ? (
                      <span className="pill" style={{ background: `${CATEGORY_COLORS[r.latest_category]}1f`, color: CATEGORY_COLORS[r.latest_category] }}>{r.latest_category}</span>
                    ) : <span className="text-[11px] text-[#9aa7bc]">Not predicted</span>}
                  </td>
                  <td className="text-right">
                    {confirmDelete === r.id ? (
                      <span className="inline-flex items-center gap-1">
                        <button onClick={() => doDelete(r.id)} disabled={deleting} className="rounded-lg bg-red-600 p-1.5 text-white hover:bg-red-700 disabled:opacity-60" aria-label="Confirm delete"><Check size={14} /></button>
                        <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-[#e2e8f3] p-1.5 text-[#5b6b82] hover:bg-slate-100" aria-label="Cancel"><X size={14} /></button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDelete(r.id)} className="rounded-lg border border-[#fecaca] p-1.5 text-[#b91c1c] transition-colors hover:bg-red-50" aria-label={`Delete ${r.name}`}><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Pagination ===== */}
      <div className="flex items-center justify-center gap-2">
        <button className="btn btn-outline btn-sm disabled:cursor-not-allowed disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => load(page - 1, q, category, sort)}><ChevronLeft size={15} /> Prev</button>
        <div className="flex items-center gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5).map((p) => (
            <button key={p} onClick={() => load(p, q, category, sort)}
              className={`h-8 w-8 rounded-lg text-[12px] font-bold transition-colors ${p === page ? "bg-[#2563eb] text-white" : "text-[#33415c] hover:bg-[#e8edf7]"}`}>{p}</button>
          ))}
        </div>
        <button className="btn btn-outline btn-sm disabled:cursor-not-allowed disabled:opacity-40" disabled={page >= pages || loading} onClick={() => load(page + 1, q, category, sort)}>Next <ChevronRight size={15} /></button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-[10.5px] text-[#9aa7bc]"><ArrowUpDown size={11} /> Deleting a student cascades to all their predictions. Demo records are fully synthetic.</p>
    </div>
  );
}
