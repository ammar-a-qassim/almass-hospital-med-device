import { useState, useEffect } from "react";
import { departmentsApi } from "../api/api";
import Modal from "../components/Modal";

export default function DepartmentsList() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [newDeptName, setNewDeptName] = useState("");
  const [newCustodianName, setNewCustodianName] = useState("");

  const [editingDept, setEditingDept] = useState<any>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editCustodianName, setEditCustodianName] = useState("");

  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const deps = await departmentsApi.getAll();
      setDepartments(deps);
    } catch (error) {
      console.error('Failed to load departments:', error);
      alert('فشل تحميل الأقسام');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) {
      alert("اسم القسم مطلوب");
      return;
    }

    try {
      await departmentsApi.create(newDeptName.trim(), newCustodianName.trim() || undefined);
      setNewDeptName("");
      setNewCustodianName("");
      setShowAddModal(false);
      setSuccessMessage("تم إضافة القسم بنجاح!");
      setShowSuccessModal(true);
      await loadDepartments();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في إضافة القسم'}`);
    }
  };

  const handleEditDepartment = (dept: any) => {
    setEditingDept(dept);
    setEditDeptName(dept.name || "");
    setEditCustodianName(dept.custodian_name || "");
    setShowEditModal(true);
  };

  const handleUpdateDepartment = async () => {
    if (!editDeptName.trim()) {
      alert("اسم القسم مطلوب");
      return;
    }

    try {
      await departmentsApi.update(editingDept.id, editDeptName.trim(), editCustodianName.trim() || undefined);
      setEditingDept(null);
      setEditDeptName("");
      setEditCustodianName("");
      setShowEditModal(false);
      setSuccessMessage("تم تحديث القسم بنجاح!");
      setShowSuccessModal(true);
      await loadDepartments();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في تحديث القسم'}`);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟")) return;

    try {
      await departmentsApi.delete(id);
      setSuccessMessage("تم حذف القسم بنجاح!");
      setShowSuccessModal(true);
      await loadDepartments();
    } catch (error: any) {
      alert(`خطأ: ${error.message || 'فشل في حذف القسم'}`);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">إدارة الأقسام</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          إضافة قسم جديد
        </button>
      </div>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="نجاح"
        message={successMessage}
        type="success"
      />

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">إضافة قسم جديد</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم القسم</label>
              <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: قسم العناية المركزة"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم صاحب ذمة الأجهزة الطبية</label>
              <input
                type="text"
                value={newCustodianName}
                onChange={(e) => setNewCustodianName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: د. أحمد محمد"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddDepartment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إضافة
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewDeptName("");
                  setNewCustodianName("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingDept && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">تعديل القسم</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم القسم</label>
              <input
                type="text"
                value={editDeptName}
                onChange={(e) => setEditDeptName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: قسم العناية المركزة"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم صاحب ذمة الأجهزة الطبية</label>
              <input
                type="text"
                value={editCustodianName}
                onChange={(e) => setEditCustodianName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: د. أحمد محمد"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateDepartment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                حفظ
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDept(null);
                  setEditDeptName("");
                  setEditCustodianName("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Departments Table */}
      {departments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">لا توجد أقسام</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">اسم القسم</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">صاحب الذمة</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">عدد الأجهزة</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{dept.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{dept.custodian_name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dept.devices_count || 0}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditDepartment(dept)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                        disabled={dept.devices_count > 0}
                        title={dept.devices_count > 0 ? "لا يمكن حذف قسم يحتوي على أجهزة" : ""}
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
    </div>
  );
}
