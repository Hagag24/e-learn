/*
  منطق التفاعل للدرس "هيا نتعلم يا جدي"
  - بدون مكتبات خارجية، دعم اللمس والماوس
  - تغذية راجعة مرئية وصوتية، وكونفيتي النجوم
*/

// حالة عامة للنتائج والتغذية الراجعة
const state = {
  correct: 0,
  wrong: 0,
  mistakes: [] // عناصر من نوع { word, chosen, correct }
};

function renderScoreboard() {
  const cEl = document.getElementById('score-correct');
  const wEl = document.getElementById('score-wrong');
  const mEl = document.getElementById('score-mistakes');
  // إن لم تتوفر العناصر، لا نمنع التحديث بالكامل — نحدّث المتوفر
  if (cEl) cEl.textContent = state.correct;
  if (wEl) wEl.textContent = state.wrong;
  if (mEl) {
    mEl.innerHTML = '';
    const last = state.mistakes.slice(-5); // آخر 5 أخطاء
    last.forEach(m => {
      const li = document.createElement('li');
      li.textContent = `خطأ في ${m.word} — اخترت ${m.chosen} والصحيح ${m.correct}`;
      mEl.appendChild(li);
    });
  }
}

function addResult(isCorrect, detail) {
  if (isCorrect) {
    state.correct++;
  } else {
    state.wrong++;
    if (detail) state.mistakes.push(detail);
  }
  renderScoreboard();
}

// نظام التوجيه عبر جزئيات HTML
const routes = ['intro','act1','act2','act3','act4','act5','result'];
let currentIndex = 0;

function updateProgressAndNav() {
  const total = routes.length;
  const step = currentIndex + 1;
  const percent = Math.max(0, Math.min(100, Math.round((step / total) * 100)));
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  if (bar) bar.style.width = percent + '%';
  if (text) text.textContent = `التقدم: خطوة ${step} من ${total}`;
  // تحديث شريط التنقل الثابت
  const btnPrev = document.getElementById('btn-global-prev');
  const btnNext = document.getElementById('btn-global-next');
  if (btnPrev) btnPrev.disabled = currentIndex === 0;
  if (btnNext) {
    const route = routes[currentIndex];
    if (route === 'act5') {
      btnNext.textContent = 'إنهاء'; btnNext.setAttribute('aria-label', 'إنهاء');
    } else if (route === 'result') {
      btnNext.textContent = 'طباعة'; btnNext.setAttribute('aria-label', 'طباعة');
    } else {
      btnNext.textContent = 'التالي'; btnNext.setAttribute('aria-label', 'التالي');
    }
  }
}

function getPartialPath(route) { return `partials/${route}.html`; }

async function loadScreen(index) {
  currentIndex = Math.max(0, Math.min(index, routes.length - 1));
  const route = routes[currentIndex];
  const root = document.getElementById('content-root');
  const hasBundle = typeof window.PARTIALS === 'object' && window.PARTIALS !== null && window.PARTIALS[route];
  const isFileProtocol = (location.protocol === 'file:');
  // إن كنا نعمل من الملف مباشرة و الحزمة موجودة، استخدمها فورًا
  if (isFileProtocol && hasBundle) {
    const html = window.PARTIALS[route];
    root.innerHTML = html;
    Array.from(root.querySelectorAll('.word-img')).forEach(img => ensureImageFallback(img));
    initRoute(route);
    updateProgressAndNav();
    return;
  }
  try {
    const res = await fetch(getPartialPath(route));
    const html = await res.text();
    root.innerHTML = html;
    // ما بعد التحميل: تعيين فولبك للصور وتهيئة النشاط الحالي
    Array.from(root.querySelectorAll('.word-img')).forEach(img => ensureImageFallback(img));
    initRoute(route);
  } catch (e) {
    // فولبك إلى الحزمة المضمنة إن توفرت
    if (hasBundle) {
      const html = window.PARTIALS[route];
      root.innerHTML = html;
      Array.from(root.querySelectorAll('.word-img')).forEach(img => ensureImageFallback(img));
      initRoute(route);
    } else {
      root.innerHTML = `<div class="screen" data-bg="white"><div class="screen-content"><div class="feedback error">تعذر تحميل الصفحة: ${route}</div></div></div>`;
    }
  }
  updateProgressAndNav();
}

function initRoute(route) {
  switch (route) {
    case 'intro': break;
    case 'act1': initAct1(); break;
    case 'act2': initAct2(); break;
    case 'act3': initAct3(); break;
    case 'act4': initAct4(); break;
    case 'act5': initAct5(); break;
    case 'result': initResult(); break;
  }
}

// أزرار التالي/السابق
document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-nav]');
  if (!btn) return;
  const dir = btn.getAttribute('data-nav');
  if (dir === 'next') {
    // إن كان على شاشة الشهادة: نفّذ الطباعة
    if (routes[currentIndex] === 'result') {
      const totalAttempts = state.correct + state.wrong;
      if (totalAttempts === 0) {
        // تعزيز سلبي: منع الطباعة مع تنبيه واضح وصوت
        const paper = document.querySelector('.cert-paper');
        paper?.classList.add('inactive','shake');
        setTimeout(() => paper?.classList.remove('shake'), 600);
        playSound('wrong');
        const inner = document.querySelector('.cert-inner');
        if (inner && !inner.querySelector('.negative-banner')) {
          const note = document.createElement('div');
          note.className = 'negative-banner';
          note.textContent = 'تعزيز سلبي: لم تُجرَّب الأنشطة؛ اطبع بعد التجربة.';
          inner.insertBefore(note, inner.firstChild);
        }
        return;
      }
      window.print();
      return;
    }
    // إن كان في آخر نشاط (act5) انتقل لشاشة الشهادة واملأ بياناتها
    const isAct5 = routes[currentIndex] === 'act5';
    if (isAct5) {
      const total = state.correct + state.wrong;
      const ratio = total > 0 ? state.correct / total : 0;
      const percent = total > 0 ? Math.round(ratio * 100) : 0;
      const level = ratio >= 0.8 ? 'ممتاز' : ratio >= 0.6 ? 'جيد جدًا' : 'بحاجة لمراجعة';
      // خزّن المستوى مؤقتًا لاستخدامه عند تحميل صفحة الشهادة
      window.__cert__ = { percent, level, ratio };
      if (percent > 0) { confetti(1200); playSound('cheer'); }
      else { playSound('wrong'); }
      loadScreen(currentIndex + 1);
      return;
    }
    loadScreen(currentIndex + 1);
  }
  if (dir === 'prev') loadScreen(currentIndex - 1);
});

// أداة تشغيل الصوت من مجلد الأصول مع فولبك
function playSound(name) {
  return new Promise((resolve) => {
    const audio = new Audio(`assets/sounds/${name}.mp3`);
    audio.play().then(resolve).catch(() => {
      // فولبك: توليد نغمة قصيرة عبر WebAudio في حال عدم توفر الملف
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = name === 'wrong' ? 'square' : 'sine';
        osc.frequency.value = name === 'wrong' ? 200 : 880;
        gain.gain.value = 0.08;
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); setTimeout(() => { osc.stop(); resolve(); }, 300);
      } catch (err) { resolve(); }
    });
  });
}

// كونفيتي النجوم البسيط
function confetti(duration = 900) {
  const root = document.getElementById('confetti');
  const count = 24;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = '-12px';
    star.style.transform = `translateY(0) rotate(${Math.random() * 90}deg)`;
    root.appendChild(star);
    setTimeout(() => star.remove(), duration + Math.random() * 300);
  }
}

