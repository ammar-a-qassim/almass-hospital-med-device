import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SignaturePad from "../components/SignaturePad";
import QRGenerator from "../components/QRGenerator";
import ImagePreview from "../components/ImagePreview";
import LabelDesigner from "../components/LabelDesigner";
import Modal from "../components/Modal";
import type { Device, Department } from "../types/models";
import { departmentsApi, devicesApi, deviceTypesApi } from "../api/api";

const DeviceNew: React.FC = () => {
  const navigate = useNavigate();
  const { deviceId } = useParams();
  const isEdit = !!deviceId;
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [labelReset, setLabelReset] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [deviceTypeSearch, setDeviceTypeSearch] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const [form, setForm] = useState<any>({
    name: "",
    supplier: "",
    manufacturer: "",
    serial: "",
    department_id: "",
    supply_date: "",
    install_date: "",
    service_engineer: "",
    repair_date: "",
    signature_png: undefined,
    photo_url: undefined,
    manufacturer_url: undefined,
    description: undefined,
    model: "",
    device_type_id: "",
    engineer_phone: "",
    next_maintenance_date: "",
    last_maintenance_date: "",
    contract_photos: [] as string[], // Array of contract photos
    cost: "",
    is_under_warranty: false,
    warranty_expiry_date: "",
  });

  useEffect(() => {
    loadDepartments();
    loadDeviceTypes();
    if (isEdit) {
      loadDevice();
    }
  }, [deviceId]);
  
  const loadDepartments = async () => {
    try {
      const deps = await departmentsApi.getAll();
      setDepartments(deps);
      if (!form.department_id && deps[0]) {
        setForm((f: any) => ({ ...f, department_id: String(deps[0].id) }));
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadDeviceTypes = async () => {
    try {
      const types = await deviceTypesApi.getAll();
      setDeviceTypes(types);
    } catch (error) {
      console.error('Failed to load device types:', error);
    }
  };

  const filteredDeviceTypes = useMemo(() => {
    if (!deviceTypeSearch) return deviceTypes;
    return deviceTypes.filter(t => 
      t.name_ar.includes(deviceTypeSearch) || 
      (t.name_en && t.name_en.toLowerCase().includes(deviceTypeSearch.toLowerCase()))
    );
  }, [deviceTypes, deviceTypeSearch]);

  const deviceTypeName = useMemo(() => {
    const t = deviceTypes.find((x: any) => String(x.id) === String(form.device_type_id));
    return t?.name_ar || "";
  }, [deviceTypes, form.device_type_id]);
  
  const loadDevice = async () => {
    try {
      setLoading(true);
      const device = await devicesApi.getById(Number(deviceId));
      setForm({
        name: device.name || '',
        supplier: device.supplier || '',
        manufacturer: device.manufacturer || '',
        serial: device.serial || '',
        department_id: String(device.department_id || ''),
        supply_date: device.supply_date || '',
        install_date: device.install_date || '',
        service_engineer: device.service_engineer || '',
        repair_date: device.repair_date || '',
        signature_png: device.signature_png || undefined,
        photo_url: device.photo_url || undefined,
        manufacturer_url: device.manufacturer_url || undefined,
        description: device.description || undefined,
        model: device.model || '',
        device_type_id: String(device.device_type_id || ''),
        engineer_phone: device.engineer_phone || '',
        next_maintenance_date: device.next_maintenance_date || '',
        last_maintenance_date: device.last_maintenance_date || '',
        contract_photos: device.contract_photos ? JSON.parse(device.contract_photos) : (device.contract_photo_url ? [device.contract_photo_url] : []),
        cost: device.cost || '',
        is_under_warranty: !!device.is_under_warranty,
        warranty_expiry_date: device.warranty_expiry_date || '',
      });
      if (device.device_type_id) {
        const deviceType = deviceTypes.find((t: any) => t.id === device.device_type_id);
        if (deviceType) {
          setDeviceTypeSearch(deviceType.name_ar);
        }
      }
    } catch (error) {
      console.error('Failed to load device:', error);
    } finally {
      setLoading(false);
    }
  };

  const departmentName = useMemo(() => {
    const d = departments.find((x) => String(x.id) === String(form.department_id));
    return d?.name || "";
  }, [departments, form.department_id]);

  // QR Code contains only the serial number for efficient scanning
  const qrTextFull = useMemo(() => {
    return form.serial || "";
  }, [form.serial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((f: any) => ({ ...f, [name]: checked }));
      return;
    }

    if (name === 'cost') {
      // Allow only numbers
      const numericValue = value.replace(/[^0-9]/g, '');
      setForm((f: any) => ({ ...f, [name]: numericValue }));
      return;
    }

    setForm((f: any) => ({ ...f, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setForm((f: any) => ({ ...f, photo_url: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleContractPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result);
        setForm((f: any) => ({ 
          ...f, 
          contract_photos: [...(f.contract_photos || []), url] 
        }));
      };
      reader.readAsDataURL(file);
    });
    
    // Clear input to allow re-upload of same file
    e.target.value = '';
  };

  const removeContractPhoto = (index: number) => {
    setForm((f: any) => ({
      ...f,
      contract_photos: f.contract_photos.filter((_: string, i: number) => i !== index)
    }));
  };

  const selectDeviceType = (type: any) => {
    setForm((f: any) => ({ ...f, device_type_id: String(type.id), name: type.name_ar }));
    setDeviceTypeSearch(type.name_ar);
    setShowTypeDropdown(false);
  };



  const doSave = async () => {
    if (!form.cost) {
      alert("يرجى إدخال سعر التكلفة");
      return;
    }
    setSaving(true);
    try {
      // Convert undefined values to null for D1 compatibility
      const payload = {
        ...form,
        department_id: form.department_id ? Number(form.department_id) : null,
        device_type_id: form.device_type_id ? Number(form.device_type_id) : null,
        signature_png: form.signature_png || null,
        photo_url: form.photo_url || null,
        contract_photos: form.contract_photos?.length > 0 ? JSON.stringify(form.contract_photos) : null,
        manufacturer_url: form.manufacturer_url || null,
        description: form.description || null,
        engineer_phone: form.engineer_phone || null,
        next_maintenance_date: form.next_maintenance_date || null,
        last_maintenance_date: form.last_maintenance_date || null,
        cost: form.cost ? Number(form.cost) : null,
        is_under_warranty: form.is_under_warranty ? 1 : 0,
        warranty_expiry_date: form.is_under_warranty ? (form.warranty_expiry_date || null) : null,
      };
      
      if (isEdit) {
        await devicesApi.update(Number(deviceId), payload);
      } else {
        await devicesApi.create(payload);
      }
      
      setShowSuccessModal(true);
      
      if (!isEdit) {
        // Clear form for new device
        setForm((f: any) => ({
          ...f,
          name: "",
          supplier: "",
          manufacturer: "",
          serial: "",
          supply_date: "",
          install_date: "",
          service_engineer: "",
          repair_date: "",
          signature_png: undefined,
          photo_url: undefined,
          manufacturer_url: undefined,
          description: undefined,
          model: "",
          device_type_id: "",
          engineer_phone: "",
          next_maintenance_date: "",
          last_maintenance_date: "",
          contract_photos: [],
          cost: "",
          is_under_warranty: false,
          warranty_expiry_date: "",
        }));
        setDeviceTypeSearch("");
        setShowQR(false);
        setDesignerOpen(false);
        setLabelReset((n) => n + 1);
      }
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل الحفظ'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{isEdit ? 'تعديل الجهاز' : 'تسجيل جهاز جديد'}</h2>
      
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          if (isEdit) {
            navigate(`/device/${deviceId}`);
          }
        }}
        title="نجاح"
        message={isEdit ? "تم تحديث الجهاز بنجاح!" : "تم حفظ الجهاز بنجاح!"}
        type="success"
      />


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: form fields */}
        <div className="space-y-4">
          {/* Device Type with Search */}
          <div className="relative">
            <label className="block text-sm text-gray-700">نوع الجهاز<span className="text-red-500"> *</span></label>
            <input
              type="text"
              value={deviceTypeSearch}
              onChange={(e) => {
                setDeviceTypeSearch(e.target.value);
                setShowTypeDropdown(true);
                if (!e.target.value) {
                  setForm((f: any) => ({ ...f, device_type_id: '', name: '' }));
                }
              }}
              onFocus={() => setShowTypeDropdown(true)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="ابحث عن نوع الجهاز..."
            />
            {showTypeDropdown && filteredDeviceTypes.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredDeviceTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => selectDeviceType(type)}
                    className="w-full text-right px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                  >
                    {type.name_ar}
                    {type.name_en && <span className="text-gray-400 text-sm mr-2">({type.name_en})</span>}
                  </button>
                ))}
              </div>
            )}
            {showTypeDropdown && filteredDeviceTypes.length === 0 && deviceTypeSearch && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg p-3 text-gray-500 text-sm">
                لم يتم العثور على أجهزة مطابقة
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-gray-700">اسم الجهاز<span className="text-red-500"> *</span></label>
            <input name="name" value={form.name} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" placeholder="مثال: جهاز مراقبة المريض" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">الموديل</label>
            <input name="model" value={form.model || ""} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" placeholder="اختياري" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700">شركة التوريد<span className="text-red-500"> *</span></label>
              <input name="supplier" value={form.supplier} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">شركة التصنيع<span className="text-red-500"> *</span></label>
              <input name="manufacturer" value={form.manufacturer} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700">رفع صورة الجهاز</label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">رفع صور العقد (يمكن اختيار أكثر من صورة)</label>
              <input type="file" accept="image/*" multiple onChange={handleContractPhotoUpload} className="mt-1 w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700">الرقم التسلسلي<span className="text-red-500"> *</span></label>
            <input name="serial" value={form.serial} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          
          {/* Cost Field */}
          <div>
            <label className="block text-sm text-gray-700">سعر التكلفة<span className="text-red-500"> *</span></label>
            <div className="relative mt-1">
              <input
                name="cost"
                value={form.cost ? Number(form.cost).toLocaleString('en-US') : ""}
                onChange={handleChange}
                className="w-full rounded border px-3 py-2 pl-12 text-left ltr"
                placeholder="0"
                dir="ltr"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 sm:text-sm">د.ع</span>
              </div>
            </div>
          </div>

          {/* Warranty Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_under_warranty"
                name="is_under_warranty"
                checked={form.is_under_warranty}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="is_under_warranty" className="text-sm font-medium text-gray-900 select-none cursor-pointer">
                الجهاز داخل فترة الضمان
              </label>
            </div>

            {form.is_under_warranty && (
              <div className="animate-fade-in">
                <label className="block text-sm text-gray-700 mb-1">تاريخ نهاية الضمان</label>
                <input
                  type="date"
                  name="warranty_expiry_date"
                  value={form.warranty_expiry_date || ""}
                  onChange={handleChange}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700">القسم<span className="text-red-500"> *</span></label>
            <select name="department_id" value={form.department_id} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2">
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700">تاريخ التوريد</label>
              <input type="date" name="supply_date" value={form.supply_date || ""} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">تاريخ التركيب</label>
              <input type="date" name="install_date" value={form.install_date || ""} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700">اسم مهندس الصيانة</label>
              <input name="service_engineer" value={form.service_engineer || ""} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">رقم مهندس الصيانة</label>
              <input name="engineer_phone" value={form.engineer_phone || ""} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" placeholder="رقم الهاتف" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700">تاريخ آخر صيانة</label>
              <input type="date" name="last_maintenance_date" value={form.last_maintenance_date || ""} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">تاريخ الصيانة المستحقة</label>
              <input type="date" name="next_maintenance_date" value={form.next_maintenance_date || ""} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700">نبذة مختصرة</label>
            <textarea name="description" value={form.description || ""} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" rows={3} />
          </div>
          <SignaturePad label="التوقيع" initialDataUrl={form.signature_png} onChange={(url) => setForm((f: any) => ({ ...f, signature_png: url }))} />
        </div>

        {/* Right column: media/qr/designer */}
        <div className="space-y-4">
          <ImagePreview url={form.photo_url} label="صورة الجهاز" onClear={() => setForm((f: any) => ({ ...f, photo_url: undefined }))} />
          {/* Contract Photos Gallery */}
          {form.contract_photos && form.contract_photos.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm text-gray-700">صور العقد ({form.contract_photos.length})</label>
              <div className="grid grid-cols-2 gap-2">
                {form.contract_photos.map((url: string, index: number) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`صورة العقد ${index + 1}`} 
                      className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90"
                      onClick={() => window.open(url, '_blank')}
                    />
                    <button
                      type="button"
                      onClick={() => removeContractPhoto(index)}
                      className="absolute top-1 left-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {form.manufacturer_url && (
            <div className="space-y-1">
              <label className="block text-sm text-gray-700">رابط الشركة المُصنِّعة</label>
              <a href={form.manufacturer_url} target="_blank" rel="noreferrer" className="text-indigo-700 hover:underline break-all">{form.manufacturer_url}</a>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setShowQR((v) => !v)} className="px-3 py-2 rounded bg-indigo-600 text-white text-sm">توليد QR</button>
            <button type="button" onClick={() => setDesignerOpen((v) => !v)} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">وضع المُصمِّم</button>
          </div>

          {showQR && (
            <QRGenerator text={qrTextFull} size={200} onClear={() => setShowQR(false)} />
          )}

          {designerOpen && (
            <div className="border rounded p-3">
              <LabelDesigner
                devicePreview={form}
                showName={true}
                showDepartment={true}
                departmentName={departmentName}
                deviceTypeName={deviceTypeName}
                showSerial={true}
                showQR={true}
                showLogo={true}
                customText={"معلومات الجهاز"}
                onPrint={() => {}}
                resetTrigger={labelReset}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={doSave} disabled={saving} className="px-4 py-2 rounded bg-emerald-600 text-white text-sm disabled:opacity-50">حفظ الإدخال</button>
      </div>
    </div>
  );
};

export default DeviceNew;
