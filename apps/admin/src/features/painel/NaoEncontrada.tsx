import { Link, useLocation } from 'react-router';
import { Ic } from '../layouts/components/graficos';

export default function NaoEncontrada() {
  const { pathname } = useLocation();
  return (
    <section className="card vazio" aria-labelledby="nao-encontrada">
      <Ic n="search" s={32} />
      <h2 id="nao-encontrada">Página não encontrada</h2>
      <p>O endereço <code>{pathname}</code> não existe no painel.</p>
      <Link className="btn" to="/visao-geral">Ir para a Visão geral</Link>
    </section>
  );
}
