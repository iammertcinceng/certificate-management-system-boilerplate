const XLSX = require('xlsx');

// Büyük test dosyası oluştur (100 satır)
function generateLargeTestExcel() {
  const data = [];
  
  // 100 öğrenci için sertifika
  for (let i = 1; i <= 2; i++) {
    const studentId = `STD-${String(i).padStart(6, '0')}`;
    
    // Her 20 öğrencide bir farklı eğitim
    const trainingNum = Math.ceil(i / 2);
    const trainingId = `TRN-${String(trainingNum).padStart(6, '0')}`;
    
    // Her 10 öğrencide bir farklı şablon
    const templates = ['classic', 'modern', 'minimal'];
    const templateKey = templates[Math.floor((i - 1) / 10) % templates.length];
    
    // Tarih varyasyonu
    const day = 10 + Math.floor((i - 1) / 10);
    const dateIssued = `2025-01-${String(day).padStart(2, '0')}`;
    
    // Her 5 öğrencide bir partner ekle
    const hasPartner = i % 2 === 0;
    const partnerIds = hasPartner ? 'ACR-000001,RFR-000002' : '';
    
    // Her 10 öğrencide bir supervised
    const isSupervised = i % 2 === 0 ? 1 : 0;
    const supervisorId = isSupervised ? 'ACR-000001' : '';
    
    data.push({
      STUDENT_ID: studentId,
      TRAINING_ID: trainingId,
      TEMPLATE_KEY: templateKey,
      DATE_ISSUED: dateIssued,
      PARTNER_IDS: partnerIds,
      IS_SUPERVISED: isSupervised,
      SUPERVISOR_ID: supervisorId
    });
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sertifikalar");
  
  XLSX.writeFile(wb, "test-sertifika-import-large.xlsx");
  console.log('✅ Büyük test Excel dosyası oluşturuldu: test-sertifika-import-large.xlsx');
  console.log(`📊 Toplam ${data.length} satır veri`);
  console.log(`📦 ${new Set(data.map(d => d.TRAINING_ID)).size} farklı eğitim`);
  console.log(`🎨 ${new Set(data.map(d => d.TEMPLATE_KEY)).size} farklı şablon`);
  console.log('\n⚠️  NOT: Bu ID\'ler örnek! Gerçek ID\'lerle değiştirin.');
}

generateLargeTestExcel();
