import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { checksApi, departmentsApi } from "../api/api";

export default function ChecksList() {
  const [checks, setChecks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "state">("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [checksData, departmentsData] = await Promise.all([
        checksApi.getAll(),
        departmentsApi.getAll()
      ]);
      setChecks(checksData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedChecks = useMemo(() => {
    let result = [...checks];

    // Search by device name, checker name
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((check) => {
        const deviceName = (check.device_name || "").toLowerCase();
        const checkerName = (check.checker_name || "").toLowerCase();
        return deviceName.includes(term) || checkerName.includes(term);
      });
    }

    // Filter by state
    if (filterState !== "all") {
      result = result.filter((check) => check.state === filterState);
    }

    // Filter by department
    if (filterDepartment !== "all") {
      result = result.filter((check) => String(check.department_id) === String(filterDepartment));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.check_date).getTime() - new Date(a.check_date).getTime();
      } else if (sortBy === "date-asc") {
        return new Date(a.check_date).getTime() - new Date(b.check_date).getTime();
      } else {
        // Sort by state
        const stateOrder = { excellent: 1, good: 2, average: 2, poor: 3, needs_maintenance: 3 };
        return (stateOrder[a.state as keyof typeof stateOrder] || 4) - (stateOrder[b.state as keyof typeof stateOrder] || 4);
      }
    });

    return result;
  }, [checks, searchTerm, filterState, filterDepartment, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterState, filterDepartment, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedChecks.length / PAGE_SIZE);
  const paginatedChecks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedChecks.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedChecks, currentPage]);

  const getStateColor = (state: string) => {
    switch (state) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
      case "average":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
      case "needs_maintenance":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case "excellent":
        return "ممتاز";
      case "good":
        return "جيد";
      case "average":
        return "متوسط";
      case "poor":
        return "ضعيف";
      case "needs_maintenance":
        return "بحاجة صيانة";
      default:
        return state;
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">سجل الصيانة</h1>
        <Link
          to="/check"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          صيانة جديدة
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">بحث</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="اسم الجهاز أو المفتش..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الأقسام</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="excellent">ممتاز</option>
              <option value="average">متوسط</option>
              <option value="needs_maintenance">بحاجة صيانة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الترتيب</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">الأحدث أولاً</option>
              <option value="date-asc">الأقدم أولاً</option>
              <option value="state">حسب الحالة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الجهاز
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفاحص
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ملاحظات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedChecks.length > 0 ? (
                paginatedChecks.map((check) => (
                  <tr key={check.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {check.device_name || "جهاز غير معروف"}
                      </div>
                      {check.device_serial && (
                        <div className="text-xs text-gray-500">{check.device_serial}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(check.check_date).toLocaleDateString("ar-EG")}
                      <br />
                      <span className="text-xs">
                        {new Date(check.check_date).toLocaleTimeString("ar-EG")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStateColor(
                          check.state
                        )}`}
                      >
                        {getStateText(check.state)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {check.checker_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {check.issue || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    لا توجد سجلات مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              عرض {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, filteredAndSortedChecks.length)} من {filteredAndSortedChecks.length}
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
      </div>
    </div>
  );
}