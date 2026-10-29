'use strict';
const STORAGE_KEY = 'mind-pieces.entries.v1';
const MOODS = {
  happy: { emoji: '😊', label: '행복해요' },
  calm: { emoji: '🌿', label: '평온해요' },
  excited: { emoji: '✨', label: '설레요' },
  sad: { emoji: '🌧️', label: '슬퍼요' },
  tired: { emoji: '😴', label: '지쳤어요' },
  angry: { emoji: '🌋', label: '화나요' }
};
function validateEntries(value) {
  if (!Array.isArray(value)) throw new Error('Invalid saved entries');
  return value.filter(entry => entry && typeof entry.id === 'string' &&
    Object.hasOwn(MOODS, entry.mood) && typeof entry.note === 'string' &&
    entry.note.trim().length > 0 && entry.note.length <= 300 &&
    typeof entry.createdAt === 'string' && Number.isFinite(Date.parse(entry.createdAt)));
}
if (typeof module !== 'undefined') module.exports = { validateEntries, MOODS };
if (typeof document !== 'undefined') {
  const form = document.querySelector('#entry-form');
  const note = document.querySelector('#note');
  const message = document.querySelector('#message');
  const filter = document.querySelector('#filter');
  let entries = [];
  let storageReadable = true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) entries = validateEntries(JSON.parse(saved));
  } catch {
    storageReadable = false;
    message.textContent = '저장된 기록을 읽을 수 없어요. 기존 데이터 보호를 위해 저장을 중단했어요. 브라우저 저장소 설정을 확인해주세요.';
  }
  const dateFormat = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  document.querySelector('#today').textContent = dateFormat.format(new Date());
  function persist(next) {
    if (!storageReadable) return false;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); entries = next; return true; }
    catch { message.textContent = '저장 공간이 부족하거나 저장이 차단됐어요. 브라우저 설정을 확인해주세요.'; return false; }
  }
  function render() {
    const container = document.querySelector('#entries');
    container.replaceChildren();
    document.querySelector('#entry-count').textContent = entries.length;
    const visible = entries.filter(entry => filter.value === 'all' || entry.mood === filter.value)
      .slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (!visible.length) {
      const empty = document.createElement('div'); empty.className = 'empty';
      const icon = document.createElement('b'); icon.textContent = '🌱';
      empty.append(icon, entries.length ? '이 감정으로 남긴 기록이 아직 없어요.' : '아직 남긴 마음이 없어요. 첫 번째 마음을 기록해보세요.');
      container.append(empty);
    }
    for (const entry of visible) {
      const card = document.createElement('article'); card.className = 'entry';
      const top = document.createElement('div'); top.className = 'entry-top';
      const badge = document.createElement('span'); badge.className = 'badge';
      badge.textContent = `${MOODS[entry.mood].emoji} ${MOODS[entry.mood].label}`;
      const time = document.createElement('time'); time.dateTime = entry.createdAt;
      time.textContent = dateFormat.format(new Date(entry.createdAt));
      const body = document.createElement('p'); body.textContent = entry.note;
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete'; remove.textContent = '기록 삭제';
      remove.setAttribute('aria-label', `${time.textContent} ${MOODS[entry.mood].label} 기록 삭제`);
      remove.addEventListener('click', () => {
        if (window.confirm('이 마음 기록을 삭제할까요? 삭제하면 되돌릴 수 없어요.') && persist(entries.filter(item => item.id !== entry.id))) {
          render(); message.textContent = '기록을 삭제했어요.';
        }
      });
      top.append(badge, time); card.append(top, body, remove); container.append(card);
    }
  }
  note.addEventListener('input', () => { document.querySelector('#counter').textContent = `${note.value.length} / 300`; });
  filter.addEventListener('change', render);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const mood = new FormData(form).get('mood');
    const text = note.value.trim();
    if (!Object.hasOwn(MOODS, mood) || !text || text.length > 300) {
      message.textContent = '감정을 고르고 1~300자의 글을 남겨주세요.'; return;
    }
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, mood, note: text, createdAt: new Date().toISOString() };
    if (persist([entry, ...entries])) {
      form.reset(); filter.value = 'all'; document.querySelector('#counter').textContent = '0 / 300';
      render(); message.textContent = '오늘의 마음을 소중히 저장했어요.';
    }
  });
  render();
}
