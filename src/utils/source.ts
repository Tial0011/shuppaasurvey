const KEY = 'shuppaa_src';

/** Clean a ?src= value so it is safe to store and group by. */
export function cleanSource(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
}

/** Read ?src= from the URL once and remember it for the rest of the session. */
export function captureSource(): string {
  try {
    const fromUrl = cleanSource(new URLSearchParams(window.location.search).get('src'));
    if (fromUrl) sessionStorage.setItem(KEY, fromUrl);
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

export function getSource(): string {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

/** Turn a "How did you hear about us?" answer into a source key. */
export function sourceFromAnswer(answer: string | null | undefined): string {
  if (!answer) return '';
  const a = answer.toLowerCase();
  if (a.includes('instagram')) return 'instagram';
  if (a.includes('twitter') || /\bx\b/.test(a)) return 'x';
  if (a.includes('linkedin')) return 'linkedin';
  if (a.includes('tiktok')) return 'tiktok';
  if (a.includes('whatsapp')) return 'whatsapp';
  if (a.includes('leader')) return 'student-leader';
  if (a.includes('friend')) return 'friend';
  return 'other';
}

export function prettySource(key: string): string {
  const map: Record<string, string> = {
    instagram: 'Instagram',
    x: 'X (Twitter)',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    whatsapp: 'WhatsApp',
    partner: 'Partners',
    'student-leader': 'Student leader',
    friend: 'A friend',
    direct: 'Direct / unknown',
    other: 'Other',
  };
  return map[key] ?? key;
}
