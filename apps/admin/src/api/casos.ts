// API FICTÍCIA de denúncias (casos).
// Back-end: GET /api/admin/casos, POST /api/admin/casos/{id}/decisao — mantendo as assinaturas.
import { USUARIO_ATUAL } from '../config/api';
import { db, persistir } from './armazenamento';
import { abrirCaso, solicitarDefesa } from './dominio';
import {
  SEGUNDO_ADMIN, acharUsuario, aplicarSancao, configAtual, decidirPendente, exigirJustificativa,
  novoId, procedentesDe, processarVencimentos, rede, registrar, resolverCaso,
} from './nucleo';
import type { Caso, TipoProva } from './tipos';

export { SEGUNDO_ADMIN };

const comProcedentes = (c: Caso): Caso => ({ ...c, procedentes: procedentesDe(c.denunciadoId) });

export async function listarCasos(): Promise<Caso[]> {
  await rede();
  processarVencimentos();
  return db().casos.map(comProcedentes).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export type AcaoCaso =
  | { tipo: 'iniciar_analise' }
  | { tipo: 'pedir_defesa' }
  | { tipo: 'arquivar' }
  | { tipo: 'sancao'; sancaoId: string }
  | { tipo: 'aprovar_bloqueio' }
  | { tipo: 'recusar_bloqueio' };

export async function decidirCaso(id: string, acao: AcaoCaso, justificativa: string): Promise<Caso> {
  await rede();
  const cfg = configAtual();
  const caso = db().casos.find((c) => c.id === id);
  if (!caso) throw new Error('Caso não encontrado.');
  if (caso.status === 'resolvido') throw new Error('Este caso já foi decidido.');

  if (acao.tipo === 'iniciar_analise') {
    if (caso.status !== 'novo') throw new Error('A análise deste caso já começou.');
    caso.status = 'em_analise';
    registrar('denuncia', USUARIO_ATUAL, 'Iniciou a análise', caso.denunciado, undefined, caso.id);
    persistir();
    return comProcedentes(caso);
  }

  const just = exigirJustificativa(justificativa, cfg);
  switch (acao.tipo) {
    case 'pedir_defesa': {
      if (caso.status === 'aguardando' || caso.status === 'aguardando_2a') throw new Error('A defesa já foi solicitada.');
      solicitarDefesa(caso, new Date());
      registrar('denuncia', USUARIO_ATUAL, 'Solicitou defesa', caso.denunciado, just, caso.id);
      break;
    }
    case 'arquivar': {
      if (caso.status === 'aguardando_2a') throw new Error('Há um bloqueio aguardando a 2ª aprovação. Recuse-o antes de arquivar.');
      resolverCaso(caso, 'Arquivado', USUARIO_ATUAL, just);
      registrar('denuncia', USUARIO_ATUAL, 'Decidiu: Arquivado', caso.denunciado, just, caso.id);
      break;
    }
    case 'sancao': {
      if (caso.status === 'aguardando_2a') throw new Error('Há um bloqueio aguardando a 2ª aprovação.');
      const s = cfg.sancoes.catalogo.find((x) => x.id === acao.sancaoId && x.ativa);
      if (!s) throw new Error('Esta sanção não está disponível.');
      aplicarSancao({ usuario: acharUsuario(caso.denunciadoId), sancao: s, caso, justificativa: just, cfg });
      break;
    }
    case 'aprovar_bloqueio':
    case 'recusar_bloqueio': {
      const reg = db().sancoes.find((s) => s.casoId === caso.id && s.status === 'pendente_2a');
      if (caso.status !== 'aguardando_2a' || !reg) throw new Error('Não há bloqueio aguardando aprovação.');
      decidirPendente(reg, acao.tipo === 'aprovar_bloqueio', just, cfg);
      break;
    }
  }
  persistir();
  return comProcedentes(caso);
}

// Só para a demonstração: abre uma denúncia nova com a configuração ATUAL
// (mostra que prazos alterados valem para casos novos e não mudam os antigos).
const EXEMPLOS: { categoriaId: string; relato: string; provas: TipoProva[] }[] = [
  { categoriaId: 'cobranca_indevida', relato: 'O valor final ficou R$ 80 acima do orçamento aceito no app.', provas: ['chat', 'foto'] },
  { categoriaId: 'conduta', relato: 'Foi grosseiro durante todo o atendimento e fumou dentro do carro.', provas: ['chat'] },
  { categoriaId: 'nao_compareceu', relato: 'Aceitou o chamado, ficou parado e cancelou depois de 30 minutos.', provas: ['gps'] },
  { categoriaId: 'dano_veiculo', relato: 'Arranhou a roda ao trocar o pneu e não quis assumir.', provas: ['foto', 'foto'] },
  { categoriaId: 'ameaca', relato: 'Ameaçou voltar ao local se eu desse nota baixa.', provas: ['chat', 'gps'] },
];

export async function simularDenuncia(): Promise<Caso> {
  await rede();
  const cfg = configAtual();
  const b = db();
  const ativas = new Set(cfg.categorias.filter((c) => c.ativa).map((c) => c.id));
  const opcoes = EXEMPLOS.filter((e) => ativas.has(e.categoriaId));
  const ex = (opcoes.length ? opcoes : EXEMPLOS)[b.seq.D % (opcoes.length || EXEMPLOS.length)];
  const clientes = b.usuarios.filter((u) => u.tipo === 'cliente' && !u.nome.startsWith('Conta'));
  const prestadores = b.usuarios.filter((u) => u.tipo === 'prestador');
  const de = clientes[(b.seq.D * 7) % clientes.length];
  const para = prestadores[(b.seq.D * 11) % prestadores.length];
  const id = novoId('D');
  const caso = abrirCaso({
    id, categoriaId: ex.categoriaId, relato: ex.relato, provas: ex.provas, chamado: `#${1048 + b.seq.D - 225}`,
    denuncianteId: de.id, denunciante: de.nome, denuncianteTipo: 'Cliente',
    denunciadoId: para.id, denunciado: para.nome, denunciadoTipo: `Prestador · ${para.servico}`,
  }, new Date(), cfg);
  b.casos.unshift(caso);
  registrar('denuncia', de.nome, 'Abriu denúncia', para.nome, `${caso.categoria} · prazos da configuração v${cfg.versao}`, id);
  persistir();
  return comProcedentes(caso);
}
