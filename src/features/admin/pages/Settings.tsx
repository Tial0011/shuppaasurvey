import { useEffect, useState } from 'react';
import { useSurveyConfig } from '@/hooks/useSurveyConfig';
import { Toast } from '@/components/ui/Toast';
import { saveSettings } from '@/services/adminService';
import type { Settings as SettingsT } from '@/lib/types';

export default function Settings() {
  const { settings } = useSurveyConfig();
  const [form, setForm] = useState<SettingsT>(settings);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => setForm(settings), [settings]);

  const set = <K extends keyof SettingsT>(k: K, v: SettingsT[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await saveSettings(form); setToast('Settings saved'); }
    catch { setToast('Could not save. Are you an admin?'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="page-head"><div><h1>Settings</h1><p>Campaign targets and survey wording.</p></div></div>
      <section className="card panel" style={{ display: 'grid', gap: 18, maxWidth: 720 }}>
        <label className="check">
          <input type="checkbox" checked={form.isOpen} onChange={(e) => set('isOpen', e.target.checked)} />
          Survey is open and accepting responses
        </label>
        <div className="field"><label>Survey title</label>
          <input className="input" value={form.surveyTitle} maxLength={80} onChange={(e) => set('surveyTitle', e.target.value)} /></div>
        <div className="field"><label>Intro text</label>
          <textarea className="textarea" value={form.surveyIntro} maxLength={400} onChange={(e) => set('surveyIntro', e.target.value)} /></div>
        <div className="builder-row">
          <div className="field"><label>Response target</label>
            <input className="input" type="number" min={1} value={form.responseTarget} onChange={(e) => set('responseTarget', Math.max(1, Number(e.target.value)))} />
            <span className="hint">Shown on your dashboard.</span></div>
          <div className="field"><label>Early access spots</label>
            <input className="input" type="number" min={1} value={form.earlyAccessLimit} onChange={(e) => set('earlyAccessLimit', Math.max(1, Number(e.target.value)))} />
            <span className="hint">The public “spots left” counter uses this.</span></div>
        </div>
        <div className="field"><label>Campaign start date (day 1)</label>
          <input className="input" type="date" value={form.campaignStart} onChange={(e) => set('campaignStart', e.target.value)} /></div>
        <div><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button></div>
      </section>
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
