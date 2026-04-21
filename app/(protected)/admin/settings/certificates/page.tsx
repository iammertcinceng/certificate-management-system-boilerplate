"use client";

export default function CertificateSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sertifika Ayarları</h1>
        <p className="text-gray-600 mt-2">Sertifika şablonları ve görünüm ayarları.</p>
      </div>

      {/* Certificate Generation Tool - Coming Soon */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sertifika Üretim Aracı</h2>
          <p className="text-gray-600 mb-4">
            Özelleştirilmiş sertifika şablonları oluşturabilir, mevcut şablonları düzenleyebilir ve yeni tasarımlar ekleyebilirsiniz.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Yakında Eklenecek
          </div>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Planlanan Özellikler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Şablon Galerisi</h4>
              <p className="text-sm text-gray-600">Hazır şablonlardan seçim yapın veya kendi tasarımınızı yükleyin.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Görsel Düzenleyici</h4>
              <p className="text-sm text-gray-600">Drag & Drop ile sertifika elemanlarını düzenleyin.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Önizleme Modu</h4>
              <p className="text-sm text-gray-600">Değişiklikleri kaydetmeden önce canlı önizleme yapın.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Renk ve Font Yönetimi</h4>
              <p className="text-sm text-gray-600">Kurumsal kimliğinize uygun renk ve fontlar belirleyin.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