// مولّد SVG بديل للصورة عند الفشل
function svgPlaceholder(label) {
  const bg = '#f2f6ff';
  const txt = label.replace(/"/g, '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
    <rect width='100%' height='100%' rx='18' ry='18' fill='${bg}' />
    <text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' font-size='24'>${txt}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// تعيين فولبك للصور عند الخطأ ومعالجة الحال فور التحميل
function ensureImageFallback(img) {
  const applyFallback = () => {
    const alt = img.getAttribute('data-fallback') || img.alt || 'صورة';
    img.src = svgPlaceholder(alt);
  };
  // إن كان التحميل قد اكتمل لكنه فشل (عرض 0)
  if (img.complete && img.naturalWidth === 0) {
    applyFallback();
    return;
  }
  // استمع للأخطاء المستقبلية
  img.addEventListener('error', applyFallback, { once: true });
}

// عند بدء التشغيل قد لا توجد صور داخل المحتوى حتى يُحمّل الجزئي

// النشاط 1 – اكتشف الحرف المختلف (الصحيح: ثـ)
function initAct1() {
  const cards = document.getElementById('act1-cards');
  const feedback = document.getElementById('act1-feedback');
  // تشغيل أصوات الحروف للنشاط 1
  const soundRow = document.querySelector('#act1 .letter-sounds');
  if (soundRow) {
    soundRow.addEventListener('click', async (e) => {
      const sbtn = e.target.closest('.play-btn');
      if (!sbtn) return;
      const name = sbtn.getAttribute('data-sound');
      await playSound(name);
    });
  }
  cards.addEventListener('click', async (e) => {
    const btn = e.target.closest('.letter-card');
    if (!btn) return;
    const val = btn.getAttribute('data-letter');
    cards.querySelectorAll('.letter-card').forEach(b => b.classList.remove('correct','wrong','shake'));
    if (val === 'tha') {
      btn.classList.add('correct');
      feedback.textContent = 'أحسنت! الحرف المختلف هو (ثـ)';
      feedback.className = 'feedback success';
      addResult(true);
      confetti();
      await playSound('correct');
    } else {
      btn.classList.add('wrong','shake');
      feedback.textContent = 'جرب مرة أخرى ❌';
      feedback.className = 'feedback error';
      addResult(false, { word: 'الحرف المختلف', chosen: val === 'ba' ? 'ب' : 'ت', correct: 'ث' });
      await playSound('wrong');
    }
  });
}

// النشاط 2 – استمع وانطق: عند تشغيل الثلاثة → رسالة نجاح
function initAct2() {
  const bubbles = Array.from(document.querySelectorAll('#act2 .bubble'));
  const feedback = document.getElementById('act2-feedback');
  const played = new Set();
  bubbles.forEach(b => {
    const btn = b.querySelector('.play-btn');
    btn.addEventListener('click', async () => {
      const name = b.getAttribute('data-sound');
      b.classList.add('pulse');
      await playSound(name);
      played.add(name);
      if (played.size === 3) {
        feedback.textContent = 'رائع! لقد سمعت الحروف كلها 👏';
        feedback.className = 'feedback success';
        confetti();
        await playSound('cheer');
      }
      setTimeout(() => b.classList.remove('pulse'), 400);
    });
  });
}

// النشاط 3 – اختر الحرف الأول للكلمة (تفاح: ت، باب: ب، ثعلب: ث)
function initAct3() {
  const feedback = document.getElementById('act3-feedback');
  // تشغيل صوت الكلمة لكل بطاقة
  document.querySelectorAll('#act3 .quiz-card .play-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.getAttribute('data-sound');
      await playSound(name);
    });
  });
  document.querySelectorAll('#act3 .option').forEach(opt => {
    opt.addEventListener('click', async () => {
      const isCorrect = opt.hasAttribute('data-correct');
      const card = opt.closest('.quiz-card');
      const word = card.querySelector('.word-img').alt;
      const correctOpt = card.querySelector('[data-correct]');
      const correctLetter = correctOpt?.getAttribute('data-answer') || '';
      opt.classList.remove('wrong','correct');
      if (isCorrect) {
        opt.classList.add('correct');
        feedback.textContent = 'نجمة ⭐ أحسنت!';
        feedback.className = 'feedback success';
        addResult(true);
        confetti();
        await playSound('correct');
      } else {
        opt.classList.add('wrong','shake');
        feedback.textContent = 'راجع الفيديو';
        feedback.className = 'feedback error';
        addResult(false, { word, chosen: opt.getAttribute('data-answer'), correct: correctLetter });
        await playSound('wrong');
        setTimeout(() => opt.classList.remove('shake'), 500);
      }
    });
  });
}

// النشاط 4 – اقطع الكلمة إلى مقاطع: "بيت" → (بيـ | تـ)
function initAct4() {
  const wordEl = document.getElementById('split-word');
  const feedback = document.getElementById('act4-feedback');
  const btnCut = document.getElementById('btn-cut');
  const btnReset = document.getElementById('btn-reset');
  const btnPlay = document.getElementById('btn-play');
  let isSplit = false;

  if (btnPlay) {
    btnPlay.addEventListener('click', async () => {
      const name = btnPlay.getAttribute('data-sound') || 'bayt';
      await playSound(name);
    });
  }

  btnCut.addEventListener('click', async () => {
    if (isSplit) return;
    const splitWrap = document.createElement('div');
    splitWrap.className = 'split zoom-in';
    const p1 = document.createElement('span'); p1.className = 'part'; p1.textContent = 'بيـ';
    const p2 = document.createElement('span'); p2.className = 'part'; p2.textContent = 'تـ';
    splitWrap.appendChild(p1); splitWrap.appendChild(p2);
    wordEl.replaceWith(splitWrap);
    feedback.textContent = 'رائع! فصلت الأصوات.';
    feedback.className = 'feedback success';
    confetti();
    await playSound('correct');
    isSplit = true;
  });

  btnReset.addEventListener('click', async () => {
    if (!isSplit) return;
    const newWord = document.createElement('div');
    newWord.id = 'split-word';
    newWord.className = 'word zoom-in';
    newWord.textContent = 'بيت';
    const current = document.querySelector('#act4 .split');
    current.replaceWith(newWord);
    feedback.textContent = 'أحسنت! الكلمة بيت.';
    feedback.className = 'feedback success';
    await playSound('cheer');
    isSplit = false;
  });
}

