// Detect Bible references in free text (e.g. "Ayub 42:5", "Yoh 3:16",
// "1 Korintus 13:4-7") and resolve them to API.Bible book IDs.

// Canonical Indonesian display names per book ID.
export const BOOK_NAMES = {
  GEN: 'Kejadian', EXO: 'Keluaran', LEV: 'Imamat', NUM: 'Bilangan', DEU: 'Ulangan',
  JOS: 'Yosua', JDG: 'Hakim-hakim', RUT: 'Rut', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Raja-raja', '2KI': '2 Raja-raja', '1CH': '1 Tawarikh', '2CH': '2 Tawarikh',
  EZR: 'Ezra', NEH: 'Nehemia', EST: 'Ester', JOB: 'Ayub', PSA: 'Mazmur', PRO: 'Amsal',
  ECC: 'Pengkhotbah', SNG: 'Kidung Agung', ISA: 'Yesaya', JER: 'Yeremia', LAM: 'Ratapan',
  EZK: 'Yehezkiel', DAN: 'Daniel', HOS: 'Hosea', JOL: 'Yoel', AMO: 'Amos', OBA: 'Obaja',
  JON: 'Yunus', MIC: 'Mikha', NAM: 'Nahum', HAB: 'Habakuk', ZEP: 'Zefanya', HAG: 'Hagai',
  ZEC: 'Zakharia', MAL: 'Maleakhi',
  MAT: 'Matius', MRK: 'Markus', LUK: 'Lukas', JHN: 'Yohanes', ACT: 'Kisah Para Rasul',
  ROM: 'Roma', '1CO': '1 Korintus', '2CO': '2 Korintus', GAL: 'Galatia', EPH: 'Efesus',
  PHP: 'Filipi', COL: 'Kolose', '1TH': '1 Tesalonika', '2TH': '2 Tesalonika',
  '1TI': '1 Timotius', '2TI': '2 Timotius', TIT: 'Titus', PHM: 'Filemon', HEB: 'Ibrani',
  JAS: 'Yakobus', '1PE': '1 Petrus', '2PE': '2 Petrus', '1JN': '1 Yohanes',
  '2JN': '2 Yohanes', '3JN': '3 Yohanes', JUD: 'Yudas', REV: 'Wahyu',
};

