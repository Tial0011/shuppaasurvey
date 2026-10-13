import type { AnswerValue, Question } from '@/lib/types';
import { Icon } from '@/components/ui/Icon';

interface Props {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue, advance?: boolean) => void;
}

const OTHER = 'Other:';
const isOther = (v: string) => v.startsWith(OTHER);
const otherText = (v: string) => v.slice(OTHER.length).trimStart();

function Mark({ multi }: { multi?: boolean }) {
  return <span className={`mark${multi ? ' multi' : ''}`}><Icon name="check" /></span>;
}

export function QuestionField({ question: q, value, onChange }: Props) {
  /* ---- single choice / yes-no ---- */
  if (q.type === 'single') {
    const current = typeof value === 'string' ? value : '';
    const otherSelected = isOther(current);
    return (
      <div className="q-body" role="radiogroup" aria-label={q.label}>
        {(q.options ?? []).map((o) => (
          <button type="button" key={o} role="radio" aria-checked={current === o}
            className={`option${current === o ? ' selected' : ''}`}
            onClick={() => onChange(o, true)}>
            <Mark />{o}
          </button>
        ))}
        {q.allowOther && (
          <>
            <button type="button" role="radio" aria-checked={otherSelected}
              className={`option${otherSelected ? ' selected' : ''}`}
              onClick={() => onChange(`${OTHER} `)}>
              <Mark />Other
            </button>
            {otherSelected && (
              <input className="input" autoFocus placeholder="Please specify"
                value={otherText(current)} maxLength={120}
                onChange={(e) => onChange(`${OTHER} ${e.target.value}`)} />
            )}
          </>
        )}
      </div>
    );
  }

  if (q.type === 'yesno') {
    return (
      <div className="q-body">
        <div className="yesno" role="radiogroup" aria-label={q.label}>
          {['Yes', 'No'].map((o) => (
            <button type="button" key={o} role="radio" aria-checked={value === o}
              className={`option${value === o ? ' selected' : ''}`} onClick={() => onChange(o, true)}>
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---- multiple choice ---- */
  if (q.type === 'multi') {
    const list = Array.isArray(value) ? value : [];
    const known = list.filter((v) => !isOther(v));
    const other = list.find(isOther);
    const toggle = (o: string) =>
      onChange(list.includes(o) ? list.filter((x) => x !== o) : [...list, o]);
    return (
      <div className="q-body" role="group" aria-label={q.label}>
        {(q.options ?? []).map((o) => (
          <button type="button" key={o} role="checkbox" aria-checked={known.includes(o)}
            className={`option multi${known.includes(o) ? ' selected' : ''}`} onClick={() => toggle(o)}>
            <Mark multi />{o}
          </button>
        ))}
        {q.allowOther && (
          <>
            <button type="button" role="checkbox" aria-checked={other !== undefined}
              className={`option multi${other !== undefined ? ' selected' : ''}`}
              onClick={() => onChange(other !== undefined ? known : [...known, `${OTHER} `])}>
              <Mark multi />Other
            </button>
            {other !== undefined && (
              <input className="input" autoFocus placeholder="Please specify" value={otherText(other)} maxLength={120}
                onChange={(e) => onChange([...known, `${OTHER} ${e.target.value}`])} />
            )}
          </>
        )}
      </div>
    );
  }

  /* ---- rating 1-5 ---- */
  if (q.type === 'rating') {
    return (
      <div className="q-body">
        <div className="rating" role="radiogroup" aria-label={q.label}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} role="radio" aria-checked={value === n}
              className={`option${value === n ? ' selected' : ''}`} onClick={() => onChange(n, true)}>
              {n}
            </button>
          ))}
        </div>
        <div className="rating-labels"><span>{q.ratingLow || '1'}</span><span>{q.ratingHigh || '5'}</span></div>
      </div>
    );
  }

  /* ---- text ---- */
  if (q.type === 'longtext') {
    return (
      <div className="q-body">
        <textarea className="textarea" autoFocus maxLength={1000} placeholder="Type your answer…"
          value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div className="q-body">
      <input className="input" autoFocus maxLength={200} placeholder="Type your answer…"
        value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Validate an answer against the current question definition, not just whether it is non-empty. */
export function isAnswered(q: Question, v: AnswerValue | undefined): boolean {
  if (v === undefined) return false;

  if (q.type === 'rating') {
    return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;
  }

  if (q.type === 'yesno') return v === 'Yes' || v === 'No';

  if (q.type === 'multi') {
    if (!Array.isArray(v) || v.length === 0) return false;
    const options = q.options ?? [];
    const seen = new Set<string>();
    for (const answer of v) {
      if (typeof answer !== 'string' || !answer.trim() || seen.has(answer)) return false;
      seen.add(answer);
      if (isOther(answer)) {
        if (!q.allowOther || !otherText(answer).trim()) return false;
      } else if (!options.includes(answer)) {
        return false;
      }
    }
    return true;
  }

  if (typeof v !== 'string' || !v.trim()) return false;
  if (isOther(v)) return Boolean(q.allowOther && otherText(v).trim());
  if (q.type === 'single') return (q.options ?? []).includes(v);
  // Text answers must contain something other than whitespace.
  return v.trim().length > 0;
}
