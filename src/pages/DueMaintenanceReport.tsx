import { useState, useEffect, useMemo, useRef } from "react";
import { devicesApi, departmentsApi, deviceTypesApi } from "../api/api";
import { Link } from "react-router-dom";
import { toPng } from "html-to-image";

// Current date for comparison (2025-12-06)
const TODAY = new Date().toISOString().split('T')[0];

type MaintenanceStatus = "overdue" | "due_today" | "due_soon" | "no_date";

interface DueDevice {
  id: number;
  name: string;
  serial: string;
  department_name: string;
  device_type_name: string;
  device_type_id: number;
  department_id: number;
  next_maintenance_date: string | null;
  last_maintenance_date: string | null;
  engineer_phone: string | null;
  service_engineer: string | null;
  status: MaintenanceStatus;
  days_overdue: number;
}

export default function DueMaintenanceReport() {
  const [devices, setDevices] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [includeNoDate, setIncludeNoDate] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesData, departmentsData, deviceTypesData] = await Promise.all([
        devicesApi.getAll(),
        departmentsApi.getAll(),
        deviceTypesApi.getAll(),
      ]);
      setDevices(devicesData);
      setDepartments(departmentsData);
      setDeviceTypes(deviceTypesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Calculate maintenance status for each device
  const calculateStatus = (nextDate: string | null): { status: MaintenanceStatus; daysOverdue: number } => {
    if (!nextDate) {
      return { status: "no_date", daysOverdue: 0 };
    }

    const next = new Date(nextDate);
    const today = new Date(TODAY);
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: "overdue", daysOverdue: Math.abs(diffDays) };
    } else if (diffDays === 0) {
      return { status: "due_today", daysOverdue: 0 };
    } else if (diffDays <= 7) {
      return { status: "due_soon", daysOverdue: -diffDays };
    }

    return { status: "due_soon", daysOverdue: -diffDays };
  };

  // Filter and process devices
  const dueDevices: DueDevice[] = useMemo(() => {
    return devices
      .map((device) => {
        const { status, daysOverdue } = calculateStatus(device.next_maintenance_date);
        return {
          id: device.id,
          name: device.name,
          serial: device.serial,
          department_name: device.department_name || "غير محدد",
          device_type_name: device.device_type_name || "غير محدد",
          device_type_id: device.device_type_id,
          department_id: device.department_id,
          next_maintenance_date: device.next_maintenance_date,
          last_maintenance_date: device.last_maintenance_date,
          engineer_phone: device.engineer_phone,
          service_engineer: device.service_engineer,
          status,
          days_overdue: daysOverdue,
        };
      })
      .filter((device) => {
        // Filter by maintenance status (show only due devices)
        if (device.status === "no_date" && !includeNoDate) return false;
        if (device.status !== "overdue" && device.status !== "due_today" && device.status !== "due_soon" && device.status !== "no_date") return false;
        
        // Only show overdue, due today, due soon (within 7 days), or no date
        if (device.status === "due_soon" && device.days_overdue < -7) return false;

        // Filter by department
        if (selectedDepartment !== "all" && String(device.department_id) !== selectedDepartment) return false;

        // Filter by device type
        if (selectedDeviceType !== "all" && String(device.device_type_id) !== selectedDeviceType) return false;

        // Filter by status
        if (selectedStatus !== "all" && device.status !== selectedStatus) return false;

        return true;
      })
      .sort((a, b) => {
        // Sort: overdue first, then due_today, then due_soon, then no_date
        const statusOrder = { overdue: 0, due_today: 1, due_soon: 2, no_date: 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        // Within same status, sort by days overdue (most overdue first)
        return b.days_overdue - a.days_overdue;
      });
  }, [devices, selectedDepartment, selectedDeviceType, selectedStatus, includeNoDate]);

  // Statistics
  const stats = useMemo(() => {
    const allDue = devices.map((d) => calculateStatus(d.next_maintenance_date));
    return {
      overdue: allDue.filter((d) => d.status === "overdue").length,
      dueToday: allDue.filter((d) => d.status === "due_today").length,
      dueSoon: allDue.filter((d) => d.status === "due_soon" && d.daysOverdue >= -7).length,
      noDate: allDue.filter((d) => d.status === "no_date").length,
      total: devices.length,
    };
  }, [devices]);

  const getStatusBadge = (status: MaintenanceStatus, daysOverdue: number) => {
    switch (status) {
      case "overdue":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            متأخرة {daysOverdue} يوم
          </span>
        );
      case "due_today":
        return (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            مستحقة اليوم
          </span>
        );
      case "due_soon":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            خلال {Math.abs(daysOverdue)} أيام
          </span>
        );
      case "no_date":
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            غير محدد
          </span>
        );
    }
  };

  const exportToImage = async () => {
    if (!reportRef.current || exporting) return;

    try {
      setExporting(true);
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `تقرير-الصيانة-المستحقة-${new Date().toLocaleDateString('ar-EG')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('فشل تصدير التقرير');
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["اسم الجهاز", "الرقم التسلسلي", "القسم", "نوع الجهاز", "تاريخ الصيانة التالية", "تاريخ آخر صيانة", "مهندس الصيانة", "رقم الهاتف", "الحالة"];
    
    const rows = dueDevices.map((d) => [
      d.name,
      d.serial,
      d.department_name,
      d.device_type_name,
      d.next_maintenance_date || "غير محدد",
      d.last_maintenance_date || "غير محدد",
      d.service_engineer || "غير محدد",
      d.engineer_phone || "غير محدد",
      d.status === "overdue" ? `متأخرة ${d.days_overdue} يوم` : 
        d.status === "due_today" ? "مستحقة اليوم" : 
        d.status === "due_soon" ? `خلال ${Math.abs(d.days_overdue)} أيام` : "غير محدد"
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير-الصيانة-المستحقة-${new Date().toLocaleDateString('ar-EG')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تقارير الصيانة المستحقة</h1>
          <p className="text-gray-600 mt-1">تاريخ اليوم: {new Date(TODAY).toLocaleDateString('ar-EG')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            تصدير CSV
          </button>
          <button
            onClick={exportToImage}
            disabled={exporting}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {exporting ? 'جاري التصدير...' : 'تصدير كصورة'}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-r-4 border-blue-500">
            <p className="text-sm text-gray-600">إجمالي الأجهزة</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-r-4 border-red-500">
            <p className="text-sm text-red-700">متأخرة</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-r-4 border-orange-500">
            <p className="text-sm text-orange-700">مستحقة اليوم</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.dueToday}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-r-4 border-yellow-500">
            <p className="text-sm text-yellow-700">خلال 7 أيام</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.dueSoon}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-r-4 border-gray-400">
            <p className="text-sm text-gray-600">بدون تاريخ</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">{stats.noDate}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-gray-700 mb-3">الفلاتر</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">القسم</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
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
              <label className="block text-sm text-gray-600 mb-1">نوع الجهاز</label>
              <select
                value={selectedDeviceType}
                onChange={(e) => setSelectedDeviceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الأنواع</option>
                {deviceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name_ar}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">حالة الصيانة</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="overdue">متأخرة</option>
                <option value="due_today">مستحقة اليوم</option>
                <option value="due_soon">قريبة</option>
                <option value="no_date">بدون تاريخ</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNoDate}
                  onChange={(e) => setIncludeNoDate(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">تضمين الأجهزة بدون تاريخ</span>
              </label>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          عرض {dueDevices.length} جهاز يحتاج صيانة
        </div>

        {/* Devices Table */}
        {dueDevices.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الجهاز</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">القسم</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">النوع</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">تاريخ الصيانة التالية</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">آخر صيانة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">مهندس الصيانة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dueDevices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{device.name}</p>
                          <p className="text-sm text-gray-500">{device.serial}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{device.department_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{device.device_type_name}</td>
                      <td className="px-4 py-3 text-sm">
                        {device.next_maintenance_date ? (
                          <span className="text-gray-900">
                            {new Date(device.next_maintenance_date).toLocaleDateString('ar-EG')}
                          </span>
                        ) : (
                          <span className="text-gray-400">غير محدد</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {device.last_maintenance_date ? (
                          <span className="text-gray-600">
                            {new Date(device.last_maintenance_date).toLocaleDateString('ar-EG')}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {device.service_engineer ? (
                          <div>
                            <p className="text-gray-900">{device.service_engineer}</p>
                            {device.engineer_phone && (
                              <a
                                href={`tel:${device.engineer_phone}`}
                                className="text-blue-600 hover:underline text-xs"
                              >
                                {device.engineer_phone}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(device.status, device.days_overdue)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            to={`/device/${device.id}`}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                          >
                            عرض
                          </Link>
                          <Link
                            to={`/device/edit/${device.id}`}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
                          >
                            تعديل
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">لا توجد أجهزة مستحقة للصيانة</h3>
            <p className="text-gray-600">جميع الأجهزة في حالة جيدة ولا تحتاج صيانة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
