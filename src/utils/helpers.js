export function normalizeRaidHelperToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[0-9]+$/g, '');
}

export function parseRaidHelperDate(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (!match) return new Date().toISOString().split('T')[0];
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];
  return `${year}-${month}-${day}`;
}

export function parseRaidSignupDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return new Date().toISOString().split('T')[0];

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  return new Date().toISOString().split('T')[0];
}

export function normalizeSlotKey(slotName) {
  const normalized = String(slotName || '').trim().toLowerCase();
  if (['rings', 'ring', 'ring 1', 'ring 2', 'ring 1/2', 'finger', 'fingers', 'finger 1', 'finger 2'].includes(normalized)) return 'ring';
  if (['trinkets', 'trinket', 'trinket 1', 'trinket 2', 'trinket 1/2'].includes(normalized)) return 'trinket';
  if (['two-hand', 'main hand', 'off hand', 'one hand', 'weapon'].includes(normalized)) return 'weapon';
  return normalized;
}

export function isGroupedSlot(slotName) {
  const normalized = String(slotName || '').trim().toLowerCase();
  return normalized === 'rings' || normalized === 'trinkets' || normalized === 'ring' || normalized === 'trinket' || normalized === 'finger' || normalized === 'fingers';
}

export function getWowheadTitleFromHtml(html) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (!titleMatch?.[1]) return null;

  return titleMatch[1]
    .replace(/\s*-\s*Item\s*-\s*TBC(?: Classic)?$/i, '')
    .replace(/\s*-\s*Item$/i, '')
    .trim();
}
