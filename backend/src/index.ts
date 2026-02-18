interface Env {
  DB: D1Database;
}

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function to create JSON response
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Helper function to get user ID from headers
function getUserId(request: Request): string {
  return request.headers.get('X-Encrypted-Yw-ID') || 'anonymous';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const userId = getUserId(request);

    try {
      // Departments endpoints
      if (url.pathname === '/api/departments' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM departments ORDER BY name'
        ).all();
        return jsonResponse({ success: true, data: results });
      }

      if (url.pathname === '/api/departments' && request.method === 'POST') {
        const body = await request.json() as any;
        const { name, custodian_name } = body;
        
        const result = await env.DB.prepare(
          'INSERT INTO departments (name, custodian_name, created_by) VALUES (?, ?, ?)'
        ).bind(name, custodian_name || null, userId).run();
        
        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }

      if (url.pathname.startsWith('/api/departments/') && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const body = await request.json() as any;
        const { name, custodian_name } = body;
        
        await env.DB.prepare(
          'UPDATE departments SET name = ?, custodian_name = ? WHERE id = ?'
        ).bind(name, custodian_name || null, id).run();
        
        return jsonResponse({ success: true });
      }

      if (url.pathname.startsWith('/api/departments/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        await env.DB.prepare('DELETE FROM departments WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true });
      }

      // Devices endpoints (with server-side pagination, filtering, and sorting)
      if (url.pathname === '/api/devices' && request.method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '0');
        const limit = parseInt(url.searchParams.get('limit') || '0');
        const q = (url.searchParams.get('q') || '').trim();
        const departmentId = url.searchParams.get('department_id') || '';
        const sort = url.searchParams.get('sort') || 'recent';

        // If no pagination params, return all (backward compatible)
        if (!page && !limit) {
          const { results } = await env.DB.prepare(`
            SELECT d.*, dep.name as department_name, dt.name_ar as device_type_name
            FROM devices d
            LEFT JOIN departments dep ON d.department_id = dep.id
            LEFT JOIN device_types dt ON d.device_type_id = dt.id
            ORDER BY d.created_at DESC
          `).all();
          return jsonResponse({ success: true, data: results });
        }

        // Build WHERE conditions
        const conditions: string[] = [];
        const bindings: any[] = [];

        if (q) {
          conditions.push(`(d.name LIKE ? OR d.serial LIKE ? OR d.manufacturer LIKE ? OR d.supplier LIKE ?)`);
          const likeQ = `%${q}%`;
          bindings.push(likeQ, likeQ, likeQ, likeQ);
        }
        if (departmentId) {
          conditions.push(`d.department_id = ?`);
          bindings.push(departmentId);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Sort
        let orderClause = 'ORDER BY d.created_at DESC';
        if (sort === 'name_asc') orderClause = 'ORDER BY d.name ASC';
        else if (sort === 'name_desc') orderClause = 'ORDER BY d.name DESC';

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM devices d ${whereClause}`;
        const countStmt = env.DB.prepare(countQuery);
        const countResult = bindings.length > 0 ? await countStmt.bind(...bindings).first() : await countStmt.first();
        const total = (countResult as any)?.total || 0;

        // Get paginated data
        const actualPage = Math.max(1, page);
        const actualLimit = Math.min(Math.max(1, limit), 100);
        const offset = (actualPage - 1) * actualLimit;

        const dataQuery = `
          SELECT d.*, dep.name as department_name, dt.name_ar as device_type_name
          FROM devices d
          LEFT JOIN departments dep ON d.department_id = dep.id
          LEFT JOIN device_types dt ON d.device_type_id = dt.id
          ${whereClause}
          ${orderClause}
          LIMIT ? OFFSET ?
        `;
        const dataBindings = [...bindings, actualLimit, offset];
        const { results } = await env.DB.prepare(dataQuery).bind(...dataBindings).all();

        return jsonResponse({
          success: true,
          data: results,
          pagination: {
            page: actualPage,
            limit: actualLimit,
            total,
            totalPages: Math.ceil(total / actualLimit),
          },
        });
      }

      if (url.pathname === '/api/devices' && request.method === 'POST') {
        const body = await request.json() as any;
        const {
          name, supplier, manufacturer, serial, department_id,
          supply_date, install_date, service_engineer, repair_date,
          signature_png, photo_url, manufacturer_url, description, model,
          device_type_id, engineer_phone, next_maintenance_date, last_maintenance_date, contract_photos,
          cost, is_under_warranty, warranty_expiry_date
        } = body;

        const result = await env.DB.prepare(`
          INSERT INTO devices (
            name, supplier, manufacturer, serial, department_id, supply_date,
            install_date, service_engineer, repair_date, signature_png,
            photo_url, manufacturer_url, description, model, device_type_id,
            engineer_phone, next_maintenance_date, last_maintenance_date, contract_photos,
            cost, is_under_warranty, warranty_expiry_date, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          name, supplier, manufacturer, serial, department_id, supply_date,
          install_date, service_engineer, repair_date, signature_png,
          photo_url, manufacturer_url, description, model, device_type_id || null,
          engineer_phone || null, next_maintenance_date || null, last_maintenance_date || null, contract_photos || null,
          cost || null, is_under_warranty || 0, warranty_expiry_date || null, userId
        ).run();

        if (department_id) {
          await env.DB.prepare(
            'UPDATE departments SET devices_count = devices_count + 1 WHERE id = ?'
          ).bind(department_id).run();
        }

        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }

      // Search device by serial number (for QR scan) - must be before generic /api/devices/:id
      if (url.pathname === '/api/devices/search' && request.method === 'GET') {
        const serial = url.searchParams.get('serial');
        if (!serial) {
          return jsonResponse({ error: 'Serial parameter is required' }, 400);
        }
        
        // Case-insensitive search with TRIM and COLLATE NOCASE
        const device = await env.DB.prepare(`
          SELECT d.*, dep.name as department_name, dt.name_ar as device_type_name
          FROM devices d
          LEFT JOIN departments dep ON d.department_id = dep.id
          LEFT JOIN device_types dt ON d.device_type_id = dt.id
          WHERE TRIM(d.serial) = TRIM(?) COLLATE NOCASE
          LIMIT 1
        `).bind(serial.trim()).first();
        
        if (!device) {
          // Try partial match as fallback
          const partialDevice = await env.DB.prepare(`
            SELECT d.*, dep.name as department_name, dt.name_ar as device_type_name
            FROM devices d
            LEFT JOIN departments dep ON d.department_id = dep.id
            LEFT JOIN device_types dt ON d.device_type_id = dt.id
            WHERE TRIM(d.serial) LIKE ? COLLATE NOCASE
            LIMIT 1
          `).bind(`%${serial.trim()}%`).first();
          
          if (partialDevice) {
            return jsonResponse({ success: true, data: partialDevice });
          }
          return jsonResponse({ error: 'Device not found' }, 404);
        }
        
        return jsonResponse({ success: true, data: device });
      }

      if (url.pathname.startsWith('/api/devices/') && request.method === 'GET') {
        const id = url.pathname.split('/').pop();
        const device = await env.DB.prepare(`
          SELECT d.*, dep.name as department_name, dt.name_ar as device_type_name
          FROM devices d
          LEFT JOIN departments dep ON d.department_id = dep.id
          LEFT JOIN device_types dt ON d.device_type_id = dt.id
          WHERE d.id = ?
        `).bind(id).first();
        
        if (!device) {
          return jsonResponse({ error: 'Device not found' }, 404);
        }
        
        return jsonResponse({ success: true, data: device });
      }

      if (url.pathname.startsWith('/api/devices/') && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const body = await request.json() as any;
        const {
          name, supplier, manufacturer, serial, department_id,
          supply_date, install_date, service_engineer, repair_date,
          signature_png, photo_url, manufacturer_url, description, model,
          device_type_id, engineer_phone, next_maintenance_date, last_maintenance_date, contract_photos,
          cost, is_under_warranty, warranty_expiry_date
        } = body;

        await env.DB.prepare(`
          UPDATE devices SET
            name = ?, supplier = ?, manufacturer = ?, serial = ?, department_id = ?,
            supply_date = ?, install_date = ?, service_engineer = ?, repair_date = ?,
            signature_png = ?, photo_url = ?, manufacturer_url = ?, description = ?, model = ?,
            device_type_id = ?, engineer_phone = ?, next_maintenance_date = ?, last_maintenance_date = ?, contract_photos = ?,
            cost = ?, is_under_warranty = ?, warranty_expiry_date = ?
          WHERE id = ?
        `).bind(
          name, supplier, manufacturer, serial, department_id,
          supply_date, install_date, service_engineer, repair_date,
          signature_png, photo_url, manufacturer_url, description, model,
          device_type_id || null, engineer_phone || null, next_maintenance_date || null, last_maintenance_date || null, contract_photos || null,
          cost || null, is_under_warranty || 0, warranty_expiry_date || null, id
        ).run();

        return jsonResponse({ success: true });
      }

      if (url.pathname.startsWith('/api/devices/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        const device = await env.DB.prepare('SELECT department_id FROM devices WHERE id = ?').bind(id).first();
        
        await env.DB.prepare('DELETE FROM devices WHERE id = ?').bind(id).run();
        
        if (device && device.department_id) {
          await env.DB.prepare(
            'UPDATE departments SET devices_count = devices_count - 1 WHERE id = ?'
          ).bind(device.department_id).run();
        }
        
        return jsonResponse({ success: true });
      }

      // Checks endpoints
      if (url.pathname === '/api/checks' && request.method === 'GET') {
        const deviceId = url.searchParams.get('device_id');
        let query = `
          SELECT c.*, d.name as device_name, d.serial as device_serial, d.department_id
          FROM routine_checks c
          LEFT JOIN devices d ON c.device_id = d.id
        `;
        
        if (deviceId) {
          query += ' WHERE c.device_id = ?';
          const { results } = await env.DB.prepare(query + ' ORDER BY c.check_date DESC').bind(deviceId).all();
          return jsonResponse({ success: true, data: results });
        } else {
          const { results } = await env.DB.prepare(query + ' ORDER BY c.check_date DESC').all();
          return jsonResponse({ success: true, data: results });
        }
      }

      if (url.pathname === '/api/checks' && request.method === 'POST') {
        const body = await request.json() as any;
        const { device_id, check_date, state, issue, checker_name, signature_png, check_type, criteria } = body;

        const result = await env.DB.prepare(`
          INSERT INTO routine_checks (
            device_id, check_date, state, issue, checker_name, signature_png, check_type, criteria, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(device_id, check_date, state, issue, checker_name, signature_png, check_type || 'daily', criteria || null, userId).run();

        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }

      // Templates endpoints
      if (url.pathname === '/api/templates' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM label_templates ORDER BY name'
        ).all();
        return jsonResponse({ success: true, data: results });
      }

      if (url.pathname === '/api/templates' && request.method === 'POST') {
        const body = await request.json() as any;
        const { name, json_definition, is_default } = body;

        const result = await env.DB.prepare(`
          INSERT INTO label_templates (name, json_definition, is_default, created_by)
          VALUES (?, ?, ?, ?)
        `).bind(name, json_definition, is_default ? 1 : 0, userId).run();

        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }

      // Reports endpoint - aggregated data computed in SQL
      if (url.pathname === '/api/reports' && request.method === 'GET') {
        const period = url.searchParams.get('period') || 'month';
        const departmentId = url.searchParams.get('department_id') || 'all';

        // Calculate start date based on period
        const now = new Date();
        let startDate = new Date();
        switch (period) {
          case 'week': startDate.setDate(now.getDate() - 7); break;
          case 'month': startDate.setMonth(now.getMonth() - 1); break;
          case 'quarter': startDate.setMonth(now.getMonth() - 3); break;
          case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
        }
        const startDateStr = startDate.toISOString().split('T')[0];

        // Build department filter
        const deptFilter = departmentId !== 'all' ? 'AND d.department_id = ?' : '';
        const deptBindings = departmentId !== 'all' ? [departmentId] : [];

        // 1. Summary stats
        const summaryQuery = `
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN c.state = 'excellent' THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN c.state = 'good' THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN c.state = 'poor' THEN 1 ELSE 0 END) as poor
          FROM routine_checks c
          LEFT JOIN devices d ON c.device_id = d.id
          WHERE c.check_date >= ? ${deptFilter}
        `;
        const summaryStmt = env.DB.prepare(summaryQuery);
        const summary = await summaryStmt.bind(startDateStr, ...deptBindings).first() as any;

        // 2. Department performance
        const deptPerfQuery = `
          SELECT 
            dep.name,
            COUNT(DISTINCT d2.id) as devices,
            SUM(CASE WHEN c.state = 'excellent' THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN c.state = 'good' THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN c.state = 'poor' THEN 1 ELSE 0 END) as poor
          FROM departments dep
          LEFT JOIN devices d2 ON d2.department_id = dep.id
          LEFT JOIN routine_checks c ON c.device_id = d2.id AND c.check_date >= ?
          GROUP BY dep.id, dep.name
          ORDER BY dep.name
        `;
        const { results: deptPerf } = await env.DB.prepare(deptPerfQuery).bind(startDateStr).all();

        // 3. Timeline data (grouped by date)
        const timelineQuery = `
          SELECT 
            DATE(c.check_date) as date,
            SUM(CASE WHEN c.state = 'excellent' THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN c.state = 'good' THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN c.state = 'poor' THEN 1 ELSE 0 END) as poor
          FROM routine_checks c
          LEFT JOIN devices d ON c.device_id = d.id
          WHERE c.check_date >= ? ${deptFilter}
          GROUP BY DATE(c.check_date)
          ORDER BY date
        `;
        const timelineStmt = env.DB.prepare(timelineQuery);
        const { results: timeline } = await timelineStmt.bind(startDateStr, ...deptBindings).all();

        // 4. Devices distribution by department
        const distQuery = `
          SELECT dep.name, COUNT(d.id) as value
          FROM departments dep
          LEFT JOIN devices d ON d.department_id = dep.id
          GROUP BY dep.id, dep.name
          HAVING COUNT(d.id) > 0
          ORDER BY dep.name
        `;
        const { results: distribution } = await env.DB.prepare(distQuery).all();

        // 5. Departments list (for filter dropdown)
        const { results: departments } = await env.DB.prepare('SELECT id, name FROM departments ORDER BY name').all();

        return jsonResponse({
          success: true,
          data: {
            summary: {
              total: summary?.total || 0,
              excellent: summary?.excellent || 0,
              good: summary?.good || 0,
              poor: summary?.poor || 0,
            },
            departmentPerformance: deptPerf,
            timeline,
            devicesDistribution: distribution,
            departments,
          },
        });
      }

      // Maintenance notifications (due maintenance)
      // Summary counts for bell badge
      if (url.pathname === '/api/maintenance/summary' && request.method === 'GET') {
        const days = parseInt(url.searchParams.get('days') || '7');
        const today = new Date().toISOString().split('T')[0];
        const daysClamped = Math.min(Math.max(days, 1), 365);

        const summary = await env.DB.prepare(`
          SELECT
            SUM(CASE WHEN d.next_maintenance_date IS NULL OR TRIM(d.next_maintenance_date) = '' THEN 1 ELSE 0 END) as noDate,
            SUM(CASE WHEN d.next_maintenance_date IS NOT NULL AND TRIM(d.next_maintenance_date) != '' AND d.next_maintenance_date < ? THEN 1 ELSE 0 END) as overdue,
            SUM(CASE WHEN d.next_maintenance_date IS NOT NULL AND TRIM(d.next_maintenance_date) != '' AND d.next_maintenance_date = ? THEN 1 ELSE 0 END) as dueToday,
            SUM(CASE WHEN d.next_maintenance_date IS NOT NULL AND TRIM(d.next_maintenance_date) != '' AND d.next_maintenance_date > ? AND d.next_maintenance_date <= date(?, '+' || ? || ' day') THEN 1 ELSE 0 END) as dueSoon
          FROM devices d
        `).bind(today, today, today, today, daysClamped).first() as any;

        const data = {
          overdue: summary?.overdue || 0,
          dueToday: summary?.dueToday || 0,
          dueSoon: summary?.dueSoon || 0,
          noDate: summary?.noDate || 0,
          days: daysClamped,
          totalDue: (summary?.overdue || 0) + (summary?.dueToday || 0) + (summary?.dueSoon || 0),
        };

        return jsonResponse({ success: true, data });
      }

      // Due maintenance list (lightweight list for popup)
      if (url.pathname === '/api/maintenance/due' && request.method === 'GET') {
        const days = parseInt(url.searchParams.get('days') || '7');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const departmentId = url.searchParams.get('department_id') || '';
        const deviceTypeId = url.searchParams.get('device_type_id') || '';
        const status = (url.searchParams.get('status') || '').trim();
        const includeNoDate = (url.searchParams.get('include_no_date') || '0') === '1';

        const today = new Date().toISOString().split('T')[0];
        const daysClamped = Math.min(Math.max(days, 1), 365);
        const limitClamped = Math.min(Math.max(limit, 1), 50);
        const offsetClamped = Math.max(offset, 0);

        const conditions: string[] = [];
        const bindings: any[] = [];

        // Only due items by default
        // overdue / due_today / due_soon within N days OR no_date if include
        const dueCondition = includeNoDate
          ? `( (d.next_maintenance_date IS NULL OR TRIM(d.next_maintenance_date) = '')
              OR (d.next_maintenance_date IS NOT NULL AND TRIM(d.next_maintenance_date) != '' AND d.next_maintenance_date <= date(?, '+' || ? || ' day')) )`
          : `( d.next_maintenance_date IS NOT NULL AND TRIM(d.next_maintenance_date) != '' AND d.next_maintenance_date <= date(?, '+' || ? || ' day') )`;
        conditions.push(dueCondition);
        bindings.push(today, daysClamped);

        if (departmentId) {
          conditions.push('d.department_id = ?');
          bindings.push(departmentId);
        }

        if (deviceTypeId) {
          conditions.push('d.device_type_id = ?');
          bindings.push(deviceTypeId);
        }

        if (status) {
          // status in [overdue, due_today, due_soon, no_date]
          conditions.push(`(
            CASE
              WHEN d.next_maintenance_date IS NULL OR TRIM(d.next_maintenance_date) = '' THEN 'no_date'
              WHEN d.next_maintenance_date < ? THEN 'overdue'
              WHEN d.next_maintenance_date = ? THEN 'due_today'
              WHEN d.next_maintenance_date <= date(?, '+' || ? || ' day') THEN 'due_soon'
              ELSE 'not_due'
            END
          ) = ?`);
          bindings.push(today, today, today, daysClamped, status);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countStmt = env.DB.prepare(`SELECT COUNT(*) as total FROM devices d ${whereClause}`);
        const countRow = await countStmt.bind(...bindings).first() as any;
        const total = countRow?.total || 0;

        const dataStmt = env.DB.prepare(`
          SELECT
            d.id,
            d.name,
            d.serial,
            dep.name as department_name,
            dt.name_ar as device_type_name,
            d.department_id,
            d.device_type_id,
            d.next_maintenance_date,
            d.last_maintenance_date,
            d.engineer_phone,
            d.service_engineer,
            CASE
              WHEN d.next_maintenance_date IS NULL OR TRIM(d.next_maintenance_date) = '' THEN 'no_date'
              WHEN d.next_maintenance_date < ? THEN 'overdue'
              WHEN d.next_maintenance_date = ? THEN 'due_today'
              WHEN d.next_maintenance_date <= date(?, '+' || ? || ' day') THEN 'due_soon'
              ELSE 'not_due'
            END as status,
            CAST(ROUND(julianday(?) - julianday(d.next_maintenance_date)) AS INTEGER) as days_overdue
          FROM devices d
          LEFT JOIN departments dep ON d.department_id = dep.id
          LEFT JOIN device_types dt ON d.device_type_id = dt.id
          ${whereClause}
          ORDER BY
            CASE
              WHEN d.next_maintenance_date IS NULL OR TRIM(d.next_maintenance_date) = '' THEN 3
              WHEN d.next_maintenance_date < ? THEN 0
              WHEN d.next_maintenance_date = ? THEN 1
              ELSE 2
            END,
            (julianday(?) - julianday(d.next_maintenance_date)) DESC
          LIMIT ? OFFSET ?
        `);

        const dataBindings = [
          // SELECT placeholders
          today, today, today, daysClamped, today,
          // WHERE placeholders
          ...bindings,
          // ORDER BY placeholders
          today, today, today,
          // LIMIT/OFFSET
          limitClamped, offsetClamped,
        ];

        const { results } = await dataStmt.bind(...dataBindings).all();

        return jsonResponse({
          success: true,
          data: {
            items: results,
            pagination: {
              total,
              limit: limitClamped,
              offset: offsetClamped,
            },
          },
        });
      }

      // Stats endpoint
      if (url.pathname === '/api/stats' && request.method === 'GET') {
        const devicesCount = await env.DB.prepare('SELECT COUNT(*) as count FROM devices').first();
        const checksCount = await env.DB.prepare('SELECT COUNT(*) as count FROM routine_checks').first();
        const departmentsCount = await env.DB.prepare('SELECT COUNT(*) as count FROM departments').first();
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
        
        const recentChecks = await env.DB.prepare(`
          SELECT state, COUNT(*) as count
          FROM routine_checks
          WHERE check_date >= ?
          GROUP BY state
        `).bind(dateStr).all();

        return jsonResponse({
          success: true,
          data: {
            devices: devicesCount.count,
            checks: checksCount.count,
            departments: departmentsCount.count,
            recentChecksByState: recentChecks.results,
          },
        });
      }

      // Users management endpoints
      if (url.pathname === '/api/users' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT id, username, name, email, role, status, privileges, created_at, last_login
          FROM users
          ORDER BY created_at DESC
        `).all();
        return jsonResponse({ success: true, data: results });
      }

      if (url.pathname === '/api/users' && request.method === 'POST') {
        const body = await request.json() as any;
        const { username, password, name, email, role = 'user', privileges = '[]' } = body;
        
        // Hash password (simple implementation - use bcrypt in production)
        const passwordHash = password; // In production: await bcrypt.hash(password, 10)
        
        const result = await env.DB.prepare(
          'INSERT INTO users (username, password_hash, name, email, role, privileges, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(username, passwordHash, name, email, role, privileges, userId).run();
        
        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }

      if (url.pathname.startsWith('/api/users/') && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const body = await request.json() as any;
        const { name, email, role, status, privileges } = body;
        
        await env.DB.prepare(
          'UPDATE users SET name = ?, email = ?, role = ?, status = ?, privileges = ? WHERE id = ?'
        ).bind(name, email, role, status, privileges, id).run();
        
        return jsonResponse({ success: true });
      }

      if (url.pathname.startsWith('/api/users/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true });
      }

      // Login endpoint
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const body = await request.json() as any;
        const { username, password } = body;
        
        const user = await env.DB.prepare(
          'SELECT id, username, name, email, role, status, privileges FROM users WHERE username = ? AND password_hash = ?'
        ).bind(username, password).first();
        
        if (!user) {
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }
        
        if (user.status !== 'active') {
          return jsonResponse({ error: 'Account is inactive' }, 403);
        }
        
        // Update last login
        await env.DB.prepare(
          'UPDATE users SET last_login = datetime(\'now\') WHERE id = ?'
        ).bind(user.id).run();
        
        return jsonResponse({ success: true, data: { user } });
      }

      // Contact form endpoint - send email
      if (url.pathname === '/api/send-contact' && request.method === 'POST') {
        const body = await request.json() as any;
        const { name, email, subject, message } = body;
        
        // Validate required fields
        if (!name || !email || !subject || !message) {
          return jsonResponse({ error: 'جميع الحقول مطلوبة' }, 400);
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return jsonResponse({ error: 'البريد الإلكتروني غير صحيح' }, 400);
        }

        // In production, you would use email service here (SendGrid, Mailgun, etc.)
        // For now, we'll log the message and return success
        console.log('Contact form submission:', {
          to: 'kkaarrkkaarr@gmail.com',
          from: email,
          name,
          subject,
          message,
          timestamp: new Date().toISOString(),
        });

        // TODO: Implement actual email sending via email service API
        // Example with SendGrid or similar service:
        // await sendEmail({
        //   to: 'kkaarrkkaarr@gmail.com',
        //   from: email,
        //   subject: `رسالة من: ${name} - ${subject}`,
        //   html: `
        //     <h3>رسالة جديدة من نموذج الاتصال</h3>
        //     <p><strong>الاسم:</strong> ${name}</p>
        //     <p><strong>البريد الإلكتروني:</strong> ${email}</p>
        //     <p><strong>الموضوع:</strong> ${subject}</p>
        //     <p><strong>الرسالة:</strong></p>
        //     <p>${message}</p>
        //   `,
        // });

        return jsonResponse({ 
          success: true, 
          message: 'تم إرسال رسالتك بنجاح!' 
        });
      }

      // Check criteria management endpoints
      if (url.pathname === '/api/criteria' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT * FROM check_criteria 
          WHERE is_active = 1 
          ORDER BY display_order, id
        `).all();
        return jsonResponse({ success: true, data: results });
      }

      if (url.pathname === '/api/criteria' && request.method === 'POST') {
        const body = await request.json() as any;
        const { key, label_ar, description_ar, display_order = 0 } = body;
        
        // Validate required fields
        if (!key || !label_ar) {
          return jsonResponse({ error: 'المفتاح والتسمية مطلوبان' }, 400);
        }
        
        // Check if key already exists
        const existing = await env.DB.prepare(
          'SELECT id FROM check_criteria WHERE key = ? COLLATE NOCASE'
        ).bind(key).first();
        
        if (existing) {
          return jsonResponse({ 
            error: 'المفتاح موجود بالفعل', 
            details: 'يجب استخدام مفتاح فريد لكل معيار فحص' 
          }, 409);
        }
        
        const result = await env.DB.prepare(`
          INSERT INTO check_criteria (key, label_ar, description_ar, display_order, created_by)
          VALUES (?, ?, ?, ?, ?)
        `).bind(key, label_ar, description_ar, display_order, userId).run();
        
        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }

      if (url.pathname.startsWith('/api/criteria/') && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const body = await request.json() as any;
        const { key, label_ar, description_ar, display_order, is_active } = body;
        
        // Check if key already exists (excluding current record)
        const existing = await env.DB.prepare(
          'SELECT id FROM check_criteria WHERE key = ? COLLATE NOCASE AND id != ?'
        ).bind(key, id).first();
        
        if (existing) {
          return jsonResponse({ 
            error: 'المفتاح موجود بالفعل', 
            details: 'يجب استخدام مفتاح فريد لكل معيار فحص' 
          }, 409);
        }
        
        await env.DB.prepare(`
          UPDATE check_criteria 
          SET key = ?, label_ar = ?, description_ar = ?, display_order = ?, is_active = ?
          WHERE id = ?
        `).bind(key, label_ar, description_ar, display_order, is_active, id).run();
        
        return jsonResponse({ success: true });
      }

      if (url.pathname.startsWith('/api/criteria/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        
        // Soft delete by setting is_active to 0
        await env.DB.prepare(
          'UPDATE check_criteria SET is_active = 0 WHERE id = ?'
        ).bind(id).run();
        
        return jsonResponse({ success: true });
      }

      // Device Types endpoints
      if (url.pathname === '/api/device-types' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT * FROM device_types WHERE is_active = 1 ORDER BY name_ar
        `).all();
        return jsonResponse({ success: true, data: results });
      }

      if (url.pathname === '/api/device-types' && request.method === 'POST') {
        const body = await request.json() as any;
        const { name_ar, name_en, description } = body;
        
        if (!name_ar) {
          return jsonResponse({ error: 'اسم الجهاز بالعربية مطلوب' }, 400);
        }
        
        const result = await env.DB.prepare(`
          INSERT INTO device_types (name_ar, name_en, description, created_by)
          VALUES (?, ?, ?, ?)
        `).bind(name_ar, name_en || null, description || null, userId).run();
        
        return jsonResponse({ success: true, id: result.meta.last_row_id });
      }

      if (url.pathname.startsWith('/api/device-types/') && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const body = await request.json() as any;
        const { name_ar, name_en, description } = body;
        
        await env.DB.prepare(`
          UPDATE device_types SET name_ar = ?, name_en = ?, description = ? WHERE id = ?
        `).bind(name_ar, name_en || null, description || null, id).run();
        
        return jsonResponse({ success: true });
      }

      if (url.pathname.startsWith('/api/device-types/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        await env.DB.prepare('UPDATE device_types SET is_active = 0 WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true });
      }

      // Device Type Criteria endpoints (linking device types to criteria)
      if (url.pathname.match(/^\/api\/device-types\/\d+\/criteria$/) && request.method === 'GET') {
        const id = url.pathname.split('/')[3];
        const { results } = await env.DB.prepare(`
          SELECT c.* FROM check_criteria c
          JOIN device_type_criteria dtc ON c.id = dtc.criteria_id
          WHERE dtc.device_type_id = ? AND c.is_active = 1
          ORDER BY c.display_order
        `).bind(id).all();
        return jsonResponse({ success: true, data: results });
      }

      if (url.pathname.match(/^\/api\/device-types\/\d+\/criteria$/) && request.method === 'POST') {
        const id = url.pathname.split('/')[3];
        const body = await request.json() as any;
        const { criteria_ids } = body;
        
        // Delete existing relationships
        await env.DB.prepare('DELETE FROM device_type_criteria WHERE device_type_id = ?').bind(id).run();
        
        // Insert new relationships
        for (const criteriaId of criteria_ids) {
          await env.DB.prepare(
            'INSERT INTO device_type_criteria (device_type_id, criteria_id) VALUES (?, ?)'
          ).bind(id, criteriaId).run();
        }
        
        return jsonResponse({ success: true });
      }

      return jsonResponse({ error: 'Not found' }, 404);
      
    } catch (error: any) {
      console.error('API Error:', error);
      return jsonResponse({ error: error.message || 'Internal server error' }, 500);
    }
  },
};
