// Tipos do painel de OPERAÇÃO (fictício). Os tipos de governança ficam em src/api/tipos.ts
// e são reexportados aqui para manter os imports antigos funcionando.
import type { Kpi } from '../../../api/tipos';

export type * from '../../../api/tipos';

export type StatusChamado = 'procurando' | 'a_caminho' | 'chegou' | 'em_atendimento' | 'concluido';

export interface Chamado {
  id: string;
  tipo: string;
  endereco: string;
  status: StatusChamado;
  parceiro: string;
  eta: string;
  valor: string;
  tempo: string;
}

export interface ParceiroPendente {
  id: string;
  nome: string;
  servico: string;
  docs: number;
  cidade: string;
  enviado: string;
}

export interface Preco {
  servico: string;
  saida: string;
  km: string;
  minimo: string;
}

export interface Disputa {
  id: string;
  motivo: string;
  valor: string;
}

export interface EventoOperacao {
  hora: string;
  texto: string;
  tipo: 'aceite' | 'alerta' | 'adicional' | 'cadastro' | 'ok';
}

export interface PainelOperacao {
  kpis: Kpi[];
  chamados: Chamado[];
  precos: Preco[];
  disputas: Disputa[];
  eventos: EventoOperacao[];
}
