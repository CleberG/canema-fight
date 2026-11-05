// Regras de match entre atletas.
// Eliminatórias: mesmo sexo, até 2 kg, menor nunca contra adulto,
// menores com até 2 anos de diferença, nunca a mesma academia.
// Pontuação 0–100 pela proximidade de peso, idade e experiência.

export const LIMITE_PESO = 2;
export const LIMITE_IDADE_MENOR = 2;

export const ehMenor = (a) => a.idade != null && a.idade < 18;
// Sem idade ou peso não dá para sugerir match com segurança.
const completo = (a) => a.idade != null && a.peso != null;

export function bloqueios(a, b) {
  const motivos = [];
  if (a.sexo !== b.sexo) motivos.push('Sexos diferentes');
  if (Math.abs(a.peso - b.peso) > LIMITE_PESO) motivos.push(`Diferença de peso acima de ${LIMITE_PESO} kg`);
  if (ehMenor(a) !== ehMenor(b)) motivos.push('Menor contra adulto');
  else if (ehMenor(a) && Math.abs(a.idade - b.idade) > LIMITE_IDADE_MENOR) motivos.push(`Menores com mais de ${LIMITE_IDADE_MENOR} anos de diferença`);
  if (a.academia.trim().toLowerCase() === b.academia.trim().toLowerCase()) motivos.push('Mesma academia');
  return motivos;
}

// Nível de experiência único (≈ "lutas equivalentes") para comparar atletas.
export const experiencia = (a) => a.lutas + a.luvoes * 0.5 + a.tempoTreino / 12;

export function pontuar(a, b) {
  const dPeso = Math.abs(a.peso - b.peso); // 0–2
  const dIdade = Math.abs(a.idade - b.idade);
  const dLutas = Math.abs(a.lutas - b.lutas);
  const dLuvoes = Math.abs(a.luvoes - b.luvoes);
  const dTreino = Math.abs(a.tempoTreino - b.tempoTreino);

  const pPeso = 30 * (1 - Math.min(dPeso / LIMITE_PESO, 1));
  const pIdade = 15 * (1 - Math.min(dIdade / (ehMenor(a) ? LIMITE_IDADE_MENOR : 10), 1));
  const pLutas = 25 * (1 - Math.min(dLutas / 5, 1));
  const pLuvoes = 15 * (1 - Math.min(dLuvoes / 8, 1));
  const pTreino = 15 * (1 - Math.min(dTreino / 24, 1));

  const detalhes = [
    { label: 'Peso', pontos: pPeso, max: 30, info: `${dPeso.toFixed(1)} kg de diferença` },
    { label: 'Idade', pontos: pIdade, max: 15, info: `${dIdade} ano(s) de diferença` },
    { label: 'Lutas', pontos: pLutas, max: 25, info: `${dLutas} de diferença` },
    { label: 'Luvões', pontos: pLuvoes, max: 15, info: `${dLuvoes} de diferença` },
    { label: 'Tempo de treino', pontos: pTreino, max: 15, info: `${dTreino} meses de diferença` },
  ];
  return { pontuacao: Math.round(detalhes.reduce((s, d) => s + d.pontos, 0)), detalhes };
}

// Gera todos os pares válidos, do melhor para o pior.
export function sugerirMatches(todos, minimo = 50) {
  const atletas = todos.filter(completo);
  const lista = [];
  for (let i = 0; i < atletas.length; i++) {
    for (let j = i + 1; j < atletas.length; j++) {
      const a = atletas[i];
      const b = atletas[j];
      if (bloqueios(a, b).length) continue;
      const { pontuacao, detalhes } = pontuar(a, b);
      if (pontuacao >= minimo) lista.push({ id: `${a.id}-${b.id}`, a: a.id, b: b.id, pontuacao, detalhes });
    }
  }
  return lista.sort((x, y) => y.pontuacao - x.pontuacao);
}
