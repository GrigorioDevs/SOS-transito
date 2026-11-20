// API FICTÍCIA do painel de OPERAÇÃO (chamados ao vivo, parceiros pendentes).
// Ainda não tem rota no menu. A governança (denúncias, usuários, bloqueios...) fica em src/api/.
import type { Chamado, PainelOperacao, ParceiroPendente, StatusChamado } from './tipos';

const atraso = (ms = 350) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------- Operação ------------------------------- */

let chamados: Chamado[] = [
  { id: '#1042', tipo: 'Borracheiro', endereco: 'Av. Paulista, 1500', status: 'a_caminho', parceiro: 'João Silva', eta: '8 min', valor: 'R$ 90', tempo: '4 min' },
  { id: '#1041', tipo: 'Guincho', endereco: 'Rod. Castelo Branco, km 25', status: 'procurando', parceiro: '—', eta: 'onda 2/3', valor: 'R$ 260', tempo: '1 min' },
  { id: '#1040', tipo: 'Eletricista', endereco: 'R. Augusta, 820', status: 'em_atendimento', parceiro: 'Marcos Lima', eta: 'no local', valor: 'R$ 140', tempo: '17 min' },
  { id: '#1039', tipo: 'Pane seca', endereco: 'Marginal Tietê, ponte Limão', status: 'chegou', parceiro: 'Ana Souza', eta: 'chegou', valor: 'R$ 75', tempo: '22 min' },
  { id: '#1038', tipo: 'Chaveiro', endereco: 'Al. Santos, 45', status: 'a_caminho', parceiro: 'Rafael Costa', eta: '12 min', valor: 'R$ 150', tempo: '9 min' },
  { id: '#1037', tipo: 'Borracheiro', endereco: 'Av. Rebouças, 3000', status: 'concluido', parceiro: 'Pedro Alves', eta: '—', valor: 'R$ 85', tempo: '41 min' },
];

let pendentes: ParceiroPendente[] = [
  { id: 'p1', nome: 'Carlos Mendes', servico: 'Guincho', docs: 4, cidade: 'Osasco', enviado: 'há 2h' },
  { id: 'p2', nome: 'Marina Alves', servico: 'Eletricista', docs: 4, cidade: 'São Paulo', enviado: 'há 5h' },
  { id: 'p3', nome: 'Paulo Rocha', servico: 'Chaveiro', docs: 3, cidade: 'Barueri', enviado: 'ontem' },
];

let tick = 0;
const proximo: Partial<Record<StatusChamado, StatusChamado>> = {
  procurando: 'a_caminho', a_caminho: 'chegou', chegou: 'em_atendimento', em_atendimento: 'concluido',
};

// A cada consulta um chamado avança de status — simula o tempo real do SignalR.
export async function buscarPainelOperacao(): Promise<PainelOperacao> {
  await atraso(250);
  tick++;
  const ativos = chamados.filter((c) => c.status !== 'concluido');
  if (tick > 1 && ativos.length) {
    const c = ativos[tick % ativos.length];
    const n = proximo[c.status];
    if (n) {
      c.status = n;
      if (n === 'a_caminho') { c.parceiro = 'Lia Torres'; c.eta = '14 min'; }
      if (n === 'chegou') c.eta = 'chegou';
      if (n === 'em_atendimento') c.eta = 'no local';
    }
    if (tick % 3 === 0) {
      const id = `#${1043 + Math.floor(tick / 3)}`;
      const novo: Chamado = { id, tipo: ['Borracheiro', 'Pane seca', 'Eletricista'][tick % 3], endereco: 'Av. Faria Lima, 2200', status: 'procurando', parceiro: '—', eta: 'onda 1/3', valor: 'R$ 120', tempo: '0 min' };
      chamados = [novo, ...chamados].slice(0, 8);
    }
  }
  const nAtivos = chamados.filter((c) => c.status !== 'concluido').length + 6;
  return {
    kpis: [
      { id: 'ativos', label: 'Chamados ativos', value: String(nAtivos), sub: '+3 na última hora', spark: [4, 6, 5, 8, 7, 9, nAtivos] },
      { id: 'aceite', label: 'Tempo até aceite', value: '48s', sub: 'meta < 60s', saude: 'g', spark: [70, 62, 58, 55, 51, 49, 48] },
      { id: 'chegada', label: 'Tempo até chegada', value: '21 min', sub: 'meta < 25 min', saude: 'g', spark: [28, 26, 25, 24, 22, 22, 21] },
      { id: 'semparc', label: 'Sem parceiro', value: '7%', sub: 'meta < 10%', saude: 'g', spark: [12, 11, 9, 10, 8, 7, 7] },
      { id: 'online', label: 'Parceiros online', value: '34', sub: 'de 58 aprovados', spark: [20, 24, 28, 30, 31, 33, 34] },
      { id: 'receita', label: 'Receita hoje', value: 'R$ 3.480', sub: 'take rate 20%', spark: [800, 1200, 1500, 2100, 2600, 3100, 3480] },
    ],
    chamados: chamados.map((c) => ({ ...c })),
    precos: [
      { servico: 'Borracheiro', saida: 'R$ 80', km: '—', minimo: 'R$ 80' },
      { servico: 'Eletricista', saida: 'R$ 120', km: '—', minimo: 'R$ 120' },
      { servico: 'Pane seca', saida: 'R$ 60', km: '—', minimo: 'R$ 60' },
      { servico: 'Guincho', saida: 'R$ 150', km: 'R$ 5,00', minimo: 'R$ 180' },
      { servico: 'Chaveiro', saida: 'R$ 140', km: '—', minimo: 'R$ 140' },
    ],
    disputas: [
      { id: '#1021', motivo: 'Cliente contesta adicional (bateria)', valor: 'R$ 420' },
      { id: '#1017', motivo: 'Parceiro não chegou, cobrança indevida', valor: 'R$ 90' },
    ],
    eventos: [
      { hora: '20:09', texto: 'Chamado #1042 aceito por João Silva', tipo: 'aceite' },
      { hora: '20:07', texto: 'Chamado #1041 sem resposta na onda 1, raio ampliado para 12 km', tipo: 'alerta' },
      { hora: '20:05', texto: 'Marcos Lima propôs adicional de R$ 60 no #1040', tipo: 'adicional' },
      { hora: '20:02', texto: 'Carlos Mendes enviou documentos para análise', tipo: 'cadastro' },
      { hora: '19:58', texto: 'Chamado #1037 concluído, nota 5', tipo: 'ok' },
      { hora: '19:51', texto: 'Disputa aberta no #1021', tipo: 'alerta' },
    ],
  };
}

export async function cancelarChamado(id: string): Promise<void> {
  await atraso();
  chamados = chamados.filter((c) => c.id !== id);
}

export async function listarPendentes(): Promise<ParceiroPendente[]> {
  await atraso(250);
  return [...pendentes];
}

export async function responderParceiro(id: string, _aprovar: boolean): Promise<void> {
  await atraso();
  pendentes = pendentes.filter((p) => p.id !== id);
}
