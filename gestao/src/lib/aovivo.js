// Estado das lutas durante o evento (gravado em eventos.ao_vivo).
// { atual: id da luta em andamento | null, inicio: ISO | null, ultima: id da última encerrada (para desfazer),
//   resultados: { <id>: { vencedor: 'vermelho'|'azul'|'empate'|null, inicio, fim } },
//   ordem: ids na sequência ajustada durante o evento (adiar/adiantar) | null = ordem do card }

export const VAZIO = { atual: null, inicio: null, ultima: null, resultados: {}, ordem: null };

export const normalizar = (v) => ({ ...VAZIO, ...(v ?? {}), resultados: { ...(v?.resultados ?? {}) } });

// Ordem em que as lutas acontecem: o card público vem com a principal primeiro.
export const ordemDaNoite = (cardPublico) => [...cardPublico].reverse();

// Ordem da noite com os ajustes feitos durante o evento (lutas adiadas ou adiantadas).
// Lutas que não estão na ordem ajustada (ex.: entraram no card depois) vão para o fim.
export function sequencia(cardPublico, aoVivo) {
  const v = normalizar(aoVivo);
  const base = ordemDaNoite(cardPublico);
  if (!Array.isArray(v.ordem)) return base;
  const pos = new Map(v.ordem.map((id, i) => [id, i]));
  return base
    .map((l, i) => ({ l, k: pos.has(l.id) ? pos.get(l.id) : v.ordem.length + i }))
    .sort((x, y) => x.k - y.k)
    .map((x) => x.l);
}

const aguardando = (v, id) => id !== v.atual && !v.resultados[id];

export function situacao(aoVivo, id) {
  const v = normalizar(aoVivo);
  if (v.atual === id) return 'ao_vivo';
  if (v.resultados[id]) return 'encerrada';
  return 'aguardando';
}

// Primeira luta (na ordem da noite) que ainda não aconteceu nem está acontecendo.
export function proxima(cardPublico, aoVivo) {
  const v = normalizar(aoVivo);
  return sequencia(cardPublico, v).find((l) => aguardando(v, l.id)) ?? null;
}

// Lutas que ainda vão acontecer, na ordem em que vão acontecer.
export function fila(cardPublico, aoVivo) {
  const v = normalizar(aoVivo);
  return sequencia(cardPublico, v).filter((l) => aguardando(v, l.id));
}

// Adiar: a luta vai para o fim da fila.
export function adiar(aoVivo, cardPublico, id) {
  const v = normalizar(aoVivo);
  if (!aguardando(v, id)) return v;
  const ids = sequencia(cardPublico, v).map((l) => l.id).filter((x) => x !== id);
  return { ...v, ordem: [...ids, id] };
}

// Adiantar: a luta passa a ser a próxima.
export function adiantar(aoVivo, cardPublico, id) {
  const v = normalizar(aoVivo);
  if (!aguardando(v, id)) return v;
  const ids = sequencia(cardPublico, v).map((l) => l.id).filter((x) => x !== id);
  const i = ids.findIndex((x) => aguardando(v, x));
  return { ...v, ordem: i < 0 ? [...ids, id] : [...ids.slice(0, i), id, ...ids.slice(i)] };
}

// Volta a luta para o card como se não tivesse acontecido (ao vivo ou encerrada → aguardando).
export function voltarParaCard(aoVivo, id) {
  const v = normalizar(aoVivo);
  const { [id]: _r, ...resultados } = v.resultados;
  const ativa = v.atual === id;
  return {
    ...v,
    atual: ativa ? null : v.atual,
    inicio: ativa ? null : v.inicio,
    ultima: v.ultima === id ? null : v.ultima,
    resultados,
  };
}

export function iniciar(aoVivo, id, agora = new Date().toISOString()) {
  const v = normalizar(aoVivo);
  if (v.atual) return v; // uma luta por vez: encerre a atual antes
  const { [id]: _antigo, ...resultados } = v.resultados; // reiniciar uma luta apaga o resultado anterior
  return { ...v, atual: id, inicio: agora, resultados };
}

export function encerrar(aoVivo, vencedor = null, agora = new Date().toISOString()) {
  const v = normalizar(aoVivo);
  if (!v.atual) return v;
  return {
    ...v,
    atual: null,
    inicio: null,
    ultima: v.atual,
    resultados: { ...v.resultados, [v.atual]: { vencedor, inicio: v.inicio, fim: agora } },
  };
}

// Volta a última luta encerrada para "ao vivo" (encerrou por engano).
export function desfazer(aoVivo) {
  const v = normalizar(aoVivo);
  if (v.atual || !v.ultima || !v.resultados[v.ultima]) return v;
  const { [v.ultima]: r, ...resultados } = v.resultados;
  return { ...v, atual: v.ultima, inicio: r.inicio ?? new Date().toISOString(), ultima: null, resultados };
}

export function corrigirVencedor(aoVivo, id, vencedor) {
  const v = normalizar(aoVivo);
  if (!v.resultados[id]) return v;
  return { ...v, resultados: { ...v.resultados, [id]: { ...v.resultados[id], vencedor } } };
}

export const VENCEDORES = [
  { id: 'vermelho', label: 'Vermelho' },
  { id: 'azul', label: 'Azul' },
  { id: 'empate', label: 'Empate' },
];

// "04:12" desde o início da luta
export function tempoDecorrido(inicio, agora = Date.now()) {
  if (!inicio) return '00:00';
  const s = Math.max(0, Math.floor((agora - new Date(inicio).getTime()) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
