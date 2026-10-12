import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';
import { SOURCE_PRESETS } from '@/config/brand';
import { cleanSource } from '@/utils/source';

export default function Links() {
  const [custom, setCustom] = useState('');
  const [leaders, setLeaders] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const base = window.location.origin;

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setToast('Link copied'); }
    catch { setToast('Copy failed. Select and copy manually.'); }
  };

  const add = () => {
    const key = cleanSource(custom);
    if (!key) return;
    if (!leaders.includes(key)) setLeaders([...leaders, key]);
    setCustom('');
  };

  const row = (label: string, key: string) => {
    const url = `${base}/?src=${key}`;
    return (
      <div className="link-item" key={key}>
        <div className="link-label">{label}</div>
        <div className="copy-row">
          <code>{url}</code>
          <button className="btn btn-ghost btn-sm" onClick={() => copy(url)}><Icon name="copy" size={14} /> Copy</button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Share links</h1><p>One tracked link per source, so the dashboard shows exactly where responses come from. Put the right one in each bio, post and flyer.</p></div>
      </div>

      <section className="card panel" style={{ marginBottom: 16 }}>
        <h3>Platforms</h3><p className="panel-sub">Use these in bios and under flyers.</p>
        <div className="link-list">{SOURCE_PRESETS.map((s) => row(s.label, s.key))}</div>
      </section>

      <section className="card panel">
        <h3>Student leaders & custom sources</h3>
        <p className="panel-sub">Give each leader their own link to see how many responses they drove (for cost per response).</p>
        <div className="toolbar">
          <input className="input grow" placeholder="e.g. leader-ada or csc-group" value={custom}
            onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn btn-primary" onClick={add}><Icon name="plus" size={16} /> Create link</button>
        </div>
        {leaders.length === 0 ? <p className="muted">Links you create appear here. Use letters, numbers, - and _ only.</p>
          : <div className="link-list">{leaders.map((k) => row(k, k))}</div>}
      </section>
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
