export type DeviceState = "excellent" | "good" | "poor";

export interface Department {
  id: string;
  name: string; // unique, case-insensitive
  custodian_name?: string | null;
  devices_count: number;
}

export interface Device {
  id: string;
  name: string;
  supplier: string;
  manufacturer: string;
  serial: string; // unique
  department_id: string;
  device_type_id?: string | number;
  supply_date?: string; // ISO date
  install_date?: string; // ISO date
  service_engineer?: string;
  engineer_phone?: string;
  repair_date?: string; // ISO date
  last_maintenance_date?: string; // ISO date
  next_maintenance_date?: string; // ISO date
  signature_png?: string; // data URL
  photo_url?: string;
  contract_photos?: string[] | string; // JSON array or data URLs
  manufacturer_url?: string;
  description?: string;
  // extra UI-only field (not persisted in schema but helpful in UI)
  model?: string;
}

export interface CheckCriteria {
  cleanliness: boolean;        // النظافة العامة
  functionality: boolean;       // الأداء الوظيفي
  safety: boolean;              // السلامة
  electrical: boolean;          // التوصيلات الكهربائية
  mechanical: boolean;          // الأجزاء الميكانيكية
  calibration: boolean;         // المعايرة
}

export interface RoutineCheck {
  id: string;
  device_id: string;
  date: string; // ISO date
  state: DeviceState;           // Auto-calculated final rating
  criteria?: string;            // JSON string of CheckCriteria
  issue?: string;
  checker_name: string;
  signature_png?: string;
  created_by: string; // user id or name for MVP
}

export interface LabelTemplate {
  id: string;
  name: string;
  json_definition: string;
  is_default?: boolean;
}
