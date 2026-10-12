import { useMemo, useState } from 'react';
import { useResponses } from '@/hooks/useResponses';
import { useSurveyConfig } from '@/hooks/useSurveyConfig';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';
import { deleteResponse } from '@/services/adminService';
import { downloadCsv, responsesToCsv } from '@/utils/csv';
import { prettySource } from '@/utils/source';
import type { SurveyResponse } from '@/lib/types';

export default function Responses() {
  const { responses, loading } = useResponses();
  const { questions } = useSurveyConfig();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [audience, setAudience] = useState('all');
  const [contactOnly, setContactOnly] = useState(false);
  const [open, setOpen] = useState<SurveyResponse | null>(null);
  const [toast, setToast] = useState('');

  const sources = useMemo(() => [...new Set(responses.map((r) => r.source))].sort(), [responses]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return responses.filter((r) => {
      if (source !== 'all' && r.source !== source) return false;
      if (audience === 'unimed' && r.isUnimed !== true) return false;
      if (audience === 'other' && r.isUnimed !== false) return false;
      if (contactOnly && !(r.contact && (r.contact.email || r.contact.phone))) return false;
      if (!s) return true;
      const hay = [r.contact?.name, r.contact?.email, r.contact?.phone, ...Object.values(r.answers).map((a) => (Array.isArray(a) ? a.join(' ') : String(a)))]
        .join(' ').toLowerCase();
      return hay.includes(s);
    });
  }, [responses, search, source, audience, contactOnly]);

  const remove = async (r: SurveyResponse) => {
    if (!confirm('Delete this response permanently?')) return;
    try { await deleteResponse(r.id); setOpen(null); setToast('Response deleted'); }
    catch { setToast('Could not delete. Check permissions.'); }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="page-head">
        <div><h1>Responses</h1><p>{filtered.length} of {responses.length} shown</p></div>
        <button className="btn btn-primary" disabled={!filtered.length}
          onClick={() => downloadCsv(`shuppaa-responses-${new Date().toISOString().slice(0, 10)}.csv`, responsesToCsv(filtered, questions))}>
          <Icon name="download" size={16} /> Export CSV
        </button>
      </div>

      <div className="toolbar">
        <input className="input grow" placeholder="Search answers, names, emails…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source">
          <option value="all">All sources</option>
          {sources.map((s) => <option key={s} value={s}>{prettySource(s)}</option>)}
        </select>
        <select className="select" value={audience} onChange={(e) => setAudience(e.target.value)} aria-label="Audience">
          <option value="all">Everyone</option><option value="unimed">UNIMED students</option><option value="other">Others</option>
        </select>
        <label className="check"><input type="checkbox" checked={contactOnly} onChange={(e) => setContactOnly(e.target.checked)} /> Early access only</label>
      </div>

      <div className="card table-wrap">
        {filtered.length === 0 ? <div className="empty">No responses match.</div> : (
          <table className="table">
            <thead><tr><th>Date</th><th>Source</th><th>UNIMED</th><th>Contact</th><th>Time</th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="clickable" onClick={() => setOpen(r)}>
                  <td>{r.createdAt.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td><span className="pill">{prettySource(r.source)}</span></td>
                  <td>{r.isUnimed === null ? '–' : r.isUnimed ? 'Yes' : 'No'}</td>
                  <td>{r.contact ? (r.contact.name || r.contact.email || r.contact.phone) : <span className="muted">–</span>}</td>
                  <td>{Math.floor(r.durationSec / 60)}m {r.durationSec % 60}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <>
          <div className="drawer-back" onClick={() => setOpen(null)} />
          <aside className="drawer" role="dialog" aria-label="Response details">
            <div className="page-head" style={{ marginBottom: 12 }}>
              <div><h1 style={{ fontSize: 22 }}>Response</h1><p>{open.createdAt.toLocaleString()} · {prettySource(open.source)}</p></div>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(null)} aria-label="Close"><Icon name="close" size={16} /></button>
            </div>
            {open.contact && (
              <div className="qa"><div className="q">Early access contact</div>
                <div className="a">{[open.contact.name, open.contact.phone, open.contact.email].filter(Boolean).join(' · ') || '–'}</div></div>
            )}
            {questions.map((q) => {
              const a = open.answers[q.id];
              return (
                <div className="qa" key={q.id}>
                  <div className="q">{q.label}</div>
                  <div className="a">{a === undefined || a === '' ? <span className="muted">No answer</span> : Array.isArray(a) ? a.join(', ') : String(a)}</div>
                </div>
              );
            })}
            <button className="btn btn-danger btn-sm" style={{ marginTop: 18 }} onClick={() => remove(open)}><Icon name="trash" size={14} /> Delete response</button>
          </aside>
        </>
      )}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
