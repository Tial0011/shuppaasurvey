import { useEffect, useState } from 'react';
import { useSurveyConfig } from '@/hooks/useSurveyConfig';
import { Icon } from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';
import { saveQuestions } from '@/services/adminService';
import { DEFAULT_QUESTIONS } from '@/config/defaultSurvey';
import type { Question, QuestionTag, QuestionType } from '@/lib/types';

const TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single', label: 'Single choice' },
  { value: 'multi', label: 'Multiple choice' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'rating', label: 'Rating (1 to 5)' },
  { value: 'text', label: 'Short text' },
  { value: 'longtext', label: 'Long text' },
];
const hasOptions = (t: QuestionType) => t === 'single' || t === 'multi';

export default function Builder() {
  const { questions: live } = useSurveyConfig();
  const [items, setItems] = useState<Question[]>(live);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Pick up the saved version once it arrives, but never overwrite unsaved edits.
  useEffect(() => { if (!dirty) setItems(live); }, [live, dirty]);

  const update = (i: number, patch: Partial<Question>) => {
    setItems((list) => list.map((q, idx) => {
      if (idx !== i) {
        // Only one question may carry each special tag.
        if (patch.tag && patch.tag !== 'none' && q.tag === patch.tag) return { ...q, tag: 'none' };
        return q;
      }
      return { ...q, ...patch };
    }));
    setDirty(true);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setItems(copy); setDirty(true);
  };
  const remove = (i: number) => {
    if (!confirm('Remove this question? Existing answers stay saved but won’t show in insights.')) return;
    setItems(items.filter((_, idx) => idx !== i)); setDirty(true);
  };
  const add = () => {
    setItems([...items, { id: `q_${Date.now().toString(36)}`, type: 'single', label: '', required: true, options: ['Option 1', 'Option 2'] }]);
    setDirty(true);
  };
  const reset = () => {
    if (!confirm('Replace the current questions with the default starter survey?')) return;
    setItems(DEFAULT_QUESTIONS); setDirty(true);
  };

  const save = async () => {
    const cleaned: Question[] = items.map((q) => {
      const out: Question = { id: q.id, type: q.type, label: q.label.trim(), required: q.required };
      if (q.help?.trim()) out.help = q.help.trim();
      if (hasOptions(q.type)) {
        out.options = (q.options ?? []).map((o) => o.trim()).filter(Boolean);
        out.allowOther = Boolean(q.allowOther);
      }
      if (q.type === 'rating') {
        if (q.ratingLow?.trim()) out.ratingLow = q.ratingLow.trim();
        if (q.ratingHigh?.trim()) out.ratingHigh = q.ratingHigh.trim();
      }
      if (q.tag && q.tag !== 'none') out.tag = q.tag;
      return out;
    });
    if (cleaned.length === 0) return setToast('Add at least one question.');
    const bad = cleaned.findIndex((q) => !q.label || (hasOptions(q.type) && (q.options?.length ?? 0) < 2));
    if (bad >= 0) return setToast(`Question ${bad + 1} needs a title${hasOptions(cleaned[bad].type) ? ' and at least 2 options' : ''}.`);
    setSaving(true);
    try { await saveQuestions(cleaned); setItems(cleaned); setDirty(false); setToast('Survey saved and live'); }
    catch { setToast('Could not save. Are you an admin?'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Survey builder</h1><p>Edit, add and reorder questions. Changes go live for everyone as soon as you save.</p></div>
        <button className="btn btn-ghost btn-sm" onClick={reset}>Reset to starter survey</button>
      </div>

      {items.map((q, i) => (
        <section className="card builder-item" key={q.id}>
          <div className="builder-top">
            <span className="builder-num">{i + 1}</span>
            <input className="input" placeholder="Question" value={q.label} maxLength={200} onChange={(e) => update(i, { label: e.target.value })} />
          </div>
          <div className="builder-row">
            <div className="field"><label>Type</label>
              <select className="select" value={q.type} onChange={(e) => {
                const type = e.target.value as QuestionType;
                update(i, { type, options: hasOptions(type) ? (q.options?.length ? q.options : ['Option 1', 'Option 2']) : undefined });
              }}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select></div>
            <div className="field"><label>Helper text (optional)</label>
              <input className="input" value={q.help ?? ''} maxLength={200} onChange={(e) => update(i, { help: e.target.value })} /></div>
          </div>

          {hasOptions(q.type) && (
            <div className="field"><label>Options (one per line)</label>
              <textarea className="textarea" style={{ minHeight: 100 }} value={(q.options ?? []).join('\n')}
                onChange={(e) => update(i, { options: e.target.value.split('\n') })} /></div>
          )}
          {q.type === 'rating' && (
            <div className="builder-row">
              <div className="field"><label>Label for 1</label><input className="input" value={q.ratingLow ?? ''} onChange={(e) => update(i, { ratingLow: e.target.value })} /></div>
              <div className="field"><label>Label for 5</label><input className="input" value={q.ratingHigh ?? ''} onChange={(e) => update(i, { ratingHigh: e.target.value })} /></div>
            </div>
          )}
          {hasOptions(q.type) && (
            <div className="field"><label>Special role</label>
              <select className="select" value={q.tag ?? 'none'} onChange={(e) => update(i, { tag: e.target.value as QuestionTag })}>
                <option value="none">None</option>
                <option value="unimed">UNIMED check (first option = UNIMED student)</option>
                <option value="heard">“How did you hear about us?” (feeds source tracking)</option>
              </select></div>
          )}

          <div className="builder-actions">
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <label className="check"><input type="checkbox" checked={q.required} onChange={(e) => update(i, { required: e.target.checked })} /> Required</label>
              {hasOptions(q.type) && <label className="check"><input type="checkbox" checked={Boolean(q.allowOther)} onChange={(e) => update(i, { allowOther: e.target.checked })} /> Allow “Other”</label>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="up" size={14} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><Icon name="down" size={14} /></button>
              <button className="btn btn-danger btn-sm" onClick={() => remove(i)} aria-label="Remove"><Icon name="trash" size={14} /></button>
            </div>
          </div>
        </section>
      ))}

      <button className="btn btn-ghost" onClick={add}><Icon name="plus" size={16} /> Add question</button>

      <div className="sticky-save">
        <span className="muted">{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        <button className="btn btn-primary" onClick={save} disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save & publish'}</button>
      </div>
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
