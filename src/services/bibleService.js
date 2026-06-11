const API_KEY = process.env.EXPO_PUBLIC_BIBLE_API_KEY;
const BASE = 'https://api.scripture.api.bible/v1';

export const VERSIONS = {
  TSI: { id: '2dd568eeff29fb3c-02', label: 'TSI', name: 'Terjemahan Sederhana Indonesia' },
  KJV: { id: 'de4e12af7f28f599-01', label: 'KJV', name: 'King James Version' },
};

const cache = {};
function cached(key, fn) {
  if (cache[key]) return Promise.resolve(cache[key]);
  return fn().then(r => { cache[key] = r; return r; });
}

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'api-key': API_KEY },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data;
}

export function getBooks(versionKey) {
  const { id } = VERSIONS[versionKey];
  return cached(`books_${versionKey}`, () =>
    apiFetch(`/bibles/${id}/books?include-chapters=true`),
  );
}

export function getChapters(versionKey, bookId) {
  const { id } = VERSIONS[versionKey];
  return cached(`chapters_${versionKey}_${bookId}`, () =>
    apiFetch(`/bibles/${id}/books/${bookId}/chapters`),
  );
}

export function getChapter(versionKey, chapterId) {
  const { id } = VERSIONS[versionKey];
  return cached(`chapter_${versionKey}_${chapterId}`, () =>
    apiFetch(`/bibles/${id}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`),
  );
}

export function getVerse(versionKey, verseId) {
  const { id } = VERSIONS[versionKey];
  return apiFetch(`/bibles/${id}/verses/${verseId}?content-type=text&include-verse-numbers=false`);
}

// Parse JSON content from API into flat verse array: [{number, text}]
// API structure: a "verse" tag is only the number marker; the verse text
// comes as sibling text nodes following it (carrying attrs.verseId).
export function parseVerses(content) {
  if (!content || !Array.isArray(content)) return [];
  const verses = [];
  let current = null;

  function push() {
    if (current) {
      const text = current.text.replace(/¶\s*/g, '').replace(/\s+/g, ' ').trim();
      if (text) verses.push({ number: current.number, text });
    }
    current = null;
  }

  function walk(items) {
    for (const item of items) {
      if (typeof item === 'string') {
        if (current) current.text += item;
        continue;
      }
      if (item.type === 'tag' && item.name === 'verse') {
        push();
        current = { number: item.attrs?.number || '', text: '' };
        continue;
      }
      if (item.type === 'text') {
        if (current) current.text += item.text || '';
        continue;
      }
      if (item.items) walk(item.items);
    }
  }

  walk(content);
  push();
  return verses;
}
