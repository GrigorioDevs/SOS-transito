// G) Organização.
import { MenuItem, TextField } from '@mui/material';
import { FORMATOS_DATA, FUSOS } from '../../../config/padrao';
import { formatarData } from '../../../config/regras';
import { Bloco, Grade, type PropsSecao } from '../campos';

export default function SecaoOrganizacao({ c, mudar, erro }: PropsSecao) {
  const o = c.organizacao;
  const exemplo = (formato: string) => {
    try { return formatarData(new Date().toISOString(), { ...c, organizacao: { ...o, formatoData: formato } }); } catch { return formato; }
  };
  return (
    <Bloco titulo="Organização" descricao="Dados da empresa que usa o painel. O fuso e o formato valem para as datas exibidas.">
      <Grade>
        <TextField label="Nome da empresa" value={o.nomeEmpresa} error={Boolean(erro('organizacao.nomeEmpresa'))} helperText={erro('organizacao.nomeEmpresa')}
          onChange={(e) => mudar((x) => { x.organizacao.nomeEmpresa = e.target.value; })} />
        <TextField select label="Fuso horário" value={o.fusoHorario} error={Boolean(erro('organizacao.fusoHorario'))} helperText={erro('organizacao.fusoHorario')}
          onChange={(e) => mudar((x) => { x.organizacao.fusoHorario = e.target.value; })}>
          {FUSOS.map((f) => <MenuItem key={f} value={f}>{f.replace('America/', '').replace('_', ' ')}</MenuItem>)}
        </TextField>
        <TextField select label="Formato de data" value={o.formatoData} error={Boolean(erro('organizacao.formatoData'))} helperText={erro('organizacao.formatoData')}
          onChange={(e) => mudar((x) => { x.organizacao.formatoData = e.target.value; })}>
          {FORMATOS_DATA.map((f) => <MenuItem key={f} value={f}>{f.replace('yyyy', 'aaaa')} — ex.: {exemplo(f)}</MenuItem>)}
        </TextField>
      </Grade>
    </Bloco>
  );
}
