// generate-arabic-letters.js
// سكربت لتوليد ملفات MP3 لأسماء/أصوات الحروف العربية باستخدام Google TTS
// الاستخدام:
//  - بدون وسائط: يولّد الحروف الأساسية (باء، تاء، ثاء)
//  - مع وسائط: مرّر أكواد الحروف المطلوبة مثل: node generate-arabic-letters.js alef dal kaf sin
const gTTS = require('gtts');
const fs = require('fs-extra');

(async () => {
  const outDir = 'assets/sounds';
  await fs.ensureDir(outDir);

  // قاموس الأكواد إلى النص العربي للنطق
  const NAME_MAP = {
    // الأساسية للنشاط 2
    ba: 'باء',
    ta: 'تاء',
    tha: 'ثاء',
    // إضافية للنشاط 5 وللاستخدام العام
    alef: 'ألف',
    dal: 'دال',
    kaf: 'كاف',
    sin: 'سين',
    // كلمات الأنشطة
    tuffah: 'تفاح',
    bab: 'باب',
    tha3lab: 'ثعلب',
    bayt: 'بيت',
    asad: 'أسد',
    dik: 'ديك',
    kalb: 'كلب'
  };

  const args = process.argv.slice(2).map(a => a.trim()).filter(Boolean);
  let targets;
  if (args.length) {
    // فلترة أي أكواد غير معروفة
    const unknown = args.filter(a => !(a in NAME_MAP));
    if (unknown.length) {
      console.warn(`تحذير: هذه الأكواد غير معروفة وسيتم تجاهلها: ${unknown.join(', ')}`);
    }
    targets = args.filter(a => a in NAME_MAP);
    if (!targets.length) {
      console.error('لا توجد أكواد صالحة بعد الفلترة. استخدم مثلاً: alef dal kaf sin');
      process.exit(1);
    }
  } else {
    // الوضع الافتراضي: الحروف الأساسية
    targets = ['ba','ta','tha'];
  }

  for (const code of targets) {
    const text = NAME_MAP[code];
    const filePath = `${outDir}/${code}.mp3`;
    try {
      await new Promise((resolve, reject) => {
        const speech = new gTTS(text, 'ar');
        speech.save(filePath, (err) => err ? reject(err) : resolve());
      });
      console.log(`تم إنشاء: ${filePath}`);
    } catch (err) {
      console.error(`فشل إنشاء ${filePath}:`, err?.message || err);
    }
  }
})();