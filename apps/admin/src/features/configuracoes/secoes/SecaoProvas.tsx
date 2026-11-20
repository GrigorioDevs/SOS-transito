// D) Provas anexadas às denúncias.
import { Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, Stack } from '@mui/material';
import { TIPOS_ARQUIVO } from '../../../config/padrao';
import { Bloco, CampoNumero, Grade, type PropsSecao } from '../campos';

export default function SecaoProvas({ c, mudar, erro }: PropsSecao) {
  const p = c.provas;
  const alternar = (mime: string, marcado: boolean) => mudar((x) => {
    x.provas.tiposAceitos = marcado ? [...x.provas.tiposAceitos, mime] : x.provas.tiposAceitos.filter((t) => t !== mime);
  });
  return (
    <Bloco titulo="Provas" descricao="Regras para os arquivos que cliente e prestador anexam na denúncia e na defesa.">
      <Stack spacing={3}>
        <FormControl error={Boolean(erro('provas.tiposAceitos'))} component="fieldset">
          <FormLabel component="legend">Tipos de arquivo aceitos</FormLabel>
          <FormGroup row>
            {TIPOS_ARQUIVO.map((t) => (
              <FormControlLabel key={t.mime} label={t.rotulo}
                control={<Checkbox checked={p.tiposAceitos.includes(t.mime)} onChange={(_, v) => alternar(t.mime, v)} />} />
            ))}
          </FormGroup>
          {erro('provas.tiposAceitos') && <FormHelperText>{erro('provas.tiposAceitos')}</FormHelperText>}
        </FormControl>
        <Grade>
          <CampoNumero rotulo="Tamanho máximo por arquivo" sufixo="MB" valor={p.tamanhoMaxMB} min={1} max={100}
            erro={erro('provas.tamanhoMaxMB')} onChange={(v) => mudar((x) => { x.provas.tamanhoMaxMB = v; })} />
          <CampoNumero rotulo="Quantidade máxima por denúncia" sufixo="arquivos" valor={p.maxPorDenuncia} min={1} max={50}
            erro={erro('provas.maxPorDenuncia')} onChange={(v) => mudar((x) => { x.provas.maxPorDenuncia = v; })} />
          <CampoNumero rotulo="Guardar após o encerramento" sufixo="dias" valor={p.guardaDias} min={30} max={3650}
            erro={erro('provas.guardaDias')} ajuda="Depois desse prazo as provas são apagadas (LGPD)."
            onChange={(v) => mudar((x) => { x.provas.guardaDias = v; })} />
        </Grade>
      </Stack>
    </Bloco>
  );
}
