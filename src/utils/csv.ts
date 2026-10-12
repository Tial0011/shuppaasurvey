import type { Question, SurveyResponse } from '@/lib/types';

/** Escape a CSV cell and neutralise spreadsheet formulas (=, +, -, @). */
function cell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function responsesToCsv(responses: SurveyResponse[], questions: Question[]): string {
  const header = [
    'Submitted at', 'Source', 'UNIMED student', 'Name', 'Phone', 'Email',
    ...questions.map((q) => q.label),
  ];
  const rows = responses.map((r) => [
    r.createdAt.toISOString(),
    r.source,
    r.isUnimed === null ? '' : r.isUnimed ? 'Yes' : 'No',
    r.contact?.name ?? '',
    r.contact?.phone ?? '',
    r.contact?.email ?? '',
    ...questions.map((q) => {
      const a = r.answers[q.id];
      return Array.isArray(a) ? a.join('; ') : a ?? '';
    }),
  ]);
  return [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
