import { useState, useEffect } from "react";
import { usersApi, criteriaApi, deviceTypesApi } from "../api/api";
import Modal from "../components/Modal";
import CriteriaForm from "../components/AdminCriteria/CriteriaForm";
import CriteriaList from "../components/AdminCriteria/CriteriaList";

// Define app features/privileges
const APP_FEATURES = [
  { id: 'view_devices', label: 'عرض الأجهزة' },
  { id: 'add_devices', label: 'إضافة أجهزة' },
  { id: 'edit_devices', label: 'تعديل أجهزة' },
  { id: 'delete_devices', label: 'حذف أجهزة' },
  { id: 'view_checks', label: 'عرض الفحوصات' },
  { id: 'add_checks', label: 'إضافة فحوصات' },
  { id: 'view_reports', label: 'عرض التقارير' },
  { id: 'manage_departments', label: 'إدارة الأقسام' },
  { id: 'manage_users', label: 'إدارة المستخدمين' },
];

export default function AdminControl() {
  // Tabs state
  const [activeTab, setActiveTab] = useState<'users' | 'criteria' | 'deviceTypes'>('users');
  
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "user",
    privileges: [] as string[],
  });

  // Criteria state
  const [criteria, setCriteria] = useState<any[]>([]);
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [showEditCriteriaModal, setShowEditCriteriaModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<any>(null);
  const [criteriaLoading, setCriteriaLoading] = useState(false);

  // Device Types state
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [showDeviceTypeModal, setShowDeviceTypeModal] = useState(false);
  const [showEditDeviceTypeModal, setShowEditDeviceTypeModal] = useState(false);
  const [editingDeviceType, setEditingDeviceType] = useState<any>(null);
  const [newDeviceType, setNewDeviceType] = useState({ name_ar: "", name_en: "", description: "" });
  const [deviceTypeLoading, setDeviceTypeLoading] = useState(false);
  const [showCriteriaSelectModal, setShowCriteriaSelectModal] = useState(false);
  const [selectedDeviceTypeForCriteria, setSelectedDeviceTypeForCriteria] = useState<any>(null);
  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<number[]>([]);

  useEffect(() => {
    loadUsers();
    loadCriteria();
    loadDeviceTypes();
  }, []);

  const loadDeviceTypes = async () => {
    try {
      setDeviceTypeLoading(true);
      const data = await deviceTypesApi.getAll();
      setDeviceTypes(data);
    } catch (error) {
      console.error('Failed to load device types:', error);
    } finally {
      setDeviceTypeLoading(false);
    }
  };

  const handleAddDeviceType = async () => {
    if (!newDeviceType.name_ar.trim()) {
      alert("اسم الجهاز بالعربية مطلوب");
      return;
    }

    try {
      await deviceTypesApi.create(newDeviceType);
      setNewDeviceType({ name_ar: "", name_en: "", description: "" });
      setShowDeviceTypeModal(false);
      setSuccessMessage("تم إضافة نوع الجهاز بنجاح!");
      setShowSuccessModal(true);
      await loadDeviceTypes();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في إضافة نوع الجهاز'}`);
    }
  };

  const handleEditDeviceType = async () => {
    if (!editingDeviceType || !editingDeviceType.name_ar.trim()) {
      alert("اسم الجهاز بالعربية مطلوب");
      return;
    }

    try {
      await deviceTypesApi.update(editingDeviceType.id, {
        name_ar: editingDeviceType.name_ar,
        name_en: editingDeviceType.name_en,
        description: editingDeviceType.description,
      });
      setEditingDeviceType(null);
      setShowEditDeviceTypeModal(false);
      setSuccessMessage("تم تحديث نوع الجهاز بنجاح!");
      setShowSuccessModal(true);
      await loadDeviceTypes();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في تحديث نوع الجهاز'}`);
    }
  };

  const handleDeleteDeviceType = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا النوع؟")) return;

    try {
      await deviceTypesApi.delete(id);
      setSuccessMessage("تم حذف نوع الجهاز بنجاح!");
      setShowSuccessModal(true);
      await loadDeviceTypes();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في حذف نوع الجهاز'}`);
    }
  };

  const openCriteriaSelect = async (deviceType: any) => {
    setSelectedDeviceTypeForCriteria(deviceType);
    try {
      const typeCriteria = await deviceTypesApi.getCriteria(deviceType.id);
      setSelectedCriteriaIds(typeCriteria.map((c: any) => c.id));
    } catch {
      setSelectedCriteriaIds([]);
    }
    setShowCriteriaSelectModal(true);
  };

  const handleSaveCriteriaForType = async () => {
    if (!selectedDeviceTypeForCriteria) return;
    try {
      await deviceTypesApi.setCriteria(selectedDeviceTypeForCriteria.id, selectedCriteriaIds);
      setShowCriteriaSelectModal(false);
      setSelectedDeviceTypeForCriteria(null);
      setSelectedCriteriaIds([]);
      setSuccessMessage("تم حفظ المعايير بنجاح!");
      setShowSuccessModal(true);
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في حفظ المعايير'}`);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data.map(user => ({
        ...user,
        privileges: user.privileges ? JSON.parse(user.privileges) : []
      })));
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim()) {
      alert("يجب إدخال اسم المستخدم وكلمة المرور والاسم");
      return;
    }

    try {
      await usersApi.create({
        ...newUser,
        privileges: JSON.stringify(newUser.privileges)
      });
      setNewUser({ username: "", password: "", name: "", email: "", role: "user", privileges: [] });
      setShowAddModal(false);
      setSuccessMessage("تم إضافة المستخدم بنجاح!");
      setShowSuccessModal(true);
      await loadUsers();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في إضافة المستخدم'}`);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      await usersApi.update(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status,
        privileges: JSON.stringify(editingUser.privileges)
      });
      setEditingUser(null);
      setShowEditModal(false);
      setSuccessMessage("تم تحديث المستخدم بنجاح!");
      setShowSuccessModal(true);
      await loadUsers();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في تحديث المستخدم'}`);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;

    try {
      await usersApi.delete(id);
      setSuccessMessage("تم حذف المستخدم بنجاح!");
      setShowSuccessModal(true);
      await loadUsers();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في حذف المستخدم'}`);
    }
  };

  const togglePrivilege = (privileges: string[], privilegeId: string) => {
    if (privileges.includes(privilegeId)) {
      return privileges.filter(p => p !== privilegeId);
    } else {
      return [...privileges, privilegeId];
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? 'مدير' : 'مستخدم';
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'نشط' : 'معطل';
  };

  // Criteria functions
  const loadCriteria = async () => {
    try {
      setCriteriaLoading(true);
      const data = await criteriaApi.getAll();
      setCriteria(data);
    } catch (error) {
      console.error('Failed to load criteria:', error);
      alert('فشل تحميل المعايير');
    } finally {
      setCriteriaLoading(false);
    }
  };

  const handleAddCriteria = async (newCriteria: any) => {
    try {
      await criteriaApi.create(newCriteria);
      setShowCriteriaForm(false);
      setSuccessMessage("تم إضافة المعيار بنجاح!");
      setShowSuccessModal(true);
      await loadCriteria();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في إضافة المعيار'}`);
    }
  };

  const handleEditCriteria = (criteria: any) => {
    setEditingCriteria({
      id: criteria.id,
      key: criteria.key,
      label_ar: criteria.label_ar,
      description_ar: criteria.description_ar || "",
      display_order: criteria.display_order || 0,
    });
    setShowEditCriteriaModal(true);
  };

  const handleUpdateCriteria = async () => {
    if (!editingCriteria || !editingCriteria.key.trim() || !editingCriteria.label_ar.trim()) {
      alert("المفتاح والتسمية مطلوبان");
      return;
    }

    try {
      await criteriaApi.update(editingCriteria.id, {
        key: editingCriteria.key,
        label_ar: editingCriteria.label_ar,
        description_ar: editingCriteria.description_ar,
        display_order: editingCriteria.display_order,
        is_active: 1,
      });
      setEditingCriteria(null);
      setShowEditCriteriaModal(false);
      setSuccessMessage("تم تحديث المعيار بنجاح!");
      setShowSuccessModal(true);
      await loadCriteria();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في تحديث المعيار'}`);
    }
  };

  const handleDeleteCriteria = async (id: number) => {
    try {
      await criteriaApi.delete(id);
      setSuccessMessage("تم حذف المعيار بنجاح!");
      setShowSuccessModal(true);
      await loadCriteria();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في حذف المعيار'}`);
    }
  };

  if (loading || criteriaLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" dir="rtl">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              إدارة المستخدمين
            </button>
            <button
              onClick={() => setActiveTab('criteria')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'criteria'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              إدارة المعايير التصنيفية
            </button>
            <button
              onClick={() => setActiveTab('deviceTypes')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'deviceTypes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              أنواع الأجهزة الطبية
            </button>
          </div>
        </div>
        
        {activeTab === 'users' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إضافة مستخدم
          </button>
        )}
        
        {activeTab === 'criteria' && (
          <button
            onClick={() => setShowCriteriaForm(!showCriteriaForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showCriteriaForm ? 'إلغاء' : 'إضافة معيار'}
          </button>
        )}
        
        {activeTab === 'deviceTypes' && (
          <button
            onClick={() => setShowDeviceTypeModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إضافة نوع جهاز
          </button>
        )}
      </div>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="نجاح"
        message={successMessage}
        type="success"
      />

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">إضافة مستخدم جديد</h3>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المستخدم *
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="الاسم الكامل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الصلاحية
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">مستخدم</option>
                  <option value="admin">مدير</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  صلاحيات الوصول
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                  {APP_FEATURES.map((feature) => (
                    <label key={feature.id} className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={newUser.privileges.includes(feature.id)}
                        onChange={() => setNewUser({
                          ...newUser,
                          privileges: togglePrivilege(newUser.privileges, feature.id)
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إضافة
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewUser({ username: "", password: "", name: "", email: "", role: "user", privileges: [] });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">تعديل المستخدم</h3>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={editingUser.username}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={editingUser.email || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الصلاحية
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">مستخدم</option>
                  <option value="admin">مدير</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحالة
                </label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">نشط</option>
                  <option value="inactive">معطل</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  صلاحيات الوصول
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                  {APP_FEATURES.map((feature) => (
                    <label key={feature.id} className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={editingUser.privileges.includes(feature.id)}
                        onChange={() => setEditingUser({
                          ...editingUser,
                          privileges: togglePrivilege(editingUser.privileges, feature.id)
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                حفظ
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'users' && (
        <>
          {/* Users Table */}
          {users.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">لا يوجد مستخدمون</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">اسم المستخدم</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">الاسم</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">البريد الإلكتروني</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">الصلاحية</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">الحالة</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">آخر دخول</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{user.username}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email || "—"}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                            {getRoleText(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                            {getStatusText(user.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.last_login ? new Date(user.last_login).toLocaleDateString('ar-EG') : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowEditModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-800 font-medium"
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
            </div>
          )}
        </>
      )}

      {activeTab === 'criteria' && (
        <>
          {showCriteriaForm && (
            <CriteriaForm
              onSubmit={handleAddCriteria}
              onCancel={() => setShowCriteriaForm(false)}
            />
          )}
          <CriteriaList
            criteria={criteria}
            onEdit={handleEditCriteria}
            onDelete={handleDeleteCriteria}
          />
          
          {/* Edit Criteria Modal */}
          {showEditCriteriaModal && editingCriteria && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">تعديل المعيار</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المفتاح (بالإنجليزية) *
                    </label>
                    <input
                      type="text"
                      value={editingCriteria.key}
                      onChange={(e) => setEditingCriteria({ ...editingCriteria, key: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      التسمية بالعربية *
                    </label>
                    <input
                      type="text"
                      value={editingCriteria.label_ar}
                      onChange={(e) => setEditingCriteria({ ...editingCriteria, label_ar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الوصف بالعربية
                    </label>
                    <input
                      type="text"
                      value={editingCriteria.description_ar}
                      onChange={(e) => setEditingCriteria({ ...editingCriteria, description_ar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الترتيب
                    </label>
                    <input
                      type="number"
                      value={editingCriteria.display_order}
                      onChange={(e) => setEditingCriteria({ ...editingCriteria, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleUpdateCriteria}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => {
                      setShowEditCriteriaModal(false);
                      setEditingCriteria(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Device Types Tab */}
      {activeTab === 'deviceTypes' && (
        <>
          {/* Device Types Table */}
          {deviceTypes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">لا توجد أنواع أجهزة</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">الاسم بالعربية</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">الاسم بالإنجليزية</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">الوصف</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deviceTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{type.name_ar}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{type.name_en || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{type.description || "—"}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openCriteriaSelect(type)}
                            className="text-purple-600 hover:text-purple-800 font-medium"
                          >
                            المعايير
                          </button>
                          <button
                            onClick={() => {
                              setEditingDeviceType({ ...type });
                              setShowEditDeviceTypeModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteDeviceType(type.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
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
          )}

          {/* Add Device Type Modal */}
          {showDeviceTypeModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">إضافة نوع جهاز جديد</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الاسم بالعربية *</label>
                    <input
                      type="text"
                      value={newDeviceType.name_ar}
                      onChange={(e) => setNewDeviceType({ ...newDeviceType, name_ar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="مثال: جهاز مراقبة المريض"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الاسم بالإنجليزية</label>
                    <input
                      type="text"
                      value={newDeviceType.name_en}
                      onChange={(e) => setNewDeviceType({ ...newDeviceType, name_en: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Patient Monitor"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                    <textarea
                      value={newDeviceType.description}
                      onChange={(e) => setNewDeviceType({ ...newDeviceType, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddDeviceType}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    إضافة
                  </button>
                  <button
                    onClick={() => {
                      setShowDeviceTypeModal(false);
                      setNewDeviceType({ name_ar: "", name_en: "", description: "" });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Device Type Modal */}
          {showEditDeviceTypeModal && editingDeviceType && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">تعديل نوع الجهاز</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الاسم بالعربية *</label>
                    <input
                      type="text"
                      value={editingDeviceType.name_ar}
                      onChange={(e) => setEditingDeviceType({ ...editingDeviceType, name_ar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الاسم بالإنجليزية</label>
                    <input
                      type="text"
                      value={editingDeviceType.name_en || ""}
                      onChange={(e) => setEditingDeviceType({ ...editingDeviceType, name_en: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                    <textarea
                      value={editingDeviceType.description || ""}
                      onChange={(e) => setEditingDeviceType({ ...editingDeviceType, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleEditDeviceType}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => {
                      setShowEditDeviceTypeModal(false);
                      setEditingDeviceType(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Criteria Selection Modal */}
          {showCriteriaSelectModal && selectedDeviceTypeForCriteria && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  معايير الفحص لـ: {selectedDeviceTypeForCriteria.name_ar}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4">اختر المعايير المطلوبة للفحص الشهري لهذا النوع من الأجهزة</p>
                
                <div className="space-y-2 mb-6">
                  {criteria.map((crit) => (
                    <label key={crit.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCriteriaIds.includes(crit.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCriteriaIds([...selectedCriteriaIds, crit.id]);
                          } else {
                            setSelectedCriteriaIds(selectedCriteriaIds.filter(id => id !== crit.id));
                          }
                        }}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{crit.label_ar}</div>
                        {crit.description_ar && (
                          <div className="text-sm text-gray-500">{crit.description_ar}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveCriteriaForType}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    حفظ المعايير
                  </button>
                  <button
                    onClick={() => {
                      setShowCriteriaSelectModal(false);
                      setSelectedDeviceTypeForCriteria(null);
                      setSelectedCriteriaIds([]);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
