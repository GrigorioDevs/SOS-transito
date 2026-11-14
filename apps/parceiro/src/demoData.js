// Apenas dados ilustrativos para apresentar a interface. Não vêm de API/SignalR.
export const demoOffers = [
  {
    id: 'SOS-2408', type: 'Guincho', icon: 'Truck', category: 'guincho', price: 185.0,
    distance: '3,2 km', eta: '7 min', length: '14,2 km',
    pickup: 'Av. Henrique G. Baptista, Barueri', destination: 'Alameda Rio Negro, Alphaville',
    person: 'Mariana R.', vehicle: 'Chevrolet Onix', note: 'Veículo não liga. Precisa de remoção.',
    badge: 'Mais próximo', wait: 28,
  },
  {
    id: 'SOS-2410', type: 'Pane elétrica', icon: 'Zap', category: 'eletrica', price: 92.5,
    distance: '1,7 km', eta: '5 min', length: 'Atendimento no local',
    pickup: 'Rua Campos Sales, 421, Barueri', destination: '',
    person: 'Ricardo M.', vehicle: 'Honda Fit', note: 'Bateria descarregada.',
    badge: 'Alta prioridade', wait: 25,
  },
  {
    id: 'SOS-2412', type: 'Pneu furado', icon: 'Disc3', category: 'pneu', price: 78.0,
    distance: '4,1 km', eta: '10 min', length: 'Atendimento no local',
    pickup: 'Estrada dos Romeiros, Santana de Parnaíba', destination: '',
    person: 'Paula C.', vehicle: 'Hyundai HB20', note: 'Troca do pneu dianteiro.',
    badge: 'Novo chamado', wait: 30,
  },
  {
    id: 'SOS-2416', type: 'Pane seca', icon: 'Fuel', category: 'combustivel', price: 64.9,
    distance: '5,8 km', eta: '12 min', length: 'Atendimento no local',
    pickup: 'Av. dos Autonomistas, Osasco', destination: '',
    person: 'Roberto S.', vehicle: 'Fiat Argo', note: 'Entrega de combustível.',
    badge: 'Novo chamado', wait: 25,
  },
];

export const serviceTypes = [
  { id: 'guincho', label: 'Guincho', icon: 'Truck', description: 'Reboque e remoção' },
  { id: 'eletrica', label: 'Pane elétrica', icon: 'Zap', description: 'Bateria e partida' },
  { id: 'pneu', label: 'Borracheiro', icon: 'Disc3', description: 'Troca e reparo' },
  { id: 'combustivel', label: 'Pane seca', icon: 'Fuel', description: 'Combustível no local' },
  { id: 'chaveiro', label: 'Chaveiro', icon: 'KeyRound', description: 'Abertura assistida' },
];

export const demoTransactions = [
  { id: 'TR-5301', title: 'Guincho · Barueri', date: 'Hoje, 14:32', amount: 112.1, status: 'Concluído' },
  { id: 'TR-5300', title: 'Pane elétrica · Osasco', date: 'Hoje, 11:08', amount: 74.0, status: 'Concluído' },
  { id: 'TR-5299', title: 'Troca de pneu · Jandira', date: 'Hoje, 08:46', amount: 62.4, status: 'Concluído' },
  { id: 'TR-5291', title: 'Guincho · Alphaville', date: 'Ontem, 18:12', amount: 165.0, status: 'Repassado' },
];

export const demoChats = [
  { id: 'a', name: 'Suporte SOS', detail: 'Equipe de atendimento', time: '09:41', unread: 1,
    messages: [
      { from: 'them', text: 'Olá! Este é o canal de suporte do parceiro.', time: '09:40' },
      { from: 'them', text: 'Precisa de ajuda com um atendimento?', time: '09:41' },
    ] },
  { id: 'b', name: 'Central de operações', detail: 'Avisos da plataforma', time: 'Ontem', unread: 0,
    messages: [
      { from: 'them', text: 'Bem-vindo ao SOS Trânsito. Os chamados aparecerão aqui quando a API estiver conectada.', time: '16:10' },
    ] },
];

export const brl = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
