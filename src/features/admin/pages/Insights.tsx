import { useMemo } from 'react';
import { useResponses } from '@/hooks/useResponses';
import { useSurveyConfig } from '@/hooks/useSurveyConfig';
import { Spinner } from '@/components/ui/Spinner';
import { questionStats } from '@/utils/stats';
import { BarList } from '../components/Charts';

export default function Insights() {
  const { responses, loading } = useResponses();
  const { questions } = useSurveyConfig();
  const stats = useMemo(() => questions.map((q) => questionStats(q, responses)), [questions, responses]);

  if (loading) return <Spinner />;

  return (
    <>
      <div className="page-head">
        <div><h1>Insights</h1><p>What people said, question by question. Use these to test the campaign hypothesis and share results.</p></div>
      </div>
      {responses.length === 0 && <div className="card empty">No responses yet. Insights appear as soon as people start answering.</div>}
      {responses.length > 0 && stats.map((s) => (
        <section className="card insight" key={s.question.id}>
          <h3>{s.question.label}</h3>
          <p className="meta">
            {s.total} answer{s.total === 1 ? '' : 's'}
            {s.average !== undefined && ` · average ${s.average.toFixed(1)} / 5${s.question.ratingHigh ? ` (5 = ${s.question.ratingHigh.toLowerCase()})` : ''}`}
          </p>
          {s.counts.length > 0 && <BarList items={s.counts} />}
          {s.texts.length > 0 && (
            <div className="quote-list" style={{ marginTop: s.counts.length ? 18 : 0 }}>
              {s.texts.slice(0, 50).map((t, i) => <div className="quote" key={i}>{t.text}</div>)}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
