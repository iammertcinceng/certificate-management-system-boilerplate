# Sertifika Şablon Sistemi

Bu klasör, dinamik sertifika şablonları ve görüntüleme bileşenlerini içerir.

## Özellikler

- **5 Farklı Şablon**: Classic, Modern, Creative, Elegant, Professional
- **Dinamik Renkler**: Kurum primary/secondary renkleri ile özelleştirilebilir
- **A4 Format**: Yatay A4 boyutunda (297mm x 210mm)
- **Responsive Önizleme**: Ekranda küçültülmüş, indirirken tam boyut
- **PDF/PNG Export**: html2canvas ve jsPDF ile indirme
- **Kurum & Partner Logoları**: Yan yana görüntüleme
- **İmza Desteği**: Kurum ve partner imzaları (şeffaf PNG)

## Şablonlar

### 1. Classic Template (`classic`)
- Geleneksel ve resmi görünüm
- Çift kenarlık çerçeve
- Köşe süslemeleri
- Kurumsal kullanım için ideal

### 2. Modern Template (`modern`)
- Minimal ve çağdaş tasarım
- Yan accent bar
- Geometrik arka plan
- Temiz ve profesyonel

### 3. Creative Template (`creative`)
- Renkli ve dinamik tasarım
- Dalga desenleri
- Gradient efektler
- Dikkat çekici ve özgün

### 4. Elegant Template (`elegant`)
- Zarif dalga desenleri
- Krem/bej arka plan
- CPD rozeti
- İmza alanları ile sofistike tasarım

### 5. Professional Template (`professional`)
- Çizgili çerçeve deseni
- Minimal ve kurumsal yapı
- Alt bölümde logolar ve imza
- Profesyonel sertifikasyon için ideal

## Kullanım

### Temel Kullanım

```tsx
import { CertificateRenderer } from '@/components/certificates';
import { CertificateData } from '@/types/certificate';

const data: CertificateData = {
  certificateNumber: 'CRT-2025-001',
  dateIssued: new Date().toISOString(),
  studentName: 'Ahmet Yılmaz',
  trainingName: 'Web Geliştirme',
  institutionName: 'Örnek Kurum',
  institutionSignature: 'data:image/png;base64,...', // Şeffaf PNG
  partners: [{ 
    name: 'Partner A',
    signature: 'data:image/png;base64,...' // Şeffaf PNG
  }],
  siteName: 'Mert CIN Certificates',
  primaryColor: '#1e40af',
  secondaryColor: '#7c3aed',
  templateKey: 'elegant', // veya 'classic', 'modern', 'creative', 'professional'
};

<CertificateRenderer data={data} scale={0.5} />
```

### Görüntüleme ve İndirme

```tsx
import { CertificateViewer } from '@/components/certificates';

<CertificateViewer 
  data={data} 
  scale={0.5} 
  showControls={true} 
/>
```

### PDF Export

```tsx
import { exportCertificateToPDF } from '@/utils/certificateExport';

const handleExport = async () => {
  const element = document.getElementById('certificate');
  if (element) {
    await exportCertificateToPDF(element, 'sertifika.pdf');
  }
};
```

## İmza Gereksinimleri

Kurum ve partner imzaları için:

| Özellik | Gereksinim |
|---------|------------|
| Format | PNG (şeffaf arka plan için zorunlu) |
| Boyut | Maksimum 100 KB |
| Boyutlar | Maksimum 400x200 piksel |
| Arka Plan | Şeffaf (alfa kanalı ile) |

İmzalar profil sayfasından yüklenir ve sertifikalarda otomatik görüntülenir.

## Sayfalar

### Şablon Önizleme
`/institution/certificates/templates`
- Tüm şablonları görüntüleme
- Renk özelleştirme
- Canlı önizleme

### Şablon Seçimi (Sertifika Oluşturma)
`/institution/certificates/create/template`
- Sertifika oluştururken şablon seçimi
- Modal önizleme
- Seçili şablon vurgulama

### Sertifika Görüntüleme
`/institution/certificates/[id]/view`
- Tek sertifika görüntüleme
- PDF/PNG indirme
- Tam boyut önizleme

## Boyutlandırma

- **Ekran Görünümü**: `scale` prop ile küçültülmüş (örn: 0.5)
- **İndirme**: Her zaman tam A4 boyutunda (1122px x 794px)
- **Responsive**: Ekran boyutuna göre otomatik ölçeklendirme

## Renk Sistemi

Sertifikalar kurum renklerini kullanır:
- `primaryColor`: Ana renk (başlıklar, kenarlıklar)
- `secondaryColor`: İkincil renk (vurgular, aksan)

Renkler hex formatında (#RRGGBB) olmalıdır.

## Geliştirme

Yeni şablon eklemek için:

1. `components/certificates/YourTemplate.tsx` oluştur (client-side)
2. `components/certificates/pdf/YourTemplateServer.tsx` oluştur (PDF için)
3. `types/certificate.ts` → `CertificateTemplateType` tipine ekle
4. `types/certificate.ts` → `CERTIFICATE_TEMPLATES` dizisine ekle
5. `CertificateRenderer.tsx` içinde case ekle
6. `pdf/CertificateRendererServer.tsx` içinde case ekle
7. `index.ts` export listesine ekle

## Bağımlılıklar

- `html2canvas`: HTML'i canvas'a dönüştürme
- `jspdf`: PDF oluşturma
- `next/image`: Logo görüntüleme (client şablonlar için)
