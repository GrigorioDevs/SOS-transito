// F) Retenção (saídas) e avaliações (notas).
import { MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Bloco, CampoNumero, Grade, ListaTextos, type PropsSecao } from '../campos';

const NOTAS = [1, 2, 3, 4, 5];
const faixa = (de: number, ate: number) => (de > ate ? 'nenhuma' : de === ate ? `${de}★` : `${de}★ a ${ate}★`);

export default function SecaoRetencao({ c, mudar, erro }: PropsSecao) {
  const a = c.avaliacoes;
  const seletor = (campo: keyof typeof a, rotulo: string, ajuda: string) => (
    <TextField select label={rotulo} value={a[campo]} error={Boolean(erro(`avaliacoes.${campo}`))} helperText={erro(`avaliacoes.${campo}`) ?? ajuda}
      onChange={(e) => mudar((x) => { x.avaliacoes[campo] = Number(e.target.value); })}>
      {NOTAS.map((n) => <MenuItem key={n} value={n}>{n}★</MenuItem>)}
    </TextField>
  );
  const valido = a.notaAlertaRevisao <= a.notaInsatisfeito && a.notaInsatisfeito < a.notaSatisfeito;

  return (
    <Stack spacing={2}>
      <Bloco titulo="Retenção" descricao="Define quando um usuário conta como “saiu do app” e os motivos oferecidos na pesquisa de saída.">
        <Stack spacing={3}>
          <Grade>
            <CampoNumero rotulo="Dias sem uso para considerar que saiu" sufixo="dias" valor={c.retencao.diasSemUsoParaSaida} min={7} max={730}
              erro={erro('retencao.diasSemUsoParaSaida')} onChange={(v) => mudar((x) => { x.retencao.diasSemUsoParaSaida = v; })} />
          </Grade>
          <ListaTextos rotulo="Motivo" caminho="retencao.motivosSaida" itens={c.retencao.motivosSaida} erro={erro} rotuloNovo="Adicionar motivo"
            onChange={(v) => mudar((x) => { x.retencao.motivosSaida = v; })} />
        </Stack>
      </Bloco>
      <Bloco titulo="Avaliações" descricao="Regra: alerta ≤ insatisfeito < satisfeito. Entre insatisfeito e satisfeito a nota é neutra.">
        <Grade>
          {seletor('notaAlertaRevisao', 'Alerta para revisão até', 'Avaliações com esta nota ou menos geram alerta.')}
          {seletor('notaInsatisfeito', 'Insatisfeito até', 'Conta como insatisfação.')}
          {seletor('notaSatisfeito', 'Satisfeito a partir de', 'Conta como satisfação.')}
        </Grade>
        {valido && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Alerta: {faixa(1, a.notaAlertaRevisao)} · Insatisfeito: {faixa(1, a.notaInsatisfeito)} · Neutro: {faixa(a.notaInsatisfeito + 1, a.notaSatisfeito - 1)} · Satisfeito: {faixa(a.notaSatisfeito, 5)}
          </Typography>
        )}
      </Bloco>
    </Stack>
  );
}
