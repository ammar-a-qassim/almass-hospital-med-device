import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { devicesApi, checksApi } from "../api/api";

export default function DeviceDetail() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  const [device, setDevice] = useState<any | null>(null);
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) {
      navigate("/devices");
      return;
    }

    loadData();
  }, [deviceId, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deviceData, checksData] = await Promise.all([
        devicesApi.getById(Number(deviceId)),
        checksApi.getAll(Number(deviceId))
      ]);
      
      setDevice(deviceData);
      setChecks(checksData.sort((a: any, b: any) => 
        new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
      ));
    } catch (error) {
      console.error('Failed to load device:', error);
      navigate("/devices");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!device) {
    return null;
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
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
      case "poor":
        return "ضعيف";
      default:
        return state;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/devices" className="text-white/80 hover:text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            العودة للقائمة
          </Link>
          <Link
            to={`/device/edit/${deviceId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            تعديل الجهاز
          </Link>
        </div>

        {/* Device Info Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h1 className="text-3xl font-bold mb-6">{device.name}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-300">الرقم التسلسلي</p>
              <p className="text-lg font-medium">{device.serial || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">القسم</p>
              <p className="text-lg font-medium">{device.department_name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">الشركة المصنعة</p>
              <p className="text-lg font-medium">{device.manufacturer || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">المورد</p>
              <p className="text-lg font-medium">{device.supplier || "—"}</p>
            </div>
            {device.model && (
              <div>
                <p className="text-sm text-gray-300">الموديل</p>
                <p className="text-lg font-medium">{device.model}</p>
              </div>
            )}
            {device.supply_date && (
              <div>
                <p className="text-sm text-gray-300">تاريخ التوريد</p>
                <p className="text-lg font-medium">{new Date(device.supply_date).toLocaleDateString('ar-EG')}</p>
              </div>
            )}
            {device.install_date && (
              <div>
                <p className="text-sm text-gray-300">تاريخ التركيب</p>
                <p className="text-lg font-medium">{new Date(device.install_date).toLocaleDateString('ar-EG')}</p>
              </div>
            )}
            {device.service_engineer && (
              <div>
                <p className="text-sm text-gray-300">مهندس الصيانة</p>
                <p className="text-lg font-medium">{device.service_engineer}</p>
              </div>
            )}
          </div>

          {device.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-300">الوصف</p>
              <p className="text-lg">{device.description}</p>
            </div>
          )}

          {device.manufacturer_url && (
            <div className="mt-4">
              <a
                href={device.manufacturer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-2"
              >
                موقع الشركة المصنعة
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Checks History */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold mb-4">سجل الفحوصات ({checks.length})</h2>
          
          {checks.length === 0 ? (
            <div className="text-center py-8 text-gray-300">لا توجد فحوصات لهذا الجهاز</div>
          ) : (
            <div className="space-y-4">
              {checks.map((check) => (
                <div key={check.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-300">
                        {new Date(check.check_date).toLocaleDateString('ar-EG')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(check.state)}`}>
                        {getStateText(check.state)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">
                      المفتش: {check.checker_name}
                    </div>
                  </div>
                  {check.issue && (
                    <p className="text-sm text-gray-300 mt-2">
                      <span className="font-medium">ملاحظات:</span> {check.issue}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
