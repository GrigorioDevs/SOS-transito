// Decisão de uma denúncia: as sanções vêm do catálogo da configuração, toda ação crítica
// pede justificativa (mínimo configurável) e confirmação, e a API registra na auditoria.
import { Alert, Button, Stack, Typography } from '@mui/material';
import { ROTULO_AO_VENCER } from '../../config/padrao';
import { sancaoSugerida, sancoesAtivas, textoDuracao } from '../../config/regras';
import type { ConfiguracoesAdmin, Sancao } from '../../config/tipos';
import { SEGUNDO_ADMIN, USUARIO_ATUAL, useDecidirCaso, type AcaoCaso } from '../../api/hooks';
import type { Caso } from '../../api/tipos';
import { useConfirmacao } from '../../components/ConfirmarAcao';
import { Quando } from '../../components/formatos';
import { useToast } from '../../components/Toast';

export default function PainelDecisao({ caso: c, cfg }: { caso: Caso; cfg: ConfiguracoesAdmin }) {
  const decidir = useDecidirCaso();
  const confirmar = useConfirmacao();
  const toast = useToast();
  const sugerida = sancaoSugerida(cfg, c.procedentes);
  const pend = c.bloqueioPendente;
  const aprovador = pend?.solicitadoPor === USUARIO_ATUAL ? SEGUNDO_ADMIN : USUARIO_ATUAL;

  const pedir = (acao: AcaoCaso, o: { titulo: string; rotulo: string; sucesso: string; descricao: string; perigo?: boolean }) =>
    confirmar.pedir({ ...o, executar: (j) => decidir.mutateAsync({ id: c.id, acao, justificativa: j }) });

  const iniciar = () =>
    decidir.mutate({ id: c.id, acao: { tipo: 'iniciar_analise' }, justificativa: '' }, {
      onSuccess: () => toast.sucesso(`Análise de ${c.id} iniciada.`),
      onError: (e) => toast.erro(e.message),
    });

  const descricaoSancao = (s: Sancao) => {
    const partes = [`Aplicar “${s.nome}” a ${c.denunciado} (caso ${c.id}).`];
    if (s.tipo === 'suspensao') partes.push(`A conta fica suspensa por ${s.duracaoDias} dias.`);
    if (s.tipo === 'bloqueio_permanente' && cfg.sancoes.segundoAdminBloqueio) partes.push('Só passa a valer depois da aprovação de outro admin.');
    partes.push(`Prazo de recurso: ${textoDuracao(cfg.sancoes.prazoRecurso)}.`);
    return partes.join(' ');
  };

  if (c.status === 'resolvido') {
    return (
      <Alert severity="success" variant="outlined">
        Decidido: <b>{c.decisao}</b>{c.decididoPor && <> por {c.decididoPor}</>}{c.resolvidoEm && <>, <Quando iso={c.resolvidoEm} /></>}.
        {c.justificativaDecisao && <> “{c.justificativaDecisao}”</>}
      </Alert>
    );
  }

  return (
    <Stack spacing={1.25}>
      {c.escaladoPara && <Alert severity="warning">Prazo de defesa vencido: caso escalado para {c.escaladoPara}.</Alert>}
      {c.defesa && <Alert severity="info"><b>Defesa recebida</b> (<Quando iso={c.defesa.em} />): “{c.defesa.texto}”</Alert>}
      {pend && (
        <Alert severity="warning">
          {pend.solicitadoPor} solicitou <b>{pend.sancaoNome.toLowerCase()}</b> <Quando iso={pend.solicitadoEm} />: “{pend.justificativa}”.
          {' '}A decisão cabe a outro admin{aprovador === SEGUNDO_ADMIN ? ` (${SEGUNDO_ADMIN}, simulado)` : ' (você)'}.
        </Alert>
      )}
      {sugerida && !pend && (
        <Alert severity="warning">
          Reincidência: {c.procedentes.length} decisão(ões) procedente(s) contra {c.denunciado}. A regra sugere <b>{sugerida.nome}</b>.
        </Alert>
      )}
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }} role="group" aria-label={`Ações do caso ${c.id}`}>
        {pend ? (
          <>
            <Button size="small" variant="contained" color="error"
              onClick={() => pedir({ tipo: 'aprovar_bloqueio' }, {
                titulo: `Aprovar ${pend.sancaoNome.toLowerCase()} de ${c.denunciado}?`, rotulo: 'Aprovar bloqueio', perigo: true,
                sucesso: `${pend.sancaoNome} aprovado. ${c.denunciado} está bloqueado.`,
                descricao: `2ª aprovação registrada em nome de ${aprovador}${aprovador === SEGUNDO_ADMIN ? ' (simulação do 2º admin)' : ''}. O bloqueio passa a valer agora.`,
              })}>
              Aprovar bloqueio ({aprovador})
            </Button>
            <Button size="small" variant="outlined" color="inherit"
              onClick={() => pedir({ tipo: 'recusar_bloqueio' }, {
                titulo: `Recusar o bloqueio de ${c.denunciado}?`, rotulo: 'Recusar', sucesso: 'Bloqueio recusado. O caso voltou para análise.',
                descricao: `Recusa registrada em nome de ${aprovador}. O caso volta para “Em análise”.`,
              })}>
              Recusar ({aprovador})
            </Button>
          </>
        ) : (
          <>
            {c.status === 'novo' && (
              <Button size="small" variant="outlined" color="inherit" onClick={iniciar} disabled={decidir.isPending}>Iniciar análise</Button>
            )}
            {c.status !== 'aguardando' && (
              <Button size="small" variant="outlined"
                onClick={() => pedir({ tipo: 'pedir_defesa' }, {
                  titulo: `Pedir defesa de ${c.denunciado}?`, rotulo: 'Pedir defesa', sucesso: `Defesa solicitada a ${c.denunciado}.`,
                  descricao: `${c.denunciado} terá ${textoDuracao(c.prazos.defesa)} para enviar defesa e provas (prazo gravado no caso, configuração v${c.versaoConfig}). Se não responder: ${ROTULO_AO_VENCER[c.prazos.aoVencerDefesa]?.toLowerCase()}.`,
                })}>
                Pedir defesa
              </Button>
            )}
            {sancoesAtivas(cfg).map((s) => {
              const bloqueio = s.tipo === 'bloqueio_permanente';
              const com2 = bloqueio && cfg.sancoes.segundoAdminBloqueio;
              return (
                <Button key={s.id} size="small" variant={sugerida?.id === s.id ? 'contained' : 'outlined'} color={bloqueio ? 'error' : 'primary'}
                  onClick={() => pedir({ tipo: 'sancao', sancaoId: s.id }, {
                    titulo: `${com2 ? 'Solicitar' : 'Aplicar'} ${s.nome.toLowerCase()}?`, rotulo: com2 ? 'Solicitar bloqueio' : `Aplicar ${s.nome.toLowerCase()}`,
                    perigo: bloqueio || s.tipo === 'suspensao', descricao: descricaoSancao(s),
                    sucesso: com2 ? 'Bloqueio solicitado. Aguardando a 2ª aprovação.' : `${s.nome} aplicada a ${c.denunciado}.`,
                  })}>
                  {com2 ? `Solicitar ${s.nome.toLowerCase()}` : s.nome}
                </Button>
              );
            })}
            <Button size="small" variant="outlined" color="inherit"
              onClick={() => pedir({ tipo: 'arquivar' }, {
                titulo: `Arquivar o caso ${c.id}?`, rotulo: 'Arquivar', sucesso: `Caso ${c.id} arquivado.`,
                descricao: 'O caso é encerrado sem sanção e não conta como procedente para reincidência.',
              })}>
              Arquivar
            </Button>
          </>
        )}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Toda decisão pede justificativa de no mínimo {cfg.sancoes.justificativaMin} caracteres e fica na auditoria.
      </Typography>
      {confirmar.dialogo}
    </Stack>
  );
}
