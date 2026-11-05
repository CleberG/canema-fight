// Dados fictícios do protótipo.

export const EVENTO = {
  nome: 'Canema Fight 3',
  subtitulo: 'Noite de Muay Thai',
  data: '2026-12-12T18:00:00',
  dataTexto: 'Sábado, 12 de dezembro · 18h',
  local: 'Ginásio Municipal Canema',
  cidade: 'Blumenau / SC',
  inscricao: 80,
  tipoChave: 'email',
  chavePix: 'pix@canemafight.com.br',
  recebedor: 'Canema Fight Eventos',
};

// '2026-12-12T18:00:00' → 'Sábado, 12 de dezembro · 18h'
export function textoData(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dia = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hora = `${d.getHours()}h${d.getMinutes() ? String(d.getMinutes()).padStart(2, '0') : ''}`;
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} · ${hora}`;
}

const atleta = (id, nome, sexo, idade, peso, altura, academia, professor, lutas, luvoes, tempoTreino, instagram, status, pagamento) => ({
  id, nome, sexo, idade, peso, altura, academia, professor, lutas, luvoes, tempoTreino, instagram, status, pagamento, cidade: 'Blumenau / SC',
});

// status: 'aguardando' (sem luta) | 'confirmado' (em luta aprovada)
// pagamento: 'pago' | 'pendente' | 'expirado'
export const ATLETAS = [
  atleta(1, 'Larissa Prado Vieira', 'Feminino', 24, 57.2, 1.64, 'Kombat Thai', 'Kru Diego', 4, 6, 30, '@lari.kombat', 'aguardando', 'pago'),
  atleta(2, 'Bruna Tavares Lins', 'Feminino', 26, 56.4, 1.61, 'Leões do Vale', 'Prof. Marcos', 5, 4, 36, '@brunatlins', 'aguardando', 'pago'),
  atleta(3, 'Camila Rocha Antunes', 'Feminino', 21, 61.0, 1.68, 'Dragão Negro CT', 'Kru Ana', 1, 3, 14, '@camirocha', 'aguardando', 'pendente'),
  atleta(4, 'Juliana Ferraz Dias', 'Feminino', 23, 60.1, 1.66, 'Kombat Thai', 'Kru Diego', 2, 2, 16, '@ju.ferraz', 'aguardando', 'pago'),
  atleta(5, 'Sofia Mendes Kraus', 'Feminino', 15, 48.3, 1.57, 'Leões do Vale', 'Prof. Marcos', 1, 4, 18, '@sofi.kraus', 'aguardando', 'pago'),
  atleta(6, 'Helena Castro Pinho', 'Feminino', 16, 49.5, 1.59, 'Dragão Negro CT', 'Kru Ana', 2, 3, 20, '@helenacp', 'aguardando', 'pendente'),
  atleta(7, 'Rafael Nunes Belo', 'Masculino', 28, 71.8, 1.76, 'Leões do Vale', 'Prof. Marcos', 6, 5, 48, '@rafabelo', 'aguardando', 'pago'),
  atleta(8, 'Thiago Lemos Carvalho', 'Masculino', 27, 72.5, 1.78, 'Kombat Thai', 'Kru Diego', 7, 4, 50, '@thiagolemos', 'aguardando', 'pago'),
  atleta(9, 'Gustavo Pereira Hass', 'Masculino', 19, 65.9, 1.72, 'Muay Thai Itoupava', 'Kru Paulo', 0, 2, 10, '@gus.hass', 'aguardando', 'pendente'),
  atleta(10, 'Lucas Andrade Weiss', 'Masculino', 20, 66.7, 1.74, 'Dragão Negro CT', 'Kru Ana', 1, 1, 12, '@lucasweiss', 'aguardando', 'pago'),
  atleta(11, 'Pedro Henrique Zimmer', 'Masculino', 14, 44.0, 1.55, 'Kombat Thai', 'Kru Diego', 0, 3, 12, '@pedrozimmer', 'aguardando', 'pago'),
  atleta(12, 'Enzo Machado Rosa', 'Masculino', 15, 45.2, 1.58, 'Muay Thai Itoupava', 'Kru Paulo', 1, 2, 14, '@enzo.rosa', 'aguardando', 'expirado'),
  atleta(13, 'Mateus Correia Lopes', 'Masculino', 31, 80.4, 1.82, 'Muay Thai Itoupava', 'Kru Paulo', 9, 3, 72, '@mateuscl', 'aguardando', 'pago'),
  atleta(14, 'André Siqueira Brum', 'Masculino', 29, 81.9, 1.80, 'Leões do Vale', 'Prof. Marcos', 8, 6, 60, '@andrebrum', 'aguardando', 'pendente'),
  atleta(15, 'Vitória Lang Schulz', 'Feminino', 17, 58.0, 1.65, 'Muay Thai Itoupava', 'Kru Paulo', 0, 1, 8, '@vic.schulz', 'aguardando', 'pago'),
  atleta(16, 'Isadora Ramos Faria', 'Feminino', 22, 57.9, 1.63, 'Muay Thai Itoupava', 'Kru Paulo', 3, 5, 26, '@isaramos', 'aguardando', 'pago'),
  atleta(17, 'Diego Fontes Arruda', 'Masculino', 25, 70.6, 1.75, 'Muay Thai Itoupava', 'Kru Paulo', 5, 5, 40, '@diegoarruda', 'aguardando', 'pago'),
  atleta(18, 'Nicolas Becker Prates', 'Masculino', 16, 60.3, 1.70, 'Leões do Vale', 'Prof. Marcos', 2, 3, 22, '@nico.becker', 'aguardando', 'pendente'),
];

// Data/hora fictícia do pagamento Pix
export const PAGAMENTOS_INFO = {
  1: '02/11 14:12', 2: '02/11 18:40', 4: '03/11 09:05', 5: '03/11 11:22', 7: '04/11 20:15',
  8: '04/11 21:01', 10: '05/11 08:44', 11: '05/11 10:30', 13: '06/11 16:09', 15: '06/11 19:27',
  16: '07/11 12:00', 17: '07/11 13:48',
};

// Cada tipo vende por lotes, em ordem: o lote vigente é o primeiro que ainda tem ingressos.
export const INGRESSOS = [
  {
    id: 'pista', nome: 'Pista', descricao: 'Arquibancada geral',
    lotes: [
      { nome: '1º lote', preco: 30, qtd: 150, vendidos: 150 },
      { nome: '2º lote', preco: 40, qtd: 250, vendidos: 162 },
      { nome: '3º lote', preco: 50, qtd: 100, vendidos: 0 },
    ],
  },
  {
    id: 'meia', nome: 'Meia-entrada', descricao: 'Estudantes, idosos e PcD · documento na portaria',
    lotes: [
      { nome: '1º lote', preco: 15, qtd: 80, vendidos: 80 },
      { nome: '2º lote', preco: 20, qtd: 120, vendidos: 38 },
    ],
  },
  {
    id: 'ringside', nome: 'Ringside', descricao: 'Cadeira numerada na beira do ringue',
    lotes: [{ nome: 'Lote único', preco: 120, qtd: 60, vendidos: 54 }],
  },
];

export const vendidosDe = (i) => i.lotes.reduce((s, l) => s + l.vendidos, 0);
export const totalDe = (i) => i.lotes.reduce((s, l) => s + l.qtd, 0);
export const indiceLoteAtual = (i) => i.lotes.findIndex((l) => l.vendidos < l.qtd);
export const loteAtual = (i) => i.lotes[indiceLoteAtual(i)] ?? null;

// Soma `qtd` ingressos vendidos ao lote vigente do tipo `id`.
export function venderNoLote(ingressos, id, qtd) {
  return ingressos.map((i) => {
    if (i.id !== id || !qtd) return i;
    const n = indiceLoteAtual(i);
    return { ...i, lotes: i.lotes.map((l, k) => (k === n ? { ...l, vendidos: l.vendidos + qtd } : l)) };
  });
}

// Código curto e único para o QR do ingresso.
export function novoCodigo(existentes) {
  const usados = new Set(existentes);
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c;
  do {
    c = `CF3-${Array.from({ length: 5 }, () => letras[Math.floor(Math.random() * letras.length)]).join('')}`;
  } while (usados.has(c));
  return c;
}

// Ingressos emitidos usados na portaria. status: 'valido' | 'usado' | 'cancelado'
export const BILHETES = [
  { codigo: 'CF3-7K2Q9', nome: 'Marina Souza Teles', idade: 29, tipo: 'Pista', lote: '2º lote', status: 'valido', pedidoId: 1, pagamento: 'pago' },
  { codigo: 'CF3-3H8LM', nome: 'Carlos Eduardo Ritter', idade: 41, tipo: 'Ringside', lote: 'Lote único', status: 'valido', pedidoId: 2, pagamento: 'pago' },
  { codigo: 'CF3-9P4XA', nome: 'Fernanda Klein', idade: 19, tipo: 'Meia-entrada', lote: '1º lote', status: 'valido', pedidoId: 3, pagamento: 'pago' },
  { codigo: 'CF3-1B6TR', nome: 'Rodrigo Albuquerque', idade: 35, tipo: 'Pista', lote: '1º lote', status: 'usado', horario: '18:42', pedidoId: 4, pagamento: 'pago' },
  { codigo: 'CF3-5Z0NC', nome: 'Patrícia Vogel', idade: 52, tipo: 'Pista', lote: '2º lote', status: 'cancelado', pedidoId: 5, pagamento: 'cancelado' },
  { codigo: 'CF3-8W3DE', nome: 'Henrique Batista', idade: 33, tipo: 'Ringside', lote: 'Lote único', status: 'valido', pedidoId: 6, pagamento: 'pago' },
  { codigo: 'CF3-2M7GU', nome: 'Aline Fritzen', idade: 67, tipo: 'Meia-entrada', lote: '2º lote', status: 'usado', horario: '18:55', pedidoId: 7, pagamento: 'pago' },
  { codigo: 'CF3-4R9JT', nome: 'Bianca Moretti', idade: 38, tipo: 'Pista', lote: '2º lote', status: 'valido', pedidoId: 8, pagamento: 'pendente' },
  { codigo: 'CF3-6V2PA', nome: 'Otávio Moretti', idade: 12, tipo: 'Meia-entrada', lote: '2º lote', status: 'valido', pedidoId: 8, pagamento: 'pendente' },
];

// Pedido = uma compra (um Pix). pagamento: 'pago' | 'pendente' | 'cancelado'
const PRECO_DEMO = { 1: 40, 2: 120, 3: 15, 4: 30, 5: 40, 6: 120, 7: 20, 8: 60 };
export const PEDIDOS = [...new Set(BILHETES.map((b) => b.pedidoId))].map((id) => {
  const itens = BILHETES.filter((b) => b.pedidoId === id);
  return {
    id, compradorNome: itens[0].nome, compradorEmail: null, total: PRECO_DEMO[id], pagamento: itens[0].pagamento,
    criadoEm: `2026-11-0${(id % 7) + 1}T1${id % 10}:00:00`, bilhetes: itens.map(({ codigo, nome, idade, tipo, lote }) => ({ codigo, nome, idade, tipo, lote })),
  };
}).reverse();

export const CHECKINS_INICIAIS = 186;
