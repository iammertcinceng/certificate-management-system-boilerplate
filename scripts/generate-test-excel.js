const XLSX = require('xlsx');

// Test için örnek Excel dosyası oluştur
function generateTestExcel() {
  // Örnek veriler - Gerçek ID'lerle değiştirmeniz gerekecek
  const data = [
    {
      STUDENT_ID: 'STD-000001',
      TRAINING_ID: 'TRN-000001',
      TEMPLATE_KEY: 'classic',
      DATE_ISSUED: '2025-01-15',
      PARTNER_IDS: '',
      IS_SUPERVISED: 0,
      SUPERVISOR_ID: ''
    },
    {
      STUDENT_ID: 'STD-000002',
      TRAINING_ID: 'TRN-000001',
      TEMPLATE_KEY: 'classic',
      DATE_ISSUED: '2025-01-15',
      PARTNER_IDS: '',
      IS_SUPERVISED: 0,
      SUPERVISOR_ID: ''
    },
    {
      STUDENT_ID: 'STD-000003',
      TRAINING_ID: 'TRN-000002',
      TEMPLATE_KEY: 'modern',
      DATE_ISSUED: '2025-01-20',
      PARTNER_IDS: 'ACR-000001',
      IS_SUPERVISED: 1,
      SUPERVISOR_ID: 'ACR-000002'
    }
  ];

  // Worksheet oluştur
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Workbook oluştur
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sertifikalar");
  
  // Dosyayı kaydet
  XLSX.writeFile(wb, "test-sertifika-import.xlsx");
  console.log('✅ Test Excel dosyası oluşturuldu: test-sertifika-import.xlsx');
  console.log('\n📋 Başlık Sırası:');
  console.log('1. STUDENT_ID');
  console.log('2. TRAINING_ID');
  console.log('3. TEMPLATE_KEY');
  console.log('4. DATE_ISSUED');
  console.log('5. PARTNER_IDS');
  console.log('6. IS_SUPERVISED');
  console.log('7. SUPERVISOR_ID');
  console.log('\n⚠️  NOT: Gerçek ID\'lerle değiştirmeniz gerekiyor!');
}

generateTestExcel();
