import type { Question, SurveyResponse } from '@/lib/types';
import { prettySource } from './source';

export interface Count { key: string; label: string; count: number }

export function bySource(responses: SurveyResponse[]): Count[] {
  const m = new Map<string, number>();
  responses.forEach((r) => m.set(r.source, (m.get(r.source) ?? 0) + 1));
  return [...m.entries()]
    .map(([key, count]) => ({ key, label: prettySource(key), count }))
    .sort((a, b) => b.count - a.count);
}

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Responses per day for the last `days` days (oldest first). */
export function perDay(responses: SurveyResponse[], days: number) {
  const out: { date: string; label: string; count: number }[] = [];
  const counts = new Map<string, number>();
  responses.forEach((r) => {
    const k = dayKey(r.createdAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  });
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const k = dayKey(d);
    out.push({
      date: k,
      label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      count: counts.get(k) ?? 0,
    });
  }
  return out;
}

/** Which campaign day is it (1-based)? 0 if the campaign hasn't started. */
export function campaignDay(start: string): number {
  const s = new Date(start + 'T00:00:00');
  if (isNaN(s.getTime())) return 0;
  const diff = Math.floor((Date.now() - s.getTime()) / 86_400_000) + 1;
  return diff < 1 ? 0 : diff;
}

export interface QuestionStat {
  question: Question;
  total: number;
  counts: Count[];       // choice / yesno / rating distribution
  average?: number;      // rating
  texts: { text: string; at: Date }[]; // free text and "Other"
}

export function questionStats(q: Question, responses: SurveyResponse[]): QuestionStat {
  const counts = new Map<string, number>();
  const texts: { text: string; at: Date }[] = [];
  let total = 0;
  let sum = 0;
  let ratingN = 0;

  const bump = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1);
  const known = new Set(q.options ?? []);

  for (const r of responses) {
    const a = r.answers[q.id];
    if (a === undefined || a === '' || (Array.isArray(a) && a.length === 0)) continue;
    total++;
    switch (q.type) {
      case 'single':
      case 'multi': {
        const list = Array.isArray(a) ? a : [String(a)];
        list.forEach((v) => {
          if (known.has(v)) bump(v);
          else {
            bump('Other');
            texts.push({ text: v.replace(/^Other:\s*/i, ''), at: r.createdAt });
          }
        });
        break;
      }
      case 'yesno':
        bump(String(a));
        break;
      case 'rating':
        bump(String(a));
        sum += Number(a);
        ratingN++;
        break;
      default:
        texts.push({ text: String(a), at: r.createdAt });
    }
  }

  let list: Count[] = [];
  if (q.type === 'rating') {
    list = [1, 2, 3, 4, 5].map((n) => ({ key: String(n), label: String(n), count: counts.get(String(n)) ?? 0 }));
  } else if (q.type === 'yesno') {
    list = ['Yes', 'No'].map((k) => ({ key: k, label: k, count: counts.get(k) ?? 0 }));
  } else if (q.type === 'single' || q.type === 'multi') {
    const opts = [...(q.options ?? [])];
    if (counts.has('Other')) opts.push('Other');
    list = opts.map((k) => ({ key: k, label: k, count: counts.get(k) ?? 0 }));
  }

  texts.sort((a, b) => b.at.getTime() - a.at.getTime());
  return { question: q, total, counts: list, average: ratingN ? sum / ratingN : undefined, texts };
}
