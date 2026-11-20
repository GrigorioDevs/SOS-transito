// Validação da configuração. Devolve { caminho do campo: mensagem }.
// A mesma função roda na tela (antes de salvar) e na API fictícia (ao salvar).
import { FORMATOS_DATA, FUSOS } from './padrao';
import { emHoras } from './regras';
import type { ConfiguracoesAdmin, Duracao, ErrosConfig } from './tipos';

const inteiro = (v: number) => Number.isFinite(v) && Number.isInteger(v);

function numero(e: ErrosConfig, caminho: string, v: number, min: number, max: number, rotulo = 'Valor') {
  if (!Number.isFinite(v)) e[caminho] = `${rotulo} é obrigatório.`;
  else if (!inteiro(v)) e[caminho] = `${rotulo} deve ser um número inteiro.`;
  else if (v < min || v > max) e[caminho] = `${rotulo} deve ficar entre ${min} e ${max}.`;
}

function duracao(e: ErrosConfig, caminho: string, d: Duracao, rotulo: string, permitirZero = false) {
  const max = d.unidade === 'horas' ? 720 : 365;
  numero(e, `${caminho}.valor`, d.valor, permitirZero ? 0 : 1, max, rotulo);
}

function texto(e: ErrosConfig, caminho: string, v: string, rotulo: string, max = 80) {
  if (!v.trim()) e[caminho] = `${rotulo} é obrigatório.`;
  else if (v.length > max) e[caminho] = `${rotulo} pode ter no máximo ${max} caracteres.`;
}

function unicos(e: ErrosConfig, prefixo: string, nomes: string[], campo = 'nome') {
  const vistos = new Map<string, number>();
  nomes.forEach((n, i) => {
    const k = n.trim().toLowerCase();
    if (!k) return;
    if (vistos.has(k)) e[`${prefixo}.${i}.${campo}`] = 'Já existe um item com este nome.';
    else vistos.set(k, i);
  });
}