// النشاط 5 – صوت البداية
function initAct5() {
  const feedback = document.getElementById('act5-feedback');
  // تشغيل أصوات الكلمات
  document.querySelectorAll('#act5 .quiz-card .play-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.getAttribute('data-sound');
      await playSound(name);
    });
  });
  document.querySelectorAll('#act5 .option').forEach(opt => {
    opt.addEventListener('click', async () => {
      const isCorrect = opt.hasAttribute('data-correct');
      const card = opt.closest('.quiz-card');
      const word = card.querySelector('.word-img').alt;
      const correctOpt = card.querySelector('[data-correct]');
      const correctLetter = correctOpt?.getAttribute('data-answer') || '';
      opt.classList.remove('wrong','correct');
      if (isCorrect) {
        opt.classList.add('correct');
        feedback.textContent = 'صحيح ✅';
        feedback.className = 'feedback success';
        addResult(true);
        confetti();
        await playSound('correct');
      } else {
        opt.classList.add('wrong','shake');
        feedback.textContent = 'خطأ ❌';
        feedback.className = 'feedback error';
        addResult(false, { word, chosen: opt.getAttribute('data-answer'), correct: correctLetter });
        await playSound('wrong');
        setTimeout(() => opt.classList.remove('shake'), 500);
      }
    });
  });
}

// دعم اللمس: الماوس مستخدم فعلاً، والأزرار كبيرة؛ لا حاجة لتغييرات إضافية
// كل النصوص بالعربية كما في الكتاب، مع الحفاظ على الترتيب المطلوب

// تهيئة صفحة الشهادة عند التحميل
function initResult() {
  const cEl = document.getElementById('cert-correct');
  const wEl = document.getElementById('cert-wrong');
  const pEl = document.getElementById('cert-percent');
  const bEl = document.getElementById('cert-badge');
  const dEl = document.getElementById('cert-date');
  const nEl = document.getElementById('cert-name');
  const meta = window.__cert__ || { percent: 0, level: 'بحاجة لمراجعة', ratio: 0 };
  if (cEl) cEl.textContent = state.correct;
  if (wEl) wEl.textContent = state.wrong;
  if (pEl) pEl.textContent = meta.percent + '%';
  if (bEl) {
    bEl.textContent = meta.level;
    bEl.classList.remove('badge-good','badge-review');
    if (meta.ratio >= 0.8) { /* ممتاز */ }
    else if (meta.ratio >= 0.6) bEl.classList.add('badge-good');
    else bEl.classList.add('badge-review');
  }
  if (dEl) dEl.textContent = new Date().toLocaleDateString('ar-EG');
  // تعزيز سلبي عند عدم وجود محاولات
  const didAttempt = (state.correct + state.wrong) > 0;
  if (!didAttempt) {
    const paper = document.querySelector('.cert-paper');
    paper?.classList.add('inactive');
    const inner = document.querySelector('.cert-inner');
    if (inner && !inner.querySelector('.negative-banner')) {
      const note = document.createElement('div');
      note.className = 'negative-banner';
      note.textContent = 'تعزيز سلبي: لم تُجرَّب الأنشطة؛ يُرجى العودة للتجربة قبل الطباعة.';
      inner.insertBefore(note, inner.firstChild);
    }
    try { document.getElementById('btn-print')?.setAttribute('disabled','true'); } catch(_){}
    playSound('wrong');
  }
  // استرجاع/حفظ اسم الطالب تلقائيًا
  try {
    const saved = localStorage.getItem('cert.name');
    if (nEl && saved) nEl.textContent = saved;
    nEl?.addEventListener('input', () => {
      const val = (nEl.textContent || '').trim();
      localStorage.setItem('cert.name', val);
    });
  } catch (_) {}
  // أزرار الشهادة
  document.getElementById('btn-print')?.addEventListener('click', () => window.print());
  document.getElementById('btn-restart-cert')?.addEventListener('click', () => {
    state.correct = 0; state.wrong = 0; state.mistakes = [];
    renderScoreboard();
    loadScreen(0);
  });
}

// العرض الأول: تحميل أول جزئية وعرض لوحة النتائج
renderScoreboard();
loadScreen(0);