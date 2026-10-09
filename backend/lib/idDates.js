const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
  jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};
const MONTH_NAMES = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
const KEYWORD_RE = /expir|valid\s*(until|till|thru|through|to)|exp\.?\s*date|\bexp\b/i;

function toISO(y, m, d) {
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1) return null;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d > daysInMonth) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** All plausible dates found in OCR text, with where they were found. */
export function findDates(text) {
  const found = [];
  const push = (iso, index) => { if (iso) found.push({ iso, index }); };

  // 2031-05-17, 2031/5/17, 2031.05.17
  for (const m of text.matchAll(/\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/g)) {
    push(toISO(+m[1], +m[2], +m[3]), m.index);
  }
  // 05/17/2031 or 17/05/2031 (day-first when the first number can't be a month; otherwise MM/DD)
  for (const m of text.matchAll(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b/g)) {
    const a = +m[1];
    const b = +m[2];
    const iso = a > 12 ? toISO(+m[3], b, a) : toISO(+m[3], a, b);
    push(iso, m.index);
  }
  // May 17, 2031 / May 17 2031
  for (const m of text.matchAll(new RegExp(`\\b(${MONTH_NAMES})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'gi'))) {
    push(toISO(+m[3], MONTHS[m[1].toLowerCase()], +m[2]), m.index);
  }
  // 17 May 2031
  for (const m of text.matchAll(new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_NAMES})\\.?,?\\s+(\\d{4})\\b`, 'gi'))) {
    push(toISO(+m[3], MONTHS[m[2].toLowerCase()], +m[1]), m.index);
  }
  return found;
}

/**
 * Best guess at the expiration date: a date labelled "expires / valid until",
 * otherwise the latest date on the card (issue and birth dates come earlier).
 * @returns {string|null} YYYY-MM-DD
 */
export function extractExpirationDate(text) {
  const dates = findDates(text);
  if (dates.length === 0) return null;

  const labelled = dates.filter((d) => KEYWORD_RE.test(text.slice(Math.max(0, d.index - 40), d.index)));
  const pool = labelled.length > 0 ? labelled : dates;
  return pool.map((d) => d.iso).sort().at(-1);
}

export function generateNote(expiryDate, idType) {
  if (!expiryDate) {
    return 'Could not detect an expiration date in the uploaded image. Make sure the image is clear and the date is visible.';
  }
  switch (idType) {
    case 'national-id':
      return 'PhilSys National IDs do not normally carry an expiration date. The detected date may be an issuance date or other number — please double-check it.';
    case 'pwd-id':
      return `Detected expiration date: ${expiryDate}. PWD IDs are typically valid for 2-5 years depending on issuance date.`;
    case 'student-id':
      return `Detected expiration date: ${expiryDate}. Student IDs are typically valid for the current academic year.`;
    default:
      return `Expiration date detected: ${expiryDate}.`;
  }
}