export function validarConfig(c: ConfiguracoesAdmin): ErrosConfig {
  const e: ErrosConfig = {};

  // A) Prazos por nível
  const niveis = c.moderacao.niveis;
  if (niveis.length === 0) e['moderacao.niveis'] = 'Cadastre pelo menos um nível de criticidade.';
  niveis.forEach((n, i) => {
    const p = `moderacao.niveis.${i}`;
    texto(e, `${p}.nome`, n.nome, 'Nome', 30);
    if (!/^#[0-9a-fA-F]{6}$/.test(n.cor)) e[`${p}.cor`] = 'Use uma cor no formato #RRGGBB.';
    duracao(e, `${p}.prazoDefesa`, n.prazoDefesa, 'Prazo de defesa');
    duracao(e, `${p}.prazoDecisao`, n.prazoDecisao, 'Prazo de decisão');
    duracao(e, `${p}.lembreteAntes`, n.lembreteAntes, 'Lembrete', true);
    // Converte para horas antes de comparar (ex.: lembrete 30 horas × prazo 1 dia).
    const menor = Math.min(emHoras(n.prazoDefesa), emHoras(n.prazoDecisao));
    if (!e[`${p}.lembreteAntes.valor`] && emHoras(n.lembreteAntes) >= menor) {
      e[`${p}.lembreteAntes.valor`] = 'O lembrete precisa ser menor que os prazos de defesa e de decisão.';
    }
  });
  unicos(e, 'moderacao.niveis', niveis.map((n) => n.nome));

  // B) Categorias
  const idsNiveis = new Set(niveis.map((n) => n.id));
  if (c.categorias.length === 0) e['categorias'] = 'Cadastre pelo menos uma categoria.';
  else if (!c.categorias.some((x) => x.ativa)) e['categorias'] = 'Deixe pelo menos uma categoria ativa.';
  c.categorias.forEach((x, i) => {
    texto(e, `categorias.${i}.nome`, x.nome, 'Nome', 60);
    if (!idsNiveis.has(x.nivelId)) e[`categorias.${i}.nivelId`] = 'Escolha uma criticidade.';
  });
  unicos(e, 'categorias', c.categorias.map((x) => x.nome));

  // C) Sanções e reincidência
  const s = c.sancoes;
  if (!s.catalogo.some((x) => x.ativa)) e['sancoes.catalogo'] = 'Deixe pelo menos uma sanção ativa.';
  s.catalogo.forEach((x, i) => {
    texto(e, `sancoes.catalogo.${i}.nome`, x.nome, 'Nome', 40);
    if (x.tipo === 'suspensao') numero(e, `sancoes.catalogo.${i}.duracaoDias`, x.duracaoDias ?? NaN, 1, 3650, 'Duração');
  });
  unicos(e, 'sancoes.catalogo', s.catalogo.map((x) => x.nome));
  s.reincidencia.forEach((r, i) => {
    const p = `sancoes.reincidencia.${i}`;
    numero(e, `${p}.procedentes`, r.procedentes, 1, 50, 'Quantidade');
    numero(e, `${p}.janelaDias`, r.janelaDias, 1, 3650, 'Janela');
    if (!s.catalogo.some((x) => x.id === r.sancaoId && x.ativa)) e[`${p}.sancaoId`] = 'Escolha uma sanção ativa.';
  });
  numero(e, 'sancoes.justificativaMin', s.justificativaMin, 10, 1000, 'Tamanho mínimo');
  duracao(e, 'sancoes.prazoRecurso', s.prazoRecurso, 'Prazo de recurso');

  // D) Provas
  if (c.provas.tiposAceitos.length === 0) e['provas.tiposAceitos'] = 'Aceite pelo menos um tipo de arquivo.';
  numero(e, 'provas.tamanhoMaxMB', c.provas.tamanhoMaxMB, 1, 100, 'Tamanho máximo');
  numero(e, 'provas.maxPorDenuncia', c.provas.maxPorDenuncia, 1, 50, 'Quantidade máxima');
  numero(e, 'provas.guardaDias', c.provas.guardaDias, 30, 3650, 'Tempo de guarda');

  // E) Metas do semáforo
  c.metas.forEach((m, i) => {
    const p = `metas.${i}`;
    const max = m.unidade === '%' ? 100 : 10000;
    numero(e, `${p}.limiteVerde`, m.limiteVerde, 0, max, 'Limite verde');
    numero(e, `${p}.limiteVermelho`, m.limiteVermelho, 0, max, 'Limite vermelho');
    if (!e[`${p}.limiteVerde`] && !e[`${p}.limiteVermelho`]) {
      if (m.sentido === 'maior_melhor' && m.limiteVerde <= m.limiteVermelho) e[`${p}.limiteVermelho`] = 'Quando maior é melhor, o vermelho precisa ficar abaixo do verde.';
      if (m.sentido === 'menor_melhor' && m.limiteVerde >= m.limiteVermelho) e[`${p}.limiteVermelho`] = 'Quando menor é melhor, o vermelho precisa ficar acima do verde.';
    }
  });

  // F) Retenção e avaliações
  numero(e, 'retencao.diasSemUsoParaSaida', c.retencao.diasSemUsoParaSaida, 7, 730, 'Dias sem uso');
  if (c.retencao.motivosSaida.length === 0) e['retencao.motivosSaida'] = 'Cadastre pelo menos um motivo.';
  c.retencao.motivosSaida.forEach((m, i) => texto(e, `retencao.motivosSaida.${i}`, m, 'Motivo', 60));
  const a = c.avaliacoes;
  numero(e, 'avaliacoes.notaAlertaRevisao', a.notaAlertaRevisao, 1, 5, 'Nota');
  numero(e, 'avaliacoes.notaInsatisfeito', a.notaInsatisfeito, 1, 5, 'Nota');
  numero(e, 'avaliacoes.notaSatisfeito', a.notaSatisfeito, 1, 5, 'Nota');
  if (a.notaAlertaRevisao > a.notaInsatisfeito) e['avaliacoes.notaAlertaRevisao'] = 'A nota de alerta não pode ser maior que a de insatisfeito.';
  if (a.notaInsatisfeito >= a.notaSatisfeito) e['avaliacoes.notaSatisfeito'] = 'A nota de satisfeito precisa ser maior que a de insatisfeito.';

  // G) Organização
  texto(e, 'organizacao.nomeEmpresa', c.organizacao.nomeEmpresa, 'Nome da empresa');
  if (!FUSOS.includes(c.organizacao.fusoHorario)) e['organizacao.fusoHorario'] = 'Escolha um fuso horário.';
  if (!FORMATOS_DATA.includes(c.organizacao.formatoData)) e['organizacao.formatoData'] = 'Escolha um formato de data.';

  return e;
}
