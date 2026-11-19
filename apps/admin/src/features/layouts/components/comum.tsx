import { useState } from 'react';
import type { Segmento } from '../mock/tipos';

export function Carregando({ cor = '#888' }: { cor?: string }) {
  return <div role="status" style={{ padding: 48, textAlign: 'center', color: cor, fontFamily: 'Inter, sans-serif' }}>Carregando dados fictícios…</div>;
}

export const segmentos: { id: Segmento; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'prestadores', label: 'Prestadores' },
];

// Grupo de botões "Todos | Clientes | Prestadores".
export function SegFiltro({ value, onChange, className = 'seg', ativo = 'on' }: {
  value: Segmento; onChange: (s: Segmento) => void; className?: string; ativo?: string;
}) {
  return (
    <div className={className} role="tablist" aria-label="Filtrar por tipo de usuário">
      {segmentos.map((s) => (
        <button key={s.id} type="button" role="tab" aria-selected={value === s.id} className={value === s.id ? ativo : ''} onClick={() => onChange(s.id)}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function useSegmento() {
  return useState<Segmento>('todos');
}
