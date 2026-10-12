import type { Count } from '@/utils/stats';

export function BarList({ items, teal, empty = 'No data yet.' }: { items: Count[]; teal?: boolean; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = items.reduce((s, i) => s + i.count, 0);
  if (!items.length || total === 0) return <p className="muted">{empty}</p>;
  return (
    <div className="bars">
      {items.map((i) => (
        <div className="bar-row" key={i.key}>
          <div className="bar-meta">
            <span>{i.label}</span>
            <span>{i.count} · {Math.round((i.count / total) * 100)}%</span>
          </div>
          <div className="bar-track"><div className={`bar-fill${teal ? ' teal' : ''}`} style={{ width: `${(i.count / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ data }: { data: { label: string; count: number }[] }) {
  const W = 600, H = 190, padL = 28, padR = 10, padT = 12, padB = 26;
  const max = Math.max(3, ...data.map((d) => d.count));
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(1, data.length - 1);
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const pts = data.map((d, i) => `${x(i)},${y(d.count)}`);
  const area = `${padL},${H - padB} ${pts.join(' ')} ${x(data.length - 1)},${H - padB}`;
  const ticks = [0, Math.round(max / 2), max];
  return (
    <svg className="line-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Responses per day">
      <defs>
        <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2563ec" stopOpacity=".25" /><stop offset="1" stopColor="#2563ec" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#e2e7f0" />
          <text x={padL - 6} y={y(t) + 3} textAnchor="end">{t}</text>
        </g>
      ))}
      <polygon points={area} fill="url(#lc)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#2563ec" strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.label + i}>
          <circle cx={x(i)} cy={y(d.count)} r="3.5" fill="#fff" stroke="#0bb9b7" strokeWidth="2" />
          {(i % 2 === 0 || data.length < 8) && <text x={x(i)} y={H - 8} textAnchor="middle">{d.label}</text>}
        </g>
      ))}
    </svg>
  );
}

export function StatCard(props: { label: string; value: string | number; sub?: string; primary?: boolean; progress?: number }) {
  return (
    <div className={`card stat${props.primary ? ' primary' : ''}`}>
      <div className="label">{props.label}</div>
      <div className="value">{props.value}</div>
      {props.sub && <div className="sub">{props.sub}</div>}
      {props.progress !== undefined && <div className="track"><div style={{ width: `${Math.min(100, props.progress)}%` }} /></div>}
    </div>
  );
}
