interface Criteria {
  id: number;
  key: string;
  label_ar: string;
  description_ar: string;
  is_active: number;
  display_order: number;
}

interface CriteriaListProps {
  criteria: Criteria[];
  onEdit: (criteria: Criteria) => void;
  onDelete: (id: number) => void;
}

export default function CriteriaList({ criteria, onEdit, onDelete }: CriteriaListProps) {
  if (criteria.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center" dir="rtl">
        <p className="text-gray-500">لا توجد معايير</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden" dir="rtl">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">المفتاح</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">التسمية</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">الوصف</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">الترتيب</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {criteria.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-mono" dir="ltr">
                  {item.key}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {item.label_ar}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {item.description_ar || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {item.display_order}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف المعيار "${item.label_ar}"؟`)) {
                          onDelete(item.id);
                        }
                      }}
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
  );
}
