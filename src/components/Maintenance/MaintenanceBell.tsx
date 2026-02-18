import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { maintenanceApi } from "../../api/api";

type Summary = {
  overdue: number;
  dueToday: number;
  dueSoon: number;
  noDate: number;
  totalDue: number;
  days: number;
};

type DueItem = {
  id: number;
  name: string;
  serial: string | null;
  department_name: string | null;
  device_type_name: string | null;
  next_maintenance_date: string | null;
  status: "overdue" | "due_today" | "due_soon" | "no_date" | string;
  days_overdue: number | null;
};

function formatDateAr(dateStr: string | null) {
  if (!dateStr) return "غير محدد";
  try {
    return new Date(dateStr).toLocaleDateString("ar-EG");
  } catch {
    return dateStr;
  }
}

function statusBadge(item: DueItem) {
  const s = item.status;
  if (s === "overdue") {
    const days = Math.max(0, Number(item.days_overdue || 0));
    return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">متأخرة {days} يوم</span>;
  }
  if (s === "due_today") {
    return <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">مستحقة اليوم</span>;
  }
  if (s === "due_soon") {
    const days = Math.max(0, Math.abs(Number(item.days_overdue || 0)));
    return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">خلال {days} أيام</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">غير محدد</span>;
}

export default function MaintenanceBell({
  enabled,
  days = 7,
}: {
  enabled: boolean;
  days?: number;
}) {
  const [open, setOpen] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState<Summary>({ overdue: 0, dueToday: 0, dueSoon: 0, noDate: 0, totalDue: 0, days });

  const [loadingList, setLoadingList] = useState(false);
  const [items, setItems] = useState<DueItem[]>([]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastLoadedAtRef = useRef<number>(0);

  const badgeCount = useMemo(() => {
    return Number(summary.totalDue || 0);
  }, [summary.totalDue]);

  const loadSummary = async () => {
    if (!enabled) return;
    try {
      setLoadingSummary(true);
      const res: any = await maintenanceApi.getSummary({ days });
      setSummary(res.data || { overdue: 0, dueToday: 0, dueSoon: 0, noDate: 0, totalDue: 0, days });
    } catch (e) {
      // Silent fail for header speed
      console.error("Failed to load maintenance summary", e);
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadList = async () => {
    if (!enabled) return;
    const now = Date.now();
    // Avoid reloading too frequently
    if (now - lastLoadedAtRef.current < 20_000 && items.length) return;

    try {
      setLoadingList(true);
      const res: any = await maintenanceApi.getDue({ days, limit: 10, offset: 0 });
      setItems(res.data?.items || []);
      lastLoadedAtRef.current = now;
    } catch (e) {
      console.error("Failed to load due maintenance list", e);
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadSummary();
    if (!enabled) return;
    const id = window.setInterval(loadSummary, 60_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!open) return;
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!enabled) return null;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="إشعارات الصيانة المستحقة"
        title="الصيانة المستحقة"
      >
        <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {badgeCount > 0 && (
          <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1 rounded-full bg-yellow-400 text-slate-900 text-xs font-bold flex items-center justify-center">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}

        {loadingSummary && (
          <span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-white/70" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-[360px] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">الصيانة المستحقة</p>
                <p className="text-xs text-gray-600">آخر {summary.days} أيام</p>
              </div>
              <Link
                to="/reports/maintenance"
                className="text-xs text-purple-700 hover:underline"
                onClick={() => setOpen(false)}
              >
                عرض الكل
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="rounded-lg bg-red-50 p-2">
                <p className="text-[11px] text-red-700">متأخرة</p>
                <p className="text-lg font-bold text-red-700">{summary.overdue}</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2">
                <p className="text-[11px] text-orange-700">اليوم</p>
                <p className="text-lg font-bold text-orange-700">{summary.dueToday}</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-2">
                <p className="text-[11px] text-yellow-800">قريباً</p>
                <p className="text-lg font-bold text-yellow-800">{summary.dueSoon}</p>
              </div>
            </div>
          </div>

          <div className="max-h-[380px] overflow-auto">
            {loadingList ? (
              <div className="p-4 text-sm text-gray-600">جاري التحميل...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-gray-600">لا توجد صيانة مستحقة حالياً</div>
            ) : (
              <ul className="divide-y">
                {items.map((it) => (
                  <li key={it.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{it.name}</p>
                        <p className="text-xs text-gray-600 truncate">
                          {it.department_name || "غير محدد"}
                          {it.serial ? ` • ${it.serial}` : ""}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          الصيانة التالية: {formatDateAr(it.next_maintenance_date)}
                        </p>
                      </div>
                      <div className="shrink-0">{statusBadge(it)}</div>
                    </div>
                    <div className="mt-2">
                      <Link
                        to={`/device/${it.id}`}
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        فتح الجهاز
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-3 bg-gray-50 border-t flex items-center justify-between">
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-700 hover:underline"
            >
              إغلاق
            </button>
            <button
              onClick={loadList}
              className="text-sm text-gray-700 hover:underline"
            >
              تحديث
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
