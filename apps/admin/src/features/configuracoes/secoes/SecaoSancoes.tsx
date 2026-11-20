// C) Sanções, reincidência e regras da decisão.
import { Alert, Box, Button, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { ROTULO_TIPO_SANCAO } from '../../../config/padrao';
import type { TipoSancao } from '../../../config/tipos';
import { Bloco, CampoDuracao, CampoNumero, Grade, novoId, type PropsSecao } from '../campos';

export default function SecaoSancoes({ c, mudar, erro }: PropsSecao) {
  const s = c.sancoes;
  const usadaEmRegra = (id: string) => s.reincidencia.some((r) => r.sancaoId === id);
  const ativas = s.catalogo.filter((x) => x.ativa);

  return (
    <Stack spacing={2}>
      <Bloco titulo="Catálogo de sanções" descricao="Estas são as decisões disponíveis para o admin. Sanção inativa não aparece nos botões de decisão.">
        <Stack spacing={2}>
          {erro('sancoes.catalogo') && <Alert severity="error">{erro('sancoes.catalogo')}</Alert>}
          {s.catalogo.map((x, i) => {
            const p = `sancoes.catalogo.${i}`;
            const usada = usadaEmRegra(x.id);
            return (
              <Box key={x.id} sx={{ display: 'grid', gap: 1.5, alignItems: 'start', gridTemplateColumns: { xs: '1fr 1fr', sm: '2fr 1.5fr 1fr auto auto' } }}>
                <TextField label="Nome" value={x.nome} error={Boolean(erro(`${p}.nome`))} helperText={erro(`${p}.nome`)}
                  onChange={(e) => mudar((cc) => { cc.sancoes.catalogo[i].nome = e.target.value; })} sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }} />
                <TextField select label="Tipo" value={x.tipo} onChange={(e) => mudar((cc) => {
                  const it = cc.sancoes.catalogo[i];
                  it.tipo = e.target.value as TipoSancao;
                  if (it.tipo === 'suspensao') it.duracaoDias ??= 7; else delete it.duracaoDias;
                })}>
                  {Object.entries(ROTULO_TIPO_SANCAO).map(([v, r]) => <MenuItem key={v} value={v}>{r}</MenuItem>)}
                </TextField>
                {x.tipo === 'suspensao'
                  ? <CampoNumero rotulo="Duração" sufixo="dias" valor={x.duracaoDias} min={1} erro={erro(`${p}.duracaoDias`)}
                      onChange={(v) => mudar((cc) => { cc.sancoes.catalogo[i].duracaoDias = v; })} />
                  : <Box sx={{ display: { xs: 'none', sm: 'block' } }} />}
                <FormControlLabel sx={{ m: 0 }} label="Ativa"
                  control={<Switch checked={x.ativa} onChange={(_, v) => mudar((cc) => { cc.sancoes.catalogo[i].ativa = v; })} />} />
                <Tooltip title={usada ? 'Usada numa regra de reincidência. Troque a regra antes de excluir.' : 'Excluir sanção'}>
                  <span><IconButton aria-label={`Excluir ${x.nome}`} disabled={usada} onClick={() => mudar((cc) => { cc.sancoes.catalogo.splice(i, 1); })}><DeleteOutline /></IconButton></span>
                </Tooltip>
              </Box>
            );
          })}
          <Button startIcon={<Add />} sx={{ alignSelf: 'flex-start' }}
            onClick={() => mudar((cc) => { cc.sancoes.catalogo.push({ id: novoId('sancao'), nome: '', tipo: 'advertencia', ativa: true }); })}>
            Adicionar sanção
          </Button>
        </Stack>
      </Bloco>

      <Bloco titulo="Reincidência" descricao="Procedente = qualquer decisão diferente de arquivar. Quando o histórico atinge uma regra, o painel sugere a sanção (vale a regra mais grave).">
        <Stack spacing={2}>
          {s.reincidencia.length === 0 && <Typography variant="body2" color="text.secondary">Nenhuma regra: o sistema não sugere sanções.</Typography>}
          {s.reincidencia.map((r, i) => {
            const p = `sancoes.reincidencia.${i}`;
            return (
              <Box key={i} sx={{ display: 'grid', gap: 1.5, alignItems: 'start', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 2fr auto' } }}>
                <CampoNumero rotulo="Procedentes" valor={r.procedentes} min={1} erro={erro(`${p}.procedentes`)}
                  onChange={(v) => mudar((cc) => { cc.sancoes.reincidencia[i].procedentes = v; })} />
                <CampoNumero rotulo="Em até" sufixo="dias" valor={r.janelaDias} min={1} erro={erro(`${p}.janelaDias`)}
                  onChange={(v) => mudar((cc) => { cc.sancoes.reincidencia[i].janelaDias = v; })} />
                <TextField select label="Sanção sugerida" value={ativas.some((a) => a.id === r.sancaoId) ? r.sancaoId : ''}
                  error={Boolean(erro(`${p}.sancaoId`))} helperText={erro(`${p}.sancaoId`)}
                  onChange={(e) => mudar((cc) => { cc.sancoes.reincidencia[i].sancaoId = e.target.value; })}>
                  {ativas.map((a) => <MenuItem key={a.id} value={a.id}>{a.nome || '(sem nome)'}</MenuItem>)}
                </TextField>
                <IconButton aria-label="Excluir regra" onClick={() => mudar((cc) => { cc.sancoes.reincidencia.splice(i, 1); })}><DeleteOutline /></IconButton>
              </Box>
            );
          })}
          <Button startIcon={<Add />} sx={{ alignSelf: 'flex-start' }} disabled={ativas.length === 0}
            onClick={() => mudar((cc) => { cc.sancoes.reincidencia.push({ procedentes: 2, janelaDias: 90, sancaoId: ativas[0].id }); })}>
            Adicionar regra
          </Button>
        </Stack>
      </Bloco>

      <Bloco titulo="Decisão e recurso">
        <Grade>
          <CampoNumero rotulo="Justificativa mínima" sufixo="caracteres" valor={s.justificativaMin} min={10} max={1000}
            erro={erro('sancoes.justificativaMin')} ajuda="Toda decisão exige justificativa."
            onChange={(v) => mudar((cc) => { cc.sancoes.justificativaMin = v; })} />
          <CampoDuracao rotulo="Prazo para recorrer" valor={s.prazoRecurso} erro={erro('sancoes.prazoRecurso.valor')}
            onChange={(v) => mudar((cc) => { cc.sancoes.prazoRecurso = v; })} />
          <FormControlLabel sx={{ m: 0, alignItems: 'flex-start' }}
            control={<Switch checked={s.segundoAdminBloqueio} onChange={(_, v) => mudar((cc) => { cc.sancoes.segundoAdminBloqueio = v; })} />}
            label={<Box><Typography>Exigir 2º admin para bloqueio permanente</Typography><Typography variant="caption" color="text.secondary">O bloqueio fica “aguardando 2ª aprovação” até outro admin aprovar ou recusar.</Typography></Box>} />
        </Grade>
      </Bloco>
    </Stack>
  );
}