// Accepted spellings/abbreviations (lowercase) → book ID.
// Indonesian full names, common abbreviations, and English names.
const ALIASES = {
  // Perjanjian Lama
  kejadian: 'GEN', kej: 'GEN', genesis: 'GEN',
  keluaran: 'EXO', kel: 'EXO', exodus: 'EXO',
  imamat: 'LEV', leviticus: 'LEV',
  bilangan: 'NUM', bil: 'NUM', numbers: 'NUM',
  ulangan: 'DEU', deuteronomy: 'DEU',
  yosua: 'JOS', yos: 'JOS', joshua: 'JOS',
  'hakim-hakim': 'JDG', hakim: 'JDG', hak: 'JDG', judges: 'JDG',
  rut: 'RUT', ruth: 'RUT',
  '1 samuel': '1SA', '1samuel': '1SA', '1 sam': '1SA', '1sam': '1SA',
  '2 samuel': '2SA', '2samuel': '2SA', '2 sam': '2SA', '2sam': '2SA',
  '1 raja-raja': '1KI', '1 raja': '1KI', '1raj': '1KI', '1 kings': '1KI',
  '2 raja-raja': '2KI', '2 raja': '2KI', '2raj': '2KI', '2 kings': '2KI',
  '1 tawarikh': '1CH', '1taw': '1CH', '1 chronicles': '1CH',
  '2 tawarikh': '2CH', '2taw': '2CH', '2 chronicles': '2CH',
  ezra: 'EZR',
  nehemia: 'NEH', neh: 'NEH', nehemiah: 'NEH',
  ester: 'EST', esther: 'EST',
  ayub: 'JOB', ayb: 'JOB', job: 'JOB',
  mazmur: 'PSA', mzm: 'PSA', psalm: 'PSA', psalms: 'PSA',
  amsal: 'PRO', ams: 'PRO', proverbs: 'PRO',
  pengkhotbah: 'ECC', pkh: 'ECC', ecclesiastes: 'ECC',
  'kidung agung': 'SNG', kidung: 'SNG', 'song of songs': 'SNG',
  yesaya: 'ISA', yes: 'ISA', isaiah: 'ISA',
  yeremia: 'JER', yer: 'JER', jeremiah: 'JER',
  ratapan: 'LAM', rat: 'LAM', lamentations: 'LAM',
  yehezkiel: 'EZK', yeh: 'EZK', ezekiel: 'EZK',
  daniel: 'DAN', dan: 'DAN',
  hosea: 'HOS', hos: 'HOS',
  yoel: 'JOL', joel: 'JOL',
  amos: 'AMO',
  obaja: 'OBA', oba: 'OBA', obadiah: 'OBA',
  yunus: 'JON', yun: 'JON', jonah: 'JON',
  mikha: 'MIC', mik: 'MIC', micah: 'MIC',
  nahum: 'NAM', nah: 'NAM',
  habakuk: 'HAB', hab: 'HAB', habakkuk: 'HAB',
  zefanya: 'ZEP', zef: 'ZEP', zephaniah: 'ZEP',
  hagai: 'HAG', hag: 'HAG', haggai: 'HAG',
  zakharia: 'ZEC', zak: 'ZEC', zechariah: 'ZEC',
  maleakhi: 'MAL', mal: 'MAL', malachi: 'MAL',
  // Perjanjian Baru
  matius: 'MAT', mat: 'MAT', matthew: 'MAT',
  markus: 'MRK', mrk: 'MRK', mark: 'MRK',
  lukas: 'LUK', luk: 'LUK', luke: 'LUK',
  yohanes: 'JHN', yoh: 'JHN', john: 'JHN',
  'kisah para rasul': 'ACT', 'kisah rasul': 'ACT', kis: 'ACT', acts: 'ACT',
  roma: 'ROM', rom: 'ROM', romans: 'ROM',
  '1 korintus': '1CO', '1korintus': '1CO', '1 kor': '1CO', '1kor': '1CO', '1 corinthians': '1CO',
  '2 korintus': '2CO', '2korintus': '2CO', '2 kor': '2CO', '2kor': '2CO', '2 corinthians': '2CO',
  galatia: 'GAL', gal: 'GAL', galatians: 'GAL',
  efesus: 'EPH', ef: 'EPH', efs: 'EPH', ephesians: 'EPH',
  filipi: 'PHP', flp: 'PHP', philippians: 'PHP',
  kolose: 'COL', kol: 'COL', colossians: 'COL',
  '1 tesalonika': '1TH', '1tes': '1TH', '1 tes': '1TH', '1 thessalonians': '1TH',
  '2 tesalonika': '2TH', '2tes': '2TH', '2 tes': '2TH', '2 thessalonians': '2TH',
  '1 timotius': '1TI', '1tim': '1TI', '1 tim': '1TI', '1 timothy': '1TI',
  '2 timotius': '2TI', '2tim': '2TI', '2 tim': '2TI', '2 timothy': '2TI',
  titus: 'TIT', tit: 'TIT',
  filemon: 'PHM', flm: 'PHM', philemon: 'PHM',
  ibrani: 'HEB', ibr: 'HEB', hebrews: 'HEB',
  yakobus: 'JAS', yak: 'JAS', james: 'JAS',
  '1 petrus': '1PE', '1pet': '1PE', '1 pet': '1PE', '1ptr': '1PE', '1 peter': '1PE',
  '2 petrus': '2PE', '2pet': '2PE', '2 pet': '2PE', '2ptr': '2PE', '2 peter': '2PE',
  '1 yohanes': '1JN', '1yoh': '1JN', '1 yoh': '1JN', '1 john': '1JN',
  '2 yohanes': '2JN', '2yoh': '2JN', '2 yoh': '2JN', '2 john': '2JN',
  '3 yohanes': '3JN', '3yoh': '3JN', '3 yoh': '3JN', '3 john': '3JN',
  yudas: 'JUD', yud: 'JUD', jude: 'JUD',
  wahyu: 'REV', why: 'REV', revelation: 'REV',
};

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

// Longest aliases first so "1 yohanes" wins over "yohanes".
const ALIAS_PATTERN = Object.keys(ALIASES)
  .sort((a, b) => b.length - a.length)
  .map(escapeRe)
  .join('|');

// "Ayub 42:5", "yoh 3:16-18" — case-insensitive, needs chapter:verse to match
// so ordinary words like "dan" never trigger on their own.
export const BIBLE_REF_REGEX = new RegExp(
  `(?:^|[^\\w])(${ALIAS_PATTERN})\\.?\\s?(\\d{1,3}):(\\d{1,3})(?:-(\\d{1,3}))?`,
  'gi',
);

// Resolve a regex match into navigation data, or null if unknown.
export function resolveRef(bookAlias, chapter, verse) {
  const bookId = ALIASES[bookAlias.toLowerCase().trim()];
  if (!bookId) return null;
  return {
    bookId,
    bookName: BOOK_NAMES[bookId],
    chapter: parseInt(chapter, 10),
    verse: parseInt(verse, 10),
    chapterId: `${bookId}.${parseInt(chapter, 10)}`,
  };
}
