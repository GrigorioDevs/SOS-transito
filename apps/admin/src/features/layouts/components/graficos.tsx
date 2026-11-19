// Ícones e gráficos leves em SVG, sem dependências externas.
// No produto final, os gráficos podem migrar para @mui/x-charts e o mapa para Leaflet.
import type { ReactNode } from 'react';
import type { TipoProva } from '../mock/tipos';

const paths: Record<string, ReactNode> = {
  dash: <path d="M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z" />,
  siren: <path d="M7 18v-6a5 5 0 0 1 10 0v6M5 21h14M12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4" />,
  users: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />,
  tag: <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01" />,
  map: <path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15" />,
  alert: <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" />,
  cog: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  search: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" />,
  bell: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  wallet: <path d="M20 7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h15V7M16 14h.01" />,
  plus: <path d="M12 5v14M5 12h14" />,
  filter: <path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z" />,
  history: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 3" />,
};
export type NomeIcone = keyof typeof paths;

export function Ic({ n, s = 20 }: { n: NomeIcone; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[n]}</svg>
  );
}

export function Spark({ data, w = 90, h = 28, color = 'currentColor' }: { data: number[]; w?: number; h?: number; color?: string }) {
  const mx = Math.max(...data), mn = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 2 - ((v - mn) / (mx - mn || 1)) * (h - 4)}`).join(' ');
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

interface LinhasProps {
  a: number[]; b: number[]; labels?: string[];
  w: number; h: number; c1: string; c2: string; grid?: string; labelColor?: string;
}
export function Linhas({ a, b, labels, w, h, c1, c2, grid = '#0001', labelColor = '#888' }: LinhasProps) {
  const mx = Math.max(...a, ...b) * 1.1 || 1, n = a.length, pl = 6, pb = labels ? 18 : 4;
  const X = (i: number) => pl + (i * (w - pl * 2)) / (n - 1);
  const Y = (v: number) => h - pb - (v / mx) * (h - pb - 6);
  const p = (arr: number[]) => arr.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  const area = (arr: number[]) => `${X(0)},${Y(0)} ${p(arr)} ${X(n - 1)},${Y(0)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={0} x2={w} y1={Y(mx * f / 1.1)} y2={Y(mx * f / 1.1)} stroke={grid} />)}
      <polygon points={area(a)} fill={c1} opacity={0.12} />
      <polyline points={p(a)} fill="none" stroke={c1} strokeWidth={2.5} strokeLinejoin="round" />
      <polygon points={area(b)} fill={c2} opacity={0.14} />
      <polyline points={p(b)} fill="none" stroke={c2} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={X(n - 1)} cy={Y(a[n - 1])} r={4} fill={c1} />
      <circle cx={X(n - 1)} cy={Y(b[n - 1])} r={4} fill={c2} />
      {labels?.map((l, i) => <text key={l} x={X(i)} y={h - 3} fontSize={10} fill={labelColor} textAnchor="middle">{l}</text>)}
    </svg>
  );
}

export function Rosca({ size, segs, track = '#0001', thick = 14 }: { size: number; segs: [number, string][]; track?: string; thick?: number }) {
  const r = (size - thick) / 2, C = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thick} />
      {segs.map(([pct, cor], i) => {
        const L = (C * pct) / 100;
        const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cor} strokeWidth={thick} strokeDasharray={`${Math.max(L - 2, 0)} ${C}`} strokeDashoffset={-off} />;
        off += L;
        return el;
      })}
    </svg>
  );
}

export interface CoresMapa {
  bg: string; road: string; major: string; water: string; park: string;
  pins: { a: string; b: string; c: string }; pinStroke?: string; heat?: string; seed?: number;
}

