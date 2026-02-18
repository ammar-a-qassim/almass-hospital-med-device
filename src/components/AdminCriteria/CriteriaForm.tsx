import { useState } from "react";

interface CriteriaFormProps {
  onSubmit: (criteria: { key: string; label_ar: string; description_ar: string }) => void;
  onCancel: () => void;
}

export default function CriteriaForm({ onSubmit, onCancel }: CriteriaFormProps) {
  const [key, setKey] = useState("");
  const [labelAr, setLabelAr] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");

  const handleSubmit = () => {
    if (!key.trim() || !labelAr.trim()) {
      alert("المفتاح والتسمية مطلوبان");
      return;
    }

    onSubmit({
      key: key.trim(),
      label_ar: labelAr.trim(),
      description_ar: descriptionAr.trim(),
    });

    // Reset form
    setKey("");
    setLabelAr("");
    setDescriptionAr("");
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4" dir="rtl">
      <h3 className="text-lg font-bold text-gray-900">إضافة معيار جديد</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          المفتاح (بالإنجليزية) *
        </label>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="cleanliness, functionality, etc."
          dir="ltr"
        />
        <p className="text-xs text-gray-500 mt-1">
          يجب أن يكون فريداً ويستخدم حروف لاتينية صغيرة وشرطات سفلية فقط
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          التسمية بالعربية *
        </label>
        <input
          type="text"
          value={labelAr}
          onChange={(e) => setLabelAr(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="مثال: النظافة العامة"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الوصف بالعربية
        </label>
        <input
          type="text"
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="مثال: نظافة الجهاز والمحيط"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSubmit}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          إضافة
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
