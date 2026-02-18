export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-800 via-purple-900 to-slate-800 border-t border-white/10 text-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center space-y-3">
          <img src="/assets/logo.png" alt="مستشفى الماس" className="h-10 w-auto opacity-80" />
          <p className="text-sm text-gray-300">
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </p>
          <p className="text-sm text-gray-400">
            اعداد وتطوير : <span className="text-purple-300 font-medium">الصيدلاني عمار عبد الكريم قاسم</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
