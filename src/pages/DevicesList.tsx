import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import type { Device, Department } from "../types/models";
import { devicesApi, departmentsApi } from "../api/api";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 400;

const DevicesList: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [q, setQ] = useState("");
  const [depId, setDepId] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // Load departments only once
  useEffect(() => {
    departmentsApi.getAll().then(setDepartments).catch(console.error);
  }, []);

  // Load devices with server-side pagination
  const loadDevices = useCallback(async (page: number, search: string, department: string, sort: string) => {
    try {
      setLoading(true);
      const result: any = await devicesApi.getAll({
        page,
        limit: PAGE_SIZE,
        q: search || undefined,
        department_id: department || undefined,
        sort,
      });

      // result is from apiCallRaw: { success, data: [...], pagination: {...} }
      if (result && result.pagination) {
        setDevices(result.data || []);
        setTotalCount(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } else if (result && Array.isArray(result.data)) {
        setDevices(result.data);
        setTotalCount(result.data.length);
        setTotalPages(Math.ceil(result.data.length / PAGE_SIZE));
      } else if (Array.isArray(result)) {
        setDevices(result);
        setTotalCount(result.length);
        setTotalPages(Math.ceil(result.length / PAGE_SIZE));
      } else {
        setDevices([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
      alert('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDevices(1, "", "", "recent");
  }, []);

  // When filters or page change (skip first render)
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    loadDevices(currentPage, q, depId, sortBy);
  }, [currentPage, depId, sortBy]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      loadDevices(1, value, depId, sortBy);
    }, DEBOUNCE_MS);
  };

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((d) => map.set(String(d.id), d.name));
    return map;
  }, [departments]);

  const resetFilters = () => {
    setQ("");
    setDepId("");
    setSortBy("recent");
    setCurrentPage(1);
    loadDevices(1, "", "", "recent");
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الجهاز؟')) return;
    
    try {
      await devicesApi.delete(id);
      loadDevices(currentPage, q, depId, sortBy);
    } catch (error) {
      console.error('Failed to delete device:', error);
      alert('فشل حذف الجهاز');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">قائمة الأجهزة</h2>
        <Link to="/device/new" className="px-3 py-2 rounded bg-indigo-600 text-white text-sm">إضافة جهاز جديد</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700">بحث</label>
          <input
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="اسم الجهاز، التسلسلي، الشركة..."
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">القسم</label>
          <select
            value={depId}
            onChange={(e) => { setDepId(e.target.value); setCurrentPage(1); }}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="">جميع الأقسام</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">الترتيب</label>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="recent">الأحدث</option>
            <option value="name_asc">الاسم (أ-ي)</option>
            <option value="name_desc">الاسم (ي-أ)</option>
          </select>
        </div>
      </div>

      {(q || depId || sortBy !== "recent") && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">النتائج: {totalCount}</span>
          <button onClick={resetFilters} className="text-sm text-indigo-600 underline">
            إعادة تعيين
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : devices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">لا توجد أجهزة</div>
      ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-3 py-2 text-right text-sm font-medium">الاسم</th>
                <th className="border px-3 py-2 text-right text-sm font-medium">الرقم التسلسلي</th>
                <th className="border px-3 py-2 text-right text-sm font-medium">القسم</th>
                <th className="border px-3 py-2 text-right text-sm font-medium">الشركة المصنعة</th>
                <th className="border px-3 py-2 text-right text-sm font-medium">تاريخ التسجيل</th>
                <th className="border px-3 py-2 text-right text-sm font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2 text-sm">{device.name}</td>
                  <td className="border px-3 py-2 text-sm">{device.serial || "—"}</td>
                  <td className="border px-3 py-2 text-sm">
                    {device.department_name || departmentNameById.get(String(device.department_id)) || "—"}
                  </td>
                  <td className="border px-3 py-2 text-sm">{device.manufacturer || "—"}</td>
                  <td className="border px-3 py-2 text-sm">
                    {device.created_at ? new Date(device.created_at).toLocaleDateString('ar-EG') : "—"}
                  </td>
                  <td className="border px-3 py-2 text-sm">
                    <div className="flex gap-2">
                      <Link
                        to={`/device/${device.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        عرض
                      </Link>
                      <Link
                        to={`/device/edit/${device.id}`}
                        className="text-green-600 hover:underline"
                      >
                        تعديل
                      </Link>
                      <button
                        onClick={() => handleDelete(device.id)}
                        className="text-red-600 hover:underline"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              عرض {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalCount)} من {totalCount}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                السابق
              </button>
              <span className="text-sm text-gray-700">صفحة {currentPage} من {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                التالي
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default DevicesList;