// Mapa ilustrativo (placeholder do Leaflet).
export function MapaFake({ c, calor = true }: { c: CoresMapa; calor?: boolean }) {
  let seed = c.seed ?? 7;
  const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const W = 1000, H = 700;
  const vs = Array.from({ length: 22 }, () => { const x = r() * W; return [x, x + (r() - 0.5) * 120, 2 + r() * 3]; });
  const hs = Array.from({ length: 16 }, () => { const y = r() * H; return [y, y + (r() - 0.5) * 140, 2 + r() * 3]; });
  const pins: [number, number, 'a' | 'b' | 'c'][] = [[300, 290, 'a'], [520, 380, 'b'], [380, 200, 'a'], [610, 520, 'c'], [180, 470, 'b'], [820, 260, 'a'], [460, 590, 'b'], [720, 120, 'c']];
  const gid = `hg${c.seed ?? 7}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ display: 'block' }}>
      <rect width={W} height={H} fill={c.bg} />
      <path d="M640 0 C 600 160, 720 260, 680 400 S 760 600, 720 700 L 800 700 C 840 600, 760 460, 790 360 S 700 120, 720 0 Z" fill={c.water} />
      <rect x={120} y={380} width={200} height={140} rx={18} fill={c.park} />
      <rect x={420} y={80} width={120} height={90} rx={14} fill={c.park} />
      {vs.map(([x1, x2, sw], i) => <line key={`v${i}`} x1={x1} y1={0} x2={x2} y2={H} stroke={c.road} strokeWidth={sw} />)}
      {hs.map(([y1, y2, sw], i) => <line key={`h${i}`} x1={0} y1={y1} x2={W} y2={y2} stroke={c.road} strokeWidth={sw} />)}
      <path d="M0 520 C 250 470, 420 560, 1000 300" stroke={c.major} strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d="M250 0 C 300 250, 200 450, 330 700" stroke={c.major} strokeWidth={10} fill="none" />
      {c.heat && calor && (
        <>
          <defs><radialGradient id={gid}><stop offset="0" stopColor={c.heat} stopOpacity={0.55} /><stop offset="1" stopColor={c.heat} stopOpacity={0} /></radialGradient></defs>
          {[[300, 300, 180], [560, 420, 140], [820, 200, 120]].map(([x, y, rr]) => <circle key={x} cx={x} cy={y} r={rr} fill={`url(#${gid})`} />)}
        </>
      )}
      {pins.map(([x, y, k], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={20} fill={c.pins[k]} opacity={0.18} />
          <circle cx={x} cy={y} r={9} fill={c.pins[k]} stroke={c.pinStroke ?? '#fff'} strokeWidth={3} />
        </g>
      ))}
    </svg>
  );
}

// Miniatura de prova anexada (foto, print de conversa ou rota GPS).
export function Prova({ tipo, w = 72, h = 56, dark = false }: { tipo: TipoProva; w?: number; h?: number; dark?: boolean }) {
  if (tipo === 'chat') return (
    <svg width={w} height={h} viewBox="0 0 72 56" role="img" aria-label="Print da conversa">
      <rect width={72} height={56} rx={8} fill={dark ? '#1B2740' : '#F3F1EC'} />
      <rect x={8} y={8} width={38} height={10} rx={5} fill={dark ? '#34476B' : '#D9D3C7'} />
      <rect x={26} y={22} width={38} height={10} rx={5} fill="#5AA8FF" />
      <rect x={8} y={36} width={30} height={10} rx={5} fill={dark ? '#34476B' : '#D9D3C7'} />
    </svg>
  );
  if (tipo === 'gps') return (
    <svg width={w} height={h} viewBox="0 0 72 56" role="img" aria-label="Rota GPS">
      <rect width={72} height={56} rx={8} fill={dark ? '#13233A' : '#E4EDE3'} />
      <path d="M0 40 Q30 20 72 30" stroke={dark ? '#2C4266' : '#fff'} strokeWidth={5} fill="none" />
      <path d="M20 0 L28 56" stroke={dark ? '#2C4266' : '#fff'} strokeWidth={4} />
      <circle cx={44} cy={26} r={6} fill="#E5383B" stroke="#fff" strokeWidth={2} />
    </svg>
  );
  return (
    <svg width={w} height={h} viewBox="0 0 72 56" role="img" aria-label="Foto">
      <rect width={72} height={56} rx={8} fill={dark ? '#2B3B58' : '#BFB5A2'} />
      <path d="M6 46 L24 28 L36 38 L48 24 L66 46 Z" fill={dark ? '#56709C' : '#8C816D'} opacity={0.8} />
      <circle cx={54} cy={14} r={5} fill={dark ? '#8FA6CC' : '#F4EFE6'} />
    </svg>
  );
}

export function Provas({ lista, w, h, dark }: { lista: TipoProva[]; w?: number; h?: number; dark?: boolean }) {
  return (
    <>
      {lista.slice(0, 3).map((t, i) => <Prova key={i} tipo={t} w={w} h={h} dark={dark} />)}
      {lista.length > 3 && <span className="pmore">+{lista.length - 3}</span>}
    </>
  );
}

export const corSaude = { r: '#FF5252', y: '#FFA940', g: '#25C78A' } as const;
export const rotuloSaude = { r: 'Crítico', y: 'Atenção', g: 'Saudável' } as const;
export const iniciais = (n: string) => n.split(' ').map((s) => s[0]).slice(0, 2).join('');
