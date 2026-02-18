import type { Department, Device, LabelTemplate, RoutineCheck } from "../types/models";

const KEYS = {
  devices: "mdf_devices",
  departments: "mdf_departments",
  labelTemplates: "mdf_label_templates",
  routineChecks: "mdf_routine_checks",
} as const;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function uid(prefix = "mdf"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Departments
export function getDepartments(): Department[] {
  return readJSON<Department[]>(KEYS.departments, []);
}

export function saveDepartments(list: Department[]): void {
  writeJSON(KEYS.departments, list);
}

export function ensureDemoDepartments(): Department[] {
  let list = getDepartments();
  if (list.length === 0) {
    list = [
      { id: uid("dep"), name: "العناية المركزة", devices_count: 0 },
      { id: uid("dep"), name: "التصوير", devices_count: 0 },
      { id: uid("dep"), name: "المختبر", devices_count: 0 },
      { id: uid("dep"), name: "الطوارئ", devices_count: 0 },
    ];
    saveDepartments(list);
  }
  return list;
}

export function addDepartment(name: string): { ok: boolean; error?: string; value?: Department } {
  const list = getDepartments();
  const exists = list.some((d) => d.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (exists) return { ok: false, error: "هذا الاسم مستخدم من قبل" };
  const dep: Department = { id: uid("dep"), name: name.trim(), devices_count: 0 };
  list.push(dep);
  saveDepartments(list);
  return { ok: true, value: dep };
}

// Devices
export function getDevices(): Device[] {
  return readJSON<Device[]>(KEYS.devices, []);
}

export function saveDevices(list: Device[]): void {
  writeJSON(KEYS.devices, list);
}

export function findDeviceBySerial(serial: string): Device | undefined {
  return getDevices().find((d) => d.serial.trim().toLowerCase() === serial.trim().toLowerCase());
}

export function addDevice(input: Omit<Device, "id">): { ok: boolean; error?: string; value?: Device } {
  // Required validations
  if (!input.name?.trim()) return { ok: false, error: "اسم الجهاز إلزامي" };
  if (!input.supplier?.trim()) return { ok: false, error: "شركة التوريد إلزامية" };
  if (!input.manufacturer?.trim()) return { ok: false, error: "شركة التصنيع إلزامية" };
  if (!input.serial?.trim()) return { ok: false, error: "الرقم التسلسلي إلزامي" };
  if (!input.department_id?.trim()) return { ok: false, error: "يجب اختيار القسم" };

  // Uniqueness
  if (findDeviceBySerial(input.serial)) {
    return { ok: false, error: "لا يمكن حفظ جهاز برقم تسلسلي مكرر" };
  }

  // Date relation
  if (input.install_date && input.supply_date) {
    const install = new Date(input.install_date).getTime();
    const supply = new Date(input.supply_date).getTime();
    if (!Number.isNaN(install) && !Number.isNaN(supply) && install < supply) {
      return { ok: false, error: "تاريخ التركيب يجب أن يكون أكبر أو يساوي تاريخ التوريد" };
    }
  }

  const device: Device = { id: uid("dev"), ...input };
  const list = getDevices();
  list.push(device);
  saveDevices(list);

  // bump department devices_count
  const deps = getDepartments().map((d) => (d.id === device.department_id ? { ...d, devices_count: d.devices_count + 1 } : d));
  saveDepartments(deps);

  return { ok: true, value: device };
}

// Label Templates
export function getLabelTemplates(): LabelTemplate[] {
  return readJSON<LabelTemplate[]>(KEYS.labelTemplates, []);
}

export function saveLabelTemplates(list: LabelTemplate[]): void {
  writeJSON(KEYS.labelTemplates, list);
}

export function addLabelTemplate(t: Omit<LabelTemplate, "id">): LabelTemplate {
  const tpl: LabelTemplate = { id: uid("tpl"), ...t };
  const list = getLabelTemplates();
  list.push(tpl);
  saveLabelTemplates(list);
  return tpl;
}

// Routine Checks
export function getRoutineChecks(): RoutineCheck[] {
  return readJSON<RoutineCheck[]>(KEYS.routineChecks, []);
}

export function saveRoutineChecks(list: RoutineCheck[]): void {
  writeJSON(KEYS.routineChecks, list);
}

export function getRoutineChecksByDevice(device_id: string): RoutineCheck[] {
  return getRoutineChecks().filter((r) => r.device_id === device_id);
}

export function addRoutineCheck(input: Omit<RoutineCheck, "id">): { ok: boolean; error?: string; value?: RoutineCheck } {
  if (!input.device_id?.trim()) return { ok: false, error: "يجب تحديد الجهاز" };
  if (!input.date?.trim()) return { ok: false, error: "تاريخ الفحص إلزامي" };
  if (!input.state) return { ok: false, error: "حالة الجهاز إلزامية" };
  if (!input.checker_name?.trim()) return { ok: false, error: "اسم الفاحص إلزامي" };

  // ensure device exists
  const dev = getDevices().find((d) => d.id === input.device_id);
  if (!dev) return { ok: false, error: "الجهاز غير موجود" };

  const check: RoutineCheck = { id: uid("rc"), ...input };
  const list = getRoutineChecks();
  list.push(check);
  saveRoutineChecks(list);
  return { ok: true, value: check };
}
