// Estado das lutas durante o evento (gravado em eventos.ao_vivo).
// { atual: id da luta em andamento | null, inicio: ISO | null, ultima: id da última encerrada (para desfazer),
//   resultados: { <id>: { vencedor: 'vermelho'|'azul'|'empate'|null, inicio, fim } } }

export const VAZIO = { atual: null, inicio: null, ultima: null, resultados: {} };

export const normalizar = (v) => ({ ...VAZIO, ...(v ?? {}), resultados: { ...(v?.resultados ?? {}) } });

// Ordem em que as lutas acontecem: o card público vem com a principal primeiro.
export const ordemDaNoite = (cardPublico) => [...cardPublico].reverse();

export function situacao(aoVivo, id) {
  const v = normalizar(aoVivo);
  if (v.atual === id) return 'ao_vivo';
  if (v.resultados[id]) return 'encerrada';
  return 'aguardando';
}

// Primeira luta (na ordem da noite) que ainda não aconteceu nem está acontecendo.
export function proxima(cardPublico, aoVivo) {
  const v = normalizar(aoVivo);
  return ordemDaNoite(cardPublico).find((l) => l.id !== v.atual && !v.resultados[l.id]) ?? null;
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
