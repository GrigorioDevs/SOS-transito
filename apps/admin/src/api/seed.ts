// Dados de demonstração. Todas as datas são RELATIVAS a "agora" (ex.: "há 3 dias").
// O gerador é determinístico (mesma semente → mesmos ids), o que permite mesclar com o que foi salvo.
// Os casos são abertos com a configuração vigente no momento em que a demonstração é criada.
import { CONFIG_PADRAO } from '../config/padrao';
import { somarPrazo } from '../config/regras';
import type { ConfiguracoesAdmin, Sancao } from '../config/tipos';
import type { Banco } from './armazenamento';
import { DIA, HORA, abrirCaso, solicitarDefesa, type DadosCaso } from './dominio';
import type {
  AreaAuditoria, Avaliacao, Caso, ChamadosSemana, EventoAuditoria, SancaoAplicada, TipoProva, TipoUsuario, Usuario,
} from './tipos';

function prng(semente: number) {
  let a = semente;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMES = ['Ana', 'Bruno', 'Camila', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Gustavo', 'Helena', 'Igor', 'Isabela', 'Jorge', 'Larissa', 'Leonardo', 'Mariana', 'Mateus', 'Natália', 'Otávio', 'Patrícia', 'Renato', 'Sabrina', 'Thiago', 'Vanessa', 'Wesley', 'Yasmin', 'André', 'Bianca', 'Caio', 'Débora', 'Elaine', 'Fábio', 'Giovana', 'Heitor', 'Júlio', 'Letícia', 'Márcio', 'Nicole', 'Priscila', 'Rogério', 'Simone', 'Tatiane', 'Vítor'];
const SOBRENOMES = ['Almeida', 'Barbosa', 'Cardoso', 'Carvalho', 'Castro', 'Correia', 'Cunha', 'Dias', 'Duarte', 'Farias', 'Fernandes', 'Ferreira', 'Gomes', 'Lima', 'Machado', 'Medeiros', 'Moraes', 'Moreira', 'Nascimento', 'Oliveira', 'Pinto', 'Queiroz', 'Ribeiro', 'Rocha', 'Santana', 'Santos', 'Siqueira', 'Teixeira', 'Vieira', 'Xavier'];
const CIDADES = ['São Paulo', 'São Paulo', 'São Paulo', 'São Paulo', 'Osasco', 'Guarulhos', 'Santo André', 'São Bernardo do Campo', 'Barueri', 'Carapicuíba', 'Diadema', 'Taboão da Serra', 'Cotia'];
const SERVICOS = ['Guincho', 'Borracheiro', 'Chaveiro', 'Eletricista', 'Pane seca'];

const MOTIVOS: Record<TipoUsuario, [string, number][]> = {
  cliente: [['Demora no atendimento', 31], ['Preço alto', 24], ['Problema com prestador', 18], ['Não precisa mais', 15], ['Outros', 12]],
  prestador: [['Poucos pedidos', 38], ['Taxa da plataforma', 27], ['Clientes problemáticos', 16], ['Demora no repasse', 12], ['Outros', 7]],
};

const COMENTARIOS: Record<TipoUsuario, Record<number, string[]>> = {
  cliente: {
    5: ['Atendimento rápido e muito educado.', 'Chegou antes do previsto e resolveu na hora.', 'Excelente, recomendo.', 'Preço justo e serviço bem feito.', 'Salvou meu dia na estrada!', 'Muito profissional, explicou tudo.'],
    4: ['Bom serviço, mas demorou um pouco para chegar.', 'Resolveu o problema. O carro ficou um pouco sujo.', 'Educado e rápido.', 'Tudo certo.'],
    3: ['Serviço ok, mas cobrou o deslocamento à parte.', 'Demorou mais do que o app mostrava.', 'Mediano.'],
    2: ['Atrasou 40 minutos e não avisou.', 'Foi grosseiro ao explicar o valor.', 'O serviço precisou ser refeito no dia seguinte.'],
    1: ['Não apareceu e ainda cobrou taxa.', 'Me tratou muito mal.', 'Danificou a roda do carro.', 'Cobrou o dobro do combinado.', 'Péssimo, nunca mais.'],
  },
  prestador: {
    5: ['Cliente educado, pagamento rápido.', 'Tudo certo, local bem indicado.', 'Ótimo cliente.'],
    4: ['Endereço impreciso, mas tranquilo.', 'Cliente simpático, só demorou a aparecer.'],
    3: ['Demorou para aparecer no local.', 'Pediu desconto na hora.'],
    2: ['Reclamou do preço o tempo todo.', 'Não estava no local combinado.'],
    1: ['Cliente agressivo.', 'Contestou o pagamento depois do serviço.'],
  },
};

// Usuários citados nas denúncias e sanções de exemplo.
// [nome, tipo, serviço, cidade, cadastrado há (dias), último uso há (horas), chamados, nota média]
const CONHECIDOS: [string, TipoUsuario, string | undefined, string, number, number, number, number | null][] = [
  ['Lucas Pereira', 'cliente', undefined, 'São Paulo', 210, 100, 9, 4.8],
  ['Rafael Costa', 'prestador', 'Chaveiro', 'São Paulo', 320, 30, 214, 3.9],
  ['Ana Souza', 'prestador', 'Pane seca', 'Osasco', 280, 5, 167, 4.8],
  ['Bruno Martins', 'cliente', undefined, 'Guarulhos', 150, 28, 6, 3.1],
  ['Júlia Ramos', 'cliente', undefined, 'São Paulo', 95, 140, 4, 4.9],
  ['Marcos Lima', 'prestador', 'Guincho', 'São Paulo', 400, 3, 302, 4.4],
  ['Conta 88213', 'cliente', undefined, 'São Paulo', 18, 58, 7, null],
  ['Pedro Alves', 'cliente', undefined, 'Santo André', 60, 10, 3, 4.7],
  ['João Silva', 'prestador', 'Borracheiro', 'São Paulo', 190, 8, 121, 3.6],
  ['Carlos Mendes', 'prestador', 'Guincho', 'Osasco', 240, 12, 88, 4.6],
  ['Tiago Freitas', 'cliente', undefined, 'Barueri', 130, 240, 5, 3.4],
  ['Fernanda Lopes', 'cliente', undefined, 'São Paulo', 45, 50, 2, 5],
  ['Diego Rocha', 'prestador', 'Eletricista', 'São Paulo', 75, 20, 46, 4.1],
  ['Ricardo Nunes', 'prestador', 'Borracheiro', 'Diadema', 260, 6, 133, 4.7],
  ['Paula Dias', 'cliente', undefined, 'São Paulo', 120, 7, 11, 4.2],
  ['Conta 90457', 'cliente', undefined, 'Guarulhos', 4, 3, 3, null],
  ['Beatriz Melo', 'cliente', undefined, 'Cotia', 33, 19, 2, 4.5],
  ['Rodrigo Teixeira', 'cliente', undefined, 'São Paulo', 200, 100, 8, 4.6],
  ['Conta 77120', 'cliente', undefined, 'Carapicuíba', 70, 15, 5, 4.0],
  ['Vinícius Prado', 'prestador', 'Guincho', 'Taboão da Serra', 340, 120, 256, 4.0],
  ['Conta 66310', 'cliente', undefined, 'São Paulo', 40, 480, 4, null],
  ['Kelly Ramos', 'cliente', undefined, 'São Bernardo do Campo', 88, 48, 7, 3.5],
  ['Henrique Costa', 'prestador', 'Chaveiro', 'São Paulo', 300, 288, 140, 3.8],
  ['Conta 55102', 'cliente', undefined, 'Osasco', 80, 1080, 6, null],
  ['Conta 90011', 'cliente', undefined, 'Guarulhos', 2, 9, 1, null],
];

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '.');

export function gerarDadosDemonstracao(cfg: ConfiguracoesAdmin, agora: number): Banco {
  const r = prng(20261117);
  const iso = (ms: number) => new Date(ms).toISOString();
  const ha = (h: number) => agora - h * HORA;
  const pick = <T,>(l: T[]) => l[Math.floor(r() * l.length)];
  const pesado = <T,>(l: [T, number][]) => {
    let x = r() * l.reduce((s, [, p]) => s + p, 0);
    for (const [v, p] of l) { x -= p; if (x <= 0) return v; }
    return l[l.length - 1][0];
  };
  const telefone = () => `(11) 9${String(Math.floor(r() * 9000) + 1000)}-${String(Math.floor(r() * 9000) + 1000)}`;

  /* ------------------------------- Usuários ------------------------------- */
  const usuarios: Usuario[] = [];
  const nomes = new Set<string>();
  let n = 1000;
  for (const [nome, tipo, servico, cidade, dias, usoH, chamados, nota] of CONHECIDOS) {
    nomes.add(nome);
    usuarios.push({
      id: `U-${++n}`, nome, tipo, servico, cidade, email: `${slug(nome)}@exemplo.com`, telefone: telefone(),
      criadoEm: iso(agora - dias * DIA), ultimoUsoEm: iso(ha(usoH)), chamados, notaMedia: nota,
    });
  }
  const N = cfg.retencao.diasSemUsoParaSaida;
  for (let i = 0; i < 880; i++) {
    const tipo: TipoUsuario = i % 5 === 4 ? 'prestador' : 'cliente';
    let nome = '';
    for (let t = 0; t < 20 && (!nome || nomes.has(nome)); t++) nome = `${pick(NOMES)} ${pick(SOBRENOMES)}${t > 10 ? ` ${pick(SOBRENOMES)}` : ''}`;
    nomes.add(nome);
    const diasCad = Math.max(0.05, 400 * r() ** 1.35);
    let ultimo: number;
    let motivoSaida: string | undefined;
    if (diasCad > N + 1 && r() < (tipo === 'cliente' ? 0.1 : 0.22)) {
      ultimo = agora - (N + r() * Math.min(70, diasCad - N)) * DIA;
      if (r() < 0.7) motivoSaida = pesado(MOTIVOS[tipo]);
    } else {
      ultimo = agora - r() ** 2 * Math.min(diasCad, 25) * DIA;
    }
    const chamados = tipo === 'cliente' ? 1 + Math.floor(r() * 10) : 8 + Math.floor(r() * 170);
    const nota = Math.min(5, Math.round((tipo === 'cliente' ? 4.2 + r() * 0.8 : 3.7 + r() * 1.3) * 10) / 10);
    usuarios.push({
      id: `U-${++n}`, nome, tipo, servico: tipo === 'prestador' ? pick(SERVICOS) : undefined, cidade: pick(CIDADES),
      email: `${slug(nome)}${i}@exemplo.com`, telefone: telefone(), criadoEm: iso(agora - diasCad * DIA), ultimoUsoEm: iso(ultimo),
      chamados, notaMedia: nota, motivoSaida,
    });
  }
  const u = (nome: string) => usuarios.find((x) => x.nome === nome)!;
  const tipoRotulo = (x: Usuario) => (x.tipo === 'prestador' ? `Prestador · ${x.servico}` : 'Cliente');

  /* ------------------------------- Auditoria ------------------------------- */
  const auditoria: Omit<EventoAuditoria, 'id'>[] = [];
  const aud = (h: number, quem: string, area: AreaAuditoria, acao: string, alvo?: string, motivo?: string, ref?: string) =>
    auditoria.push({ quando: iso(ha(h)), quem, area, acao, alvo, motivo, ref });

  /* -------------------------------- Denúncias -------------------------------- */
  const casos: Caso[] = [];
  const caso = (id: string, categoriaId: string, denunciante: string | null, denunciado: string, chamado: string, provas: TipoProva[], relato: string, horas: number) => {
    const de = denunciante ? u(denunciante) : undefined;
    const para = u(denunciado);
    const d: DadosCaso = {
      id, categoriaId, chamado, provas, relato,
      denuncianteId: de?.id, denunciante: de?.nome ?? 'Sistema', denuncianteTipo: de ? (de.tipo === 'cliente' ? 'Cliente' : 'Prestador') : 'Automático',
      denunciadoId: para.id, denunciado: para.nome, denunciadoTipo: tipoRotulo(para),
    };
    const c = abrirCaso(d, new Date(ha(horas)), cfg);
    casos.push(c);
    return c;
  };
  const resolver = (c: Caso, decisao: string, h: number, quem: string, justificativa: string) => {
    Object.assign(c, { status: 'resolvido', decisao, resolvidoEm: iso(ha(h)), decididoPor: quem, justificativaDecisao: justificativa });
    aud(h, quem, 'denuncia', `Decidiu: ${decisao}`, c.denunciado, justificativa, c.id);
  };

  caso('D-224', 'assedio', 'Fernanda Lopes', 'Diego Rocha', '#1047', ['chat', 'foto'], 'Durante o atendimento ele fez comentários sobre minha aparência e depois continuou mandando mensagens pelo chat do app.', 52);
  caso('D-223', 'conduta', 'Ricardo Nunes', 'Paula Dias', '#1045', ['foto'], 'A cliente me xingou durante a troca do pneu e se recusou a se afastar do macaco hidráulico.', 6);
  caso('D-222', 'fraude', null, 'Conta 90457', '#1044', ['chat', 'gps'], 'Três chamados cancelados depois da chegada do prestador em 48h, cada um com um cartão diferente.', 3);
  caso('D-221', 'cobranca_indevida', 'Lucas Pereira', 'Rafael Costa', '#1038', ['foto', 'chat', 'gps'], 'Combinamos R$ 150 no app e na hora ele cobrou R$ 330, dizendo que a fechadura era especial.', 110);
  const d220 = caso('D-220', 'nao_compareceu', 'Beatriz Melo', 'João Silva', '#1036', ['gps'], 'Fiquei duas horas esperando no acostamento. O GPS mostra que ele nem saiu do lugar.', 20);
  d220.status = 'em_analise';
  aud(18, 'Marina', 'denuncia', 'Iniciou a análise', 'João Silva', undefined, 'D-220');
  const d219 = caso('D-219', 'ameaca', 'Ana Souza', 'Bruno Martins', '#1029', ['foto', 'chat'], 'O cliente gritou e ameaçou quando informei o valor do combustível.', 30);
  d219.status = 'em_analise';
  aud(26, 'Cristian', 'denuncia', 'Iniciou a análise', 'Bruno Martins', undefined, 'D-219');
  const d218 = caso('D-218', 'dano_veiculo', 'Júlia Ramos', 'Marcos Lima', '#1024', ['foto', 'foto', 'chat', 'gps'], 'O para-choque saiu inteiro do guincho e chegou rachado na oficina. Tenho fotos de antes e depois.', 150);
  solicitarDefesa(d218, new Date(ha(130)));
  aud(130, 'Cristian', 'denuncia', 'Solicitou defesa', 'Marcos Lima', 'Fotos de antes e depois indicam dano no transporte; ouvir o prestador antes de decidir.', 'D-218');
  const d217 = caso('D-217', 'cobranca_indevida', 'Rodrigo Teixeira', 'Rafael Costa', '#1022', ['chat', 'foto'], 'Cobrou R$ 90 a mais pela troca do miolo sem me perguntar antes.', 170);
  solicitarDefesa(d217, new Date(ha(160)));
  aud(160, 'Marina', 'denuncia', 'Solicitou defesa', 'Rafael Costa', 'Valor cobrado diverge do orçamento aceito no app; prestador precisa explicar.', 'D-217');
  d217.defesa = { texto: 'O cliente autorizou a troca do miolo pelo chat do app. O print está anexado.', em: iso(ha(100)) };
  d217.status = 'em_analise';
  aud(100, 'Rafael Costa', 'denuncia', 'Enviou defesa', 'Rafael Costa', undefined, 'D-217');
  const d216 = caso('D-216', 'fraude', null, 'Conta 88213', '#1019', ['foto', 'chat', 'gps', 'foto', 'foto'], 'Cartão recusado 4 vezes e 3 contas criadas no mesmo aparelho em 24h.', 60);
  const c215 = caso('D-215', 'nao_compareceu', 'Pedro Alves', 'João Silva', '#1017', ['gps'], 'Aceitou o chamado e nunca chegou.', 200);
  const c214 = caso('D-214', 'nao_pagou', 'Carlos Mendes', 'Tiago Freitas', '#1011', ['foto', 'chat'], 'Serviço concluído e o pagamento foi contestado no cartão.', 260);
  const c213 = caso('D-213', 'ameaca', 'Carlos Mendes', 'Kelly Ramos', '#1009', ['chat'], 'Ameaçou me denunciar falsamente se eu não baixasse o preço do reboque.', 70);
  const c212 = caso('D-212', 'nao_pagou', 'Diego Rocha', 'Bruno Martins', '#0998', ['chat'], 'Pediu para pagar em dinheiro e foi embora sem pagar.', 420);
  const c211 = caso('D-211', 'fraude', null, 'Conta 77120', '#0994', ['chat', 'gps'], 'Chamados em série com cartões de terceiros.', 700);
  const c210 = caso('D-210', 'cobranca_indevida', 'Paula Dias', 'Vinícius Prado', '#1001', ['foto', 'chat', 'gps'], 'Cobrou 40 km a mais do que a distância real até a oficina.', 140);
  const c209 = caso('D-209', 'conduta', 'Júlia Ramos', 'Henrique Costa', '#0990', ['chat'], 'Chegou alterado, falou palavrões e deixou o serviço pela metade.', 310);
  const c208 = caso('D-208', 'dano_veiculo', 'Pedro Alves', 'Marcos Lima', '#0985', ['foto'], 'Apareceu um risco na porta depois do reboque.', 500);

  /* ------------------------------ Sanções aplicadas ------------------------------ */
  const sancoes: SancaoAplicada[] = [];
  const catalogo = (id: string): Sancao =>
    cfg.sancoes.catalogo.find((s) => s.id === id) ?? CONFIG_PADRAO.sancoes.catalogo.find((s) => s.id === id)!;
  let ns = 0;
  const sancao = (o: {
    usuario: string; sancaoId: string; casoId?: string; quem: string; h: number; justificativa: string;
    aprovadoPor?: string; aprovadoH?: number; pendente?: boolean;
  }) => {
    const alvo = u(o.usuario);
    const s = catalogo(o.sancaoId);
    const reg: SancaoAplicada = {
      id: `S-${++ns}`, usuarioId: alvo.id, usuario: alvo.nome, usuarioTipo: alvo.tipo, sancaoId: s.id, sancaoNome: s.nome, tipo: s.tipo,
      duracaoDias: s.duracaoDias, casoId: o.casoId, status: 'pendente_2a', solicitadoPor: o.quem, solicitadoEm: iso(ha(o.h)), justificativa: o.justificativa,
    };
    if (!o.pendente) {
      const em = ha(o.aprovadoH ?? o.h);
      reg.aprovadoPor = o.aprovadoPor;
      reg.aplicadaEm = iso(em);
      reg.recursoAte = somarPrazo(new Date(em), cfg.sancoes.prazoRecurso, cfg.moderacao.contagem).toISOString();
      if (s.tipo === 'suspensao') {
        const ate = em + (s.duracaoDias ?? 0) * DIA;
        reg.ate = iso(ate);
        reg.status = ate < agora ? 'encerrada' : 'ativa';
        if (ate < agora) reg.encerradaEm = iso(ate);
      } else if (s.tipo === 'bloqueio_permanente') {
        reg.status = 'ativa';
      } else {
        reg.status = 'encerrada';
        reg.encerradaEm = iso(em);
      }
    }
    sancoes.push(reg);
    return reg;
  };

  sancao({ usuario: 'Rafael Costa', sancaoId: 'advertencia', quem: 'Marina', h: 60 * 24, justificativa: 'Cobrança acima do orçamento aceito, confirmada pelo chat do chamado #0912.' });
  aud(60 * 24, 'Marina', 'usuario', 'Aplicou Advertência', 'Rafael Costa', 'Cobrança acima do orçamento aceito, confirmada pelo chat do chamado #0912.', 'U-1002');
  sancao({ usuario: 'Rafael Costa', sancaoId: 'susp7', quem: 'Cristian', h: 20 * 24, justificativa: 'Segunda cobrança indevida em menos de 90 dias; regra de reincidência.' });
  aud(20 * 24, 'Cristian', 'usuario', 'Aplicou Suspensão 7 dias', 'Rafael Costa', 'Segunda cobrança indevida em menos de 90 dias; regra de reincidência.', 'U-1002');

  resolver(c215, 'Advertência', 180, 'Marina', 'Não compareceu ao chamado aceito; o GPS confirma que não houve deslocamento.');
  sancao({ usuario: 'João Silva', sancaoId: 'advertencia', casoId: 'D-215', quem: 'Marina', h: 180, justificativa: c215.justificativaDecisao! });
  resolver(c214, 'Suspensão 7 dias', 236, 'Cristian', 'Inadimplência comprovada: estorno pedido no cartão depois do serviço concluído.');
  const s214 = sancao({ usuario: 'Tiago Freitas', sancaoId: 'susp7', casoId: 'D-214', quem: 'Cristian', h: 236, justificativa: c214.justificativaDecisao! });
  if (s214.encerradaEm) aud((agora - new Date(s214.encerradaEm).getTime()) / HORA, 'Sistema', 'sistema', 'Suspensão encerrada (prazo cumprido)', 'Tiago Freitas', undefined, s214.id);
  resolver(c213, 'Suspensão 7 dias', 48, 'Cristian', 'Ameaça registrada no chat do app, contra as regras de convivência.');
  sancao({ usuario: 'Kelly Ramos', sancaoId: 'susp7', casoId: 'D-213', quem: 'Cristian', h: 48, justificativa: c213.justificativaDecisao! });
  resolver(c212, 'Suspensão 3 dias', 380, 'Marina', 'Saiu sem pagar; o prestador apresentou conversa combinando pagamento em dinheiro.');
  sancao({ usuario: 'Bruno Martins', sancaoId: 'susp3', casoId: 'D-212', quem: 'Marina', h: 380, justificativa: c212.justificativaDecisao! });

  resolver(c211, 'Bloqueio permanente', 650, 'Cristian', 'Uso de cartões de terceiros em série, confirmado pelo antifraude.');
  const s211 = sancao({ usuario: 'Conta 77120', sancaoId: 'bloqueio', casoId: 'D-211', quem: 'Cristian', h: 660, justificativa: c211.justificativaDecisao!, aprovadoPor: 'Marina', aprovadoH: 650 });
  aud(650, 'Marina', 'bloqueio', 'Aprovou Bloqueio permanente (2ª aprovação)', 'Conta 77120', 'Conferi o relatório do antifraude.', s211.id);
  Object.assign(s211, { status: 'revertida', revertidaPor: 'Marina', revertidaEm: iso(ha(600)), motivoReversao: 'O titular comprovou que os cartões eram da família, com autorização.' });
  aud(600, 'Marina', 'bloqueio', 'Reverteu Bloqueio permanente', 'Conta 77120', s211.motivoReversao, s211.id);

  resolver(c210, 'Suspensão 30 dias', 120, 'Cristian', 'GPS mostra 12 km percorridos e foram cobrados 52 km. Fraude na quilometragem.');
  const s210 = sancao({ usuario: 'Vinícius Prado', sancaoId: 'susp30', casoId: 'D-210', quem: 'Cristian', h: 120, justificativa: c210.justificativaDecisao! });
  s210.recurso = { texto: 'O GPS do meu celular falhou na Marginal e marquei a distância pelo hodômetro do guincho. Tenho a foto do painel.', em: iso(ha(96)) };
  aud(96, 'Vinícius Prado', 'bloqueio', 'Enviou recurso', 'Vinícius Prado', undefined, s210.id);

  resolver(c209, 'Suspensão 30 dias', 288, 'Marina', 'Palavrões registrados no chat e serviço abandonado, confirmados pela cliente e pelo GPS.');
  const s209 = sancao({ usuario: 'Henrique Costa', sancaoId: 'susp30', casoId: 'D-209', quem: 'Marina', h: 288, justificativa: c209.justificativaDecisao! });
  s209.recurso = { texto: 'Estava passando mal e precisei sair.', em: iso(ha(270)) };
  s209.recursoDecisao = 'mantida';
  aud(250, 'Cristian', 'bloqueio', 'Negou recurso (sanção mantida)', 'Henrique Costa', 'Não apresentou atestado nem avisou a cliente; as mensagens mostram ofensas.', s209.id);

  resolver(c208, 'Arquivado', 480, 'Marina', 'As fotos de antes do serviço já mostram o risco na porta.');

  const s55 = sancao({ usuario: 'Conta 55102', sancaoId: 'bloqueio', quem: 'Marina', h: 45 * 24 + 3, justificativa: 'Conta usada para golpes com falso pedido de reboque.', aprovadoPor: 'Cristian', aprovadoH: 45 * 24 });
  aud(45 * 24, 'Cristian', 'bloqueio', 'Aprovou Bloqueio permanente (2ª aprovação)', 'Conta 55102', 'Conferi os boletins anexados.', s55.id);
  const s66 = sancao({ usuario: 'Conta 66310', sancaoId: 'bloqueio', quem: 'Cristian', h: 20 * 24 + 5, justificativa: 'Mesmo aparelho da Conta 55102, já bloqueada por golpe.', aprovadoPor: 'Marina', aprovadoH: 20 * 24 });
  aud(20 * 24, 'Marina', 'bloqueio', 'Aprovou Bloqueio permanente (2ª aprovação)', 'Conta 66310', 'Vínculo de aparelho confirmado.', s66.id);
  sancao({ usuario: 'Conta 88213', sancaoId: 'advertencia', quem: 'Cristian', h: 12 * 24, justificativa: 'Três cancelamentos após a chegada do prestador na mesma semana.' });
  aud(12 * 24, 'Cristian', 'usuario', 'Aplicou Advertência', 'Conta 88213', 'Três cancelamentos após a chegada do prestador na mesma semana.', 'U-1007');

  // Bloqueios aguardando a 2ª aprovação.
  const j216 = 'Fraude de cartão confirmada pelo antifraude e três contas criadas no mesmo aparelho.';
  const s216 = sancao({ usuario: 'Conta 88213', sancaoId: 'bloqueio', casoId: 'D-216', quem: 'Cristian', h: 5, justificativa: j216, pendente: true });
  d216.status = 'aguardando_2a';
  d216.bloqueioPendente = { sancaoId: s216.sancaoId, sancaoNome: s216.sancaoNome, solicitadoPor: 'Cristian', solicitadoEm: s216.solicitadoEm, justificativa: j216 };
  aud(5, 'Cristian', 'bloqueio', 'Solicitou Bloqueio permanente (aguarda 2ª aprovação)', 'Conta 88213', j216, 'D-216');
  const j011 = 'Mesmo aparelho de quatro contas já bloqueadas por fraude de cartão.';
  const s011 = sancao({ usuario: 'Conta 90011', sancaoId: 'bloqueio', quem: 'Marina', h: 9, justificativa: j011, pendente: true });
  aud(9, 'Marina', 'bloqueio', 'Solicitou Bloqueio permanente (aguarda 2ª aprovação)', 'Conta 90011', j011, s011.id);

  /* -------------------------------- Avaliações -------------------------------- */
  const avaliacoes: Avaliacao[] = [];
  const clientes = usuarios.filter((x) => x.tipo === 'cliente' && !x.nome.startsWith('Conta'));
  const prestadores = usuarios.filter((x) => x.tipo === 'prestador');
  const DIST: Record<TipoUsuario, [number, number][]> = {
    cliente: [[5, 63], [4, 23], [3, 6], [2, 4], [1, 4]],
    prestador: [[5, 58], [4, 25], [3, 8], [2, 4], [1, 5]],
  };
  let na = 0;
  const avaliacao = (autor: Usuario, avaliado: Usuario, nota: number, comentario: string, criado: number, chamado?: string): Avaliacao => {
    const a: Avaliacao = {
      id: `AV-${++na}`, chamado: chamado ?? `#${String(800 + Math.floor(r() * 240)).padStart(4, '0')}`,
      autorId: autor.id, autor: autor.nome, autorTipo: autor.tipo, avaliadoId: avaliado.id, avaliado: avaliado.nome, avaliadoTipo: avaliado.tipo,
      nota, comentario, criadoEm: iso(criado), status: 'publicada',
    };
    avaliacoes.push(a);
    return a;
  };
  // Avaliações recentes com nota baixa, ainda sem revisão (fila de revisão).
  avaliacao(u('Pedro Alves'), u('João Silva'), 1, 'Não apareceu e ainda cobrou taxa de deslocamento.', ha(10), '#1043');
  avaliacao(u('Fernanda Lopes'), u('Diego Rocha'), 1, 'Comportamento inadequado, me senti muito desconfortável. Já fiz denúncia.', ha(50), '#1047');
  avaliacao(u('Ana Souza'), u('Bruno Martins'), 1, 'Cliente agressivo, me ameaçou quando falei o valor.', ha(29), '#1029');
  avaliacao(u('Rodrigo Teixeira'), u('Rafael Costa'), 1, 'Cobrou bem mais do que o combinado. LADRÃO!!!', ha(160), '#1022');
  avaliacao(u('Paula Dias'), u('Vinícius Prado'), 1, 'Cobrou quilometragem a mais. Fiquem atentos.', ha(138), '#1001');
  avaliacao(u('Lucas Pereira'), u('Rafael Costa'), 2, 'Resolveu, mas cobrou mais do que o app mostrava.', ha(108), '#1038');
  avaliacao(u('Beatriz Melo'), u('João Silva'), 2, 'Nunca chegou. Tive que chamar outro prestador.', ha(19), '#1036');
  for (let i = 0; i < 340; i++) {
    const deCliente = r() < 0.75;
    const autor = pick(deCliente ? clientes : prestadores);
    const avaliado = pick(deCliente ? prestadores : clientes);
    const nota = pesado(DIST[autor.tipo]);
    const diasAtras = r() * 60;
    const a = avaliacao(autor, avaliado, nota, pick(COMENTARIOS[autor.tipo][nota]), agora - diasAtras * DIA);
    if (nota <= 1 && diasAtras > 4) {
      const oculta = r() < 0.25;
      Object.assign(a, {
        revisadaEm: iso(agora - diasAtras * DIA + (2 + r() * 18) * HORA), revisadaPor: r() < 0.5 ? 'Marina' : 'Cristian',
        status: oculta ? 'oculta' : 'publicada',
        motivoRevisao: oculta ? 'Linguagem ofensiva, sem relação com o serviço prestado.' : 'O relato condiz com o atendimento; avaliação mantida publicada.',
      });
    }
  }
  const ocultada = avaliacoes.find((a) => a.status === 'oculta');
  if (ocultada) aud((agora - new Date(ocultada.revisadaEm!).getTime()) / HORA, ocultada.revisadaPor!, 'avaliacao', 'Ocultou avaliação', `${ocultada.autor} → ${ocultada.avaliado}`, ocultada.motivoRevisao, ocultada.id);

  /* ------------------------------ Chamados por semana ------------------------------ */
  const taxaConclusao = [0.9, 0.905, 0.9, 0.91, 0.915, 0.92, 0.91, 0.914];
  const taxaCancelamento = [0.055, 0.05, 0.052, 0.048, 0.045, 0.043, 0.046, 0.042];
  const chamadosSemana: ChamadosSemana[] = taxaConclusao.map((tc, i) => {
    const total = Math.round(520 + i * 16 + r() * 20);
    return { inicio: iso(agora - (8 - i) * 7 * DIA), total, concluidos: Math.round(total * tc), cancelados: Math.round(total * taxaCancelamento[i]) };
  });

  aud(3, 'Sistema', 'denuncia', 'Abriu denúncia automática (antifraude)', 'Conta 90457', undefined, 'D-222');

  const ordenada = auditoria.sort((a, b) => b.quando.localeCompare(a.quando)).map((e, i, l) => ({ id: `A-${l.length - i}`, ...e }));

  return {
    usuarios,
    casos,
    sancoes,
    avaliacoes,
    chamadosSemana,
    auditoria: ordenada,
    seq: { D: 224, S: ns, A: ordenada.length, AV: na },
  };
}
