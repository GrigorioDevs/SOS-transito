// Serviços: reaproveita o CatalogoPage (única integração real com a API: GET /api/servicos).
import CatalogoPage from '../../catalogo/CatalogoPage.jsx';
import { Bloco } from '../campos';

export default function SecaoServicos() {
  return (
    <Bloco titulo="Serviços disponíveis" descricao="Lista vinda do back-end (GET /api/servicos). Se o back-end não estiver rodando, aparece o erro com “Tentar novamente”.">
      <CatalogoPage />
    </Bloco>
  );
}
