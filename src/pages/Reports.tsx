import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { reportsApi } from "../api/api";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { toPng } from "html-to-image";

const COLORS = {
  excellent: "#10b981",
  good: "#f59e0b",
  poor: "#ef4444",
};

const DEPT_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export default function Reports() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result: any = await reportsApi.get({
        period: selectedPeriod,
        department_id: selectedDepartment,
      });
      setReportData(result.data || null);
    } catch (error) {
      console.error('Failed to load report data:', error);
      alert('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const summary = reportData?.summary || { total: 0, excellent: 0, good: 0, poor: 0 };
  const total = summary.total || 0;
  const excellentPercent = total > 0 ? ((summary.excellent / total) * 100).toFixed(1) : "0";
  const goodPercent = total > 0 ? ((summary.good / total) * 100).toFixed(1) : "0";
  const poorPercent = total > 0 ? ((summary.poor / total) * 100).toFixed(1) : "0";

  const pieChartData = [
    { name: "ممتاز", value: summary.excellent || 0, color: COLORS.excellent },
    { name: "جيد", value: summary.good || 0, color: COLORS.good },
    { name: "ضعيف", value: summary.poor || 0, color: COLORS.poor },
  ].filter((item) => item.value > 0);

  const departmentChartData = (reportData?.departmentPerformance || []).map((dept: any) => ({
    name: dept.name,
    ممتاز: dept.excellent || 0,
    جيد: dept.good || 0,
    ضعيف: dept.poor || 0,
    devices: dept.devices || 0,
  }));

  const timelineData = (reportData?.timeline || []).map((item: any) => ({
    date: item.date,
    ممتاز: item.excellent || 0,
    جيد: item.good || 0,
    ضعيف: item.poor || 0,
  }));

  const devicesDistributionData = reportData?.devicesDistribution || [];
  const departments = reportData?.departments || [];

  const exportToPDF = async () => {
    if (!reportRef.current || exporting) return;

    try {
      setExporting(true);

      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `تقرير-الأجهزة-الطبية-${new Date().toLocaleDateString('ar-EG')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('فشل تصدير التقرير');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
        <div className="flex gap-2">
          <Link
            to="/reports/maintenance"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            الصيانة المستحقة
          </Link>
          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400"
          >
            {exporting ? 'جاري التصدير...' : 'تصدير كصورة'}
          </button>
        </div>
      </div>

      <div ref={reportRef}>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الفترة الزمنية</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">آخر أسبوع</option>
              <option value="month">آخر شهر</option>
              <option value="quarter">آخر 3 أشهر</option>
              <option value="year">آخر سنة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الأقسام</option>
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">إجمالي الفحوصات</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <p className="text-sm text-green-700">ممتاز</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{summary.excellent}</p>
          <p className="text-xs text-green-600 mt-1">{excellentPercent}%</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <p className="text-sm text-yellow-700">جيد</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{summary.good}</p>
          <p className="text-xs text-yellow-600 mt-1">{goodPercent}%</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6">
          <p className="text-sm text-red-700">ضعيف</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{summary.poor}</p>
          <p className="text-xs text-red-600 mt-1">{poorPercent}%</p>
        </div>
      </div>

      {/* Charts Row 1: Pie Chart and Devices Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart - Check States */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">توزيع حالات الفحص</h2>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">لا توجد بيانات</div>
          )}
        </div>

        {/* Devices Distribution by Department */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">توزيع الأجهزة حسب الأقسام</h2>
          {devicesDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(300, devicesDistributionData.length * 45 + 40)}>
              <BarChart
                data={devicesDistributionData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 13, textAnchor: 'end' }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} جهاز`, 'العدد']}
                  contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  {devicesDistributionData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Bar Chart - Department Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">أداء الأقسام</h2>
        {departmentChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ممتاز" fill={COLORS.excellent} />
              <Bar dataKey="جيد" fill={COLORS.good} />
              <Bar dataKey="ضعيف" fill={COLORS.poor} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">لا توجد بيانات</div>
        )}
      </div>

      {/* Line Chart - Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">الفحوصات خلال الفترة</h2>
        {timelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ممتاز" stroke={COLORS.excellent} strokeWidth={2} />
              <Line type="monotone" dataKey="جيد" stroke={COLORS.good} strokeWidth={2} />
              <Line type="monotone" dataKey="ضعيف" stroke={COLORS.poor} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">لا توجد بيانات</div>
        )}
      </div>

      {/* Department Details Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">تفاصيل الأقسام</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">القسم</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">عدد الأجهزة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">ممتاز</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">جيد</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">ضعيف</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">إجمالي الفحوصات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {departmentChartData.map((dept: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{dept.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{dept.devices}</td>
                  <td className="px-4 py-3 text-sm text-green-600">{dept.ممتاز}</td>
                  <td className="px-4 py-3 text-sm text-yellow-600">{dept.جيد}</td>
                  <td className="px-4 py-3 text-sm text-red-600">{dept.ضعيف}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {dept.ممتاز + dept.جيد + dept.ضعيف}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
