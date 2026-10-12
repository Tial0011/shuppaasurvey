import { useMemo } from 'react';
import { useResponses } from '@/hooks/useResponses';
import { useSurveyConfig } from '@/hooks/useSurveyConfig';
import { Spinner } from '@/components/ui/Spinner';
import { bySource, campaignDay, perDay } from '@/utils/stats';
import { BarList, LineChart, StatCard } from '../components/Charts';

export default function Dashboard() {
  const { responses, loading, error, visits, starts } = useResponses();
  const { settings, questions } = useSurveyConfig();

  const data = useMemo(() => {
    const total = responses.length;
    const early = responses.filter((r) => r.contact && (r.contact.email || r.contact.phone)).length;
    const unimedKnown = responses.filter((r) => r.isUnimed !== null).length;
    const unimed = responses.filter((r) => r.isUnimed).length;
    const avg = total ? Math.round(responses.reduce((s, r) => s + r.durationSec, 0) / total) : 0;
    return { total, early, unimedKnown, unimed, avg, sources: bySource(responses), days: perDay(responses, 14) };
  }, [responses]);

  if (loading) return <Spinner />;

  const day = campaignDay(settings.campaignStart);
  const completion = starts ? Math.min(100, Math.round((data.total / starts) * 100)) : 0;
  const hasUnimedQ = questions.some((q) => q.tag === 'unimed');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>{day > 0 ? (day <= 14 ? `Campaign day ${day} of 14 (main push)` : `Campaign day ${day} (continuous phase)`) : 'Campaign hasn’t started yet'}</p>
        </div>
      </div>
      {error && <p className="notice danger" style={{ marginBottom: 16 }}>Couldn’t load responses: {error}</p>}

      <div className="stat-grid">
        <StatCard primary label="Survey responses" value={data.total}
          sub={`Target: ${settings.responseTarget} · ${Math.min(100, Math.round((data.total / Math.max(1, settings.responseTarget)) * 100))}%`}
          progress={(data.total / Math.max(1, settings.responseTarget)) * 100} />
        <StatCard label="Early-access sign-ups" value={data.early} sub="Left contact details" />
        <StatCard label="Survey link clicks" value={visits} sub="Unique sessions" />
        <StatCard label="Completion rate" value={`${completion}%`} sub={`${data.total} finished of ${starts} started`} />
        <StatCard label="UNIMED share" value={hasUnimedQ && data.unimedKnown ? `${Math.round((data.unimed / data.unimedKnown) * 100)}%` : '–'}
          sub={`${data.unimed} of ${data.unimedKnown} answered`} />
        <StatCard label="Avg. time to finish" value={data.avg ? `${Math.floor(data.avg / 60)}m ${data.avg % 60}s` : '–'} sub="Target is about 3 minutes" />
      </div>

      <div className="panel-grid">
        <section className="card panel">
          <h3>Responses per day</h3>
          <p className="panel-sub">Last 14 days</p>
          <LineChart data={data.days} />
        </section>
        <section className="card panel">
          <h3>Responses by source</h3>
          <p className="panel-sub">Tracked links first, then “how did you hear about us?”</p>
          <BarList items={data.sources} teal />
        </section>
      </div>
    </>
  );
}
