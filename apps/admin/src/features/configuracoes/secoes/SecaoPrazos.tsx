// A) Prazos da moderação por nível de criticidade.
import { Alert, Button, FormControlLabel, IconButton, MenuItem, Radio, RadioGroup, Stack, TextField, Tooltip } from '@mui/material';
import Add from '@mui/icons-material/Add';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { ROTULO_AO_VENCER } from '../../../config/padrao';
import type { AoVencerDefesa, Contagem } from '../../../config/tipos';
import { Bloco, BolinhaCor, CampoCor, CampoDuracao, Grade, mover, novoId, type PropsSecao } from '../campos';

export default function SecaoPrazos({ c, mudar, erro }: PropsSecao) {
  const niveis = c.moderacao.niveis;
  const emUso = (id: string) => c.categorias.some((x) => x.nivelId === id);

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        As mudanças valem só para <b>casos novos</b>. Casos já abertos mantêm os prazos da configuração em que foram abertos.
      </Alert>

      <Bloco titulo="Contagem dos prazos" descricao="Prazos em horas contam sempre em horas corridas. Dias úteis = segunda a sexta (feriados ainda não entram na conta).">
        <RadioGroup row value={c.moderacao.contagem} onChange={(_, v) => mudar((x) => { x.moderacao.contagem = v as Contagem; })}>
          <FormControlLabel value="corridos" control={<Radio />} label="Dias corridos" />
          <FormControlLabel value="uteis" control={<Radio />} label="Dias úteis" />
        </RadioGroup>
      </Bloco>

      {erro('moderacao.niveis') && <Alert severity="error">{erro('moderacao.niveis')}</Alert>}

      {niveis.map((n, i) => {
        const p = `moderacao.niveis.${i}`;
        const set = (fn: (nv: typeof n) => void) => mudar((x) => fn(x.moderacao.niveis[i]));
        const usado = emUso(n.id);
        return (
          <Bloco
            key={n.id}
            titulo={<><BolinhaCor cor={n.cor} />{n.nome || 'Novo nível'} <small style={{ fontWeight: 400, opacity: 0.7 }}>· ordem {i + 1}</small></>}
            acao={
              <Stack direction="row">
                <IconButton aria-label={`Subir ${n.nome}`} disabled={i === 0} onClick={() => mudar((x) => mover(x.moderacao.niveis, i, i - 1))}><ArrowUpward /></IconButton>
                <IconButton aria-label={`Descer ${n.nome}`} disabled={i === niveis.length - 1} onClick={() => mudar((x) => mover(x.moderacao.niveis, i, i + 1))}><ArrowDownward /></IconButton>
                <Tooltip title={usado ? 'Em uso por categorias. Troque a criticidade delas antes de excluir.' : 'Excluir nível'}>
                  <span>
                    <IconButton aria-label={`Excluir ${n.nome}`} disabled={usado || niveis.length === 1}
                      onClick={() => mudar((x) => { x.moderacao.niveis.splice(i, 1); })}><DeleteOutline /></IconButton>
                  </span>
                </Tooltip>
              </Stack>
            }
          >
            <Grade>
              <TextField label="Nome" value={n.nome} onChange={(e) => set((nv) => { nv.nome = e.target.value; })}
                error={Boolean(erro(`${p}.nome`))} helperText={erro(`${p}.nome`)} />
              <CampoCor rotulo="Cor" valor={n.cor} onChange={(v) => set((nv) => { nv.cor = v; })} erro={erro(`${p}.cor`)} />
              <TextField select label="Ao vencer o prazo de defesa" value={n.aoVencerDefesa}
                onChange={(e) => set((nv) => { nv.aoVencerDefesa = e.target.value as AoVencerDefesa; })}>
                {Object.entries(ROTULO_AO_VENCER).map(([v, r]) => <MenuItem key={v} value={v}>{r}</MenuItem>)}
              </TextField>
              <CampoDuracao rotulo="Prazo para defesa e provas" valor={n.prazoDefesa} onChange={(v) => set((nv) => { nv.prazoDefesa = v; })}
                erro={erro(`${p}.prazoDefesa.valor`)} ajuda="Para o denunciado se defender." />
              <CampoDuracao rotulo="Prazo para decidir (SLA)" valor={n.prazoDecisao} onChange={(v) => set((nv) => { nv.prazoDecisao = v; })}
                erro={erro(`${p}.prazoDecisao.valor`)} ajuda="Para o admin analisar e decidir." />
              <CampoDuracao rotulo="Lembrete antes de vencer" valor={n.lembreteAntes} onChange={(v) => set((nv) => { nv.lembreteAntes = v; })}
                erro={erro(`${p}.lembreteAntes.valor`)} ajuda="0 = sem lembrete." />
            </Grade>
          </Bloco>
        );
      })}

      <Button startIcon={<Add />} sx={{ alignSelf: 'flex-start' }} onClick={() => mudar((x) => {
        const ultimo = x.moderacao.niveis[x.moderacao.niveis.length - 1];
        x.moderacao.niveis.push({
          id: novoId('nivel'), nome: '', cor: '#8494A7', ordem: x.moderacao.niveis.length + 1,
          prazoDefesa: { ...(ultimo?.prazoDefesa ?? { valor: 5, unidade: 'dias' }) },
          prazoDecisao: { ...(ultimo?.prazoDecisao ?? { valor: 5, unidade: 'dias' }) },
          lembreteAntes: { ...(ultimo?.lembreteAntes ?? { valor: 1, unidade: 'dias' }) },
          aoVencerDefesa: 'decidir_sem_defesa',
        });
      })}>Adicionar nível</Button>
    </Stack>
  );
}
