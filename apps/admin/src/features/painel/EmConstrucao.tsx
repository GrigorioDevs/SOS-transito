import { useMatches } from 'react-router';
import { Ic } from '../layouts/components/graficos';
import type { HandleRota } from './AdminLayout';

// Placeholder das seções que ainda não foram construídas.
export default function EmConstrucao() {
  const matches = useMatches();
  const titulo = (matches.at(-1)?.handle as HandleRota | undefined)?.titulo ?? 'Esta seção';
  return (
    <section className="card vazio" aria-labelledby="em-construcao">
      <Ic n="cog" s={32} />
      <h2 id="em-construcao">Em construção</h2>
      <p>A seção <b>{titulo}</b> ainda vai ser construída.</p>
    </section>
  );
}
