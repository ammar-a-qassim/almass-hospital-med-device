-- Medical Devices Follow-Up System Database Schema
-- This file contains all table CREATE statements
-- Update this file whenever you modify database structure

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  custodian_name TEXT,
  devices_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL
) STRICT;

-- Device Types table (أنواع الأجهزة الطبية)
CREATE TABLE IF NOT EXISTS device_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name_en TEXT,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL
) STRICT;

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  supplier TEXT,
  manufacturer TEXT,
  serial TEXT UNIQUE,
  department_id INTEGER,
  device_type_id INTEGER,
  supply_date TEXT,
  install_date TEXT,
  service_engineer TEXT,
  engineer_phone TEXT,
  repair_date TEXT,
  last_maintenance_date TEXT,
  next_maintenance_date TEXT,
  signature_png TEXT,
  photo_url TEXT,
  contract_photos TEXT,  -- JSON array of contract photo URLs
  manufacturer_url TEXT,
  description TEXT,
  model TEXT,
  cost REAL,
  is_under_warranty INTEGER DEFAULT 0, -- 0: No, 1: Yes
  warranty_expiry_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE SET NULL
) STRICT;

-- Routine checks table
CREATE TABLE IF NOT EXISTS routine_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL,
  check_date TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('excellent', 'good', 'poor')),
  check_type TEXT DEFAULT 'daily' CHECK(check_type IN ('daily', 'monthly')),
  criteria TEXT,  -- JSON string of CheckCriteria
  issue TEXT,
  checker_name TEXT NOT NULL,
  signature_png TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) STRICT;

-- Device Type Criteria linking table (ربط المعايير بأنواع الأجهزة)
CREATE TABLE IF NOT EXISTS device_type_criteria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  criteria_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE CASCADE,
  FOREIGN KEY (criteria_id) REFERENCES check_criteria(id) ON DELETE CASCADE,
  UNIQUE(device_type_id, criteria_id)
) STRICT;

-- Label templates table
CREATE TABLE IF NOT EXISTS label_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  json_definition TEXT NOT NULL,
  is_default INTEGER DEFAULT 0 CHECK(is_default IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL
) STRICT;

-- Users table for user management
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  privileges TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  last_login TEXT
) STRICT;

-- Check criteria table for dynamic inspection criteria
CREATE TABLE IF NOT EXISTS check_criteria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE COLLATE NOCASE,  -- English key (cleanliness, functionality, etc.)
  label_ar TEXT NOT NULL,                    -- Arabic label
  description_ar TEXT,                        -- Arabic description
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL
) STRICT;

-- Insert default criteria (initial data)
INSERT OR IGNORE INTO check_criteria (key, label_ar, description_ar, is_active, display_order, created_by) VALUES
  ('cleanliness', 'النظافة العامة', 'نظافة الجهاز والمحيط', 1, 1, 'system'),
  ('functionality', 'الأداء الوظيفي', 'عمل الجهاز بكفاءة', 1, 2, 'system'),
  ('safety', 'السلامة', 'إجراءات السلامة', 1, 3, 'system'),
  ('electrical', 'التوصيلات الكهربائية', 'سلامة الأسلاك والكابلات', 1, 4, 'system'),
  ('mechanical', 'الأجزاء الميكانيكية', 'سلامة المكونات', 1, 5, 'system'),
  ('calibration', 'المعايرة', 'دقة القياسات', 1, 6, 'system');

-- Insert default admin user
INSERT OR IGNORE INTO users (username, password_hash, name, email, role, status, privileges, created_by) 
VALUES ('admin', 'admin123456', 'Admin User', 'admin@example.com', 'admin', 'active', '["all"]', 'system');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_devices_department ON devices(department_id);
CREATE INDEX IF NOT EXISTS idx_devices_serial ON devices(serial);
CREATE INDEX IF NOT EXISTS idx_routine_checks_device ON routine_checks(device_id);
CREATE INDEX IF NOT EXISTS idx_routine_checks_date ON routine_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_check_criteria_active ON check_criteria(is_active);
CREATE INDEX IF NOT EXISTS idx_check_criteria_order ON check_criteria(display_order);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type_id);
CREATE INDEX IF NOT EXISTS idx_device_types_active ON device_types(is_active);
CREATE INDEX IF NOT EXISTS idx_device_type_criteria_type ON device_type_criteria(device_type_id);
CREATE INDEX IF NOT EXISTS idx_device_type_criteria_crit ON device_type_criteria(criteria_id);
CREATE INDEX IF NOT EXISTS idx_routine_checks_type ON routine_checks(check_type);
