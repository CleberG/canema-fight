// Parser tolerante de fichas de atleta coladas do WhatsApp.
// Lê linha por linha, separa no primeiro ":", normaliza a chave e mapeia sinônimos.

export const FICHA_EXEMPLO = `*FICHA DE INSCRIÇÃO – CANEMA FIGHT* 🥊

*Nome:* Ana Beatriz Moreira
*Idade:* 16 anos
*Sexo:* Feminino
*Peso:* 52,4 kg
*Altura:* 162 cm
*Academia:* CT Sangue Thai
*Professor:* Kru Rafael
*Nº de Lutas:* 3
*Luvões:* 5
*Tempo de treino:* 1 ano e 6 meses
*Insta:* @anabia.thai
*WhatsApp:* (47) 99999-1234`;

// Campos do formulário, na ordem em que aparecem.
export const CAMPOS = [
  { key: 'nome', label: 'Nome completo' },
  { key: 'idade', label: 'Idade', type: 'number', suffix: 'anos' },
  { key: 'sexo', label: 'Sexo', options: ['Feminino', 'Masculino'] },
  { key: 'peso', label: 'Peso', type: 'number', suffix: 'kg' },
  { key: 'altura', label: 'Altura', type: 'number', suffix: 'm' },
  { key: 'academia', label: 'Academia' },
  { key: 'professor', label: 'Professor' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'lutas', label: 'Lutas', type: 'number' },
  { key: 'luvoes', label: 'Luvões', type: 'number' },
  { key: 'tempoTreino', label: 'Tempo de treino', type: 'number', suffix: 'meses' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'responsavel', label: 'Responsável (menores)' },
];

// Sinônimos já normalizados (sem acento, minúsculos).
const SINONIMOS = {
  nome: ['nome', 'nome completo', 'atleta', 'nome do atleta', 'lutador', 'lutadora'],
  idade: ['idade', 'anos'],
  nascimento: ['nascimento', 'data de nascimento', 'data nascimento', 'dn', 'nasc'],
  sexo: ['sexo', 'genero', 'categoria sexo'],
  peso: ['peso', 'peso atual', 'peso kg', 'categoria de peso'],
  altura: ['altura', 'estatura'],
  academia: ['academia', 'equipe', 'ct', 'team', 'escola', 'associacao'],
  professor: ['professor', 'prof', 'treinador', 'tecnico', 'mestre', 'kru'],
  cidade: ['cidade', 'cidade uf', 'municipio'],
  lutas: ['lutas', 'n de lutas', 'numero de lutas', 'qtd de lutas', 'qtd lutas', 'quantidade de lutas', 'cartel', 'lutas oficiais', 'lutas amadoras'],
  luvoes: ['luvoes', 'luvao', 'n de luvoes', 'numero de luvoes', 'qtd de luvoes', 'qtd luvoes', 'quantidade de luvoes'],
  tempoTreino: ['tempo de treino', 'tempo treino', 'tempo de pratica', 'tempo de muay thai', 'treina ha', 'tempo treinando', 'experiencia'],
  instagram: ['instagram', 'insta', 'ig', 'perfil', 'arroba'],
  telefone: ['telefone', 'tel', 'fone', 'celular', 'whatsapp', 'whats', 'zap', 'contato'],
  responsavel: ['responsavel', 'nome do responsavel', 'pai', 'mae', 'pai ou mae'],
};

const MAPA = Object.fromEntries(
  Object.entries(SINONIMOS).flatMap(([campo, lista]) => lista.map((s) => [s, campo])),
);

export function normalizarChave(chave) {
  return chave
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // acentos
    .replace(/[*_~`]/g, '') // marcação do WhatsApp
    .replace(/[º°ª⁰]/g, '') // nº, n⁰, n°
    .toLowerCase()
    .replace(/[^a-z0-9 /]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function campoDaChave(chave) {
  const k = normalizarChave(chave);
  if (MAPA[k]) return MAPA[k];
  // "n lutas", "no de lutas" → tenta sem prefixo de quantidade
  const semPrefixo = k.replace(/^(n|no|nr|num|numero|qtd|quantidade)( de)? /, '');
  if (MAPA[semPrefixo]) return MAPA[semPrefixo];
  // última tentativa: chave contém um sinônimo de várias palavras
  const achado = Object.keys(MAPA).find((s) => s.includes(' ') && k.includes(s));
  return achado ? MAPA[achado] : null;
}

function limparValor(v) {
  // asteriscos saem de qualquer lugar; _ e ~ só nas pontas (preserva @joao_thai)
  return v.replace(/\*/g, '').trim().replace(/^[_~]+|[_~]+$/g, '').trim();
}

// Primeiro número do texto, aceitando vírgula ou ponto decimal.
export function extrairNumero(texto) {
  const m = String(texto).match(/-?\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(',', '.')) : null;
}

// "1 ano e 6 meses" → 18, "2 anos" → 24, "8 meses" → 8, "1,5 ano" → 18, "3" → 36 (anos)
export function tempoEmMeses(texto) {
  const t = normalizarChave(texto);
  const bruto = String(texto).replace(',', '.').toLowerCase();
  const anos = bruto.match(/(\d+(?:\.\d+)?)\s*(anos?|a\b)/);
  const meses = bruto.match(/(\d+(?:\.\d+)?)\s*(m[eê]s(es)?|m\b)/);
  if (!anos && !meses) {
    const n = extrairNumero(texto);
    if (n == null) return null;
    return /mes/.test(t) ? Math.round(n) : Math.round(n * 12);
  }
  return Math.round((anos ? Number(anos[1]) * 12 : 0) + (meses ? Number(meses[1]) : 0));
}

// 1,62 → 1.62; 162 cm → 1.62; 1.62m → 1.62
export function alturaEmMetros(texto) {
  const n = extrairNumero(texto);
  if (n == null) return null;
  const m = n > 3 ? n / 100 : n;
  return Math.round(m * 100) / 100;
}

function sexo(v) {
  const k = normalizarChave(v);
  if (/^(f|fem|feminino|mulher)/.test(k)) return 'Feminino';
  if (/^(m|masc|masculino|homem)/.test(k)) return 'Masculino';
  return null;
}

function idadeDeNascimento(v, hoje = new Date()) {
  const m = v.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (!m) return null;
  let ano = Number(m[3]);
  if (ano < 100) ano += ano > 30 ? 1900 : 2000;
  const nasc = new Date(ano, Number(m[2]) - 1, Number(m[1]));
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const fez = hoje.getMonth() > nasc.getMonth()
    || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() >= nasc.getDate());
  return fez ? idade : idade - 1;
}

const CONVERSORES = {
  idade: extrairNumero,
  peso: extrairNumero,
  lutas: (v) => (/^(nenhuma|zero|nao|estreante)/.test(normalizarChave(v)) ? 0 : extrairNumero(v)),
  luvoes: (v) => (/^(nenhum|zero|nao)/.test(normalizarChave(v)) ? 0 : extrairNumero(v)),
  altura: alturaEmMetros,
  tempoTreino: tempoEmMeses,
  sexo,
  instagram: (v) => {
    const u = v.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '').replace(/[/?].*$/, '').trim();
    return u ? (u.startsWith('@') ? u : `@${u}`) : null;
  },
};

// Retorna { dados, reconhecidos: Set, ignoradas: [linhas sem campo] }
export function lerFicha(texto) {
  const dados = {};
  const reconhecidos = new Set();
  const ignoradas = [];

  for (const linhaBruta of texto.split(/\r?\n/)) {
    const linha = linhaBruta.replace(/^[\s\-•·>]+/, '').trim();
    if (!linha) continue;
    const i = linha.indexOf(':');
    if (i < 0) { ignoradas.push(linha); continue; }

    const campo = campoDaChave(linha.slice(0, i));
    const valor = limparValor(linha.slice(i + 1));
    if (!campo || !valor) { ignoradas.push(linha); continue; }

    if (campo === 'nascimento') {
      const idade = idadeDeNascimento(valor);
      if (idade != null && dados.idade == null) { dados.idade = idade; reconhecidos.add('idade'); }
      continue;
    }

    const conv = CONVERSORES[campo];
    const final = conv ? conv(valor) : valor;
    if (final == null || final === '') { ignoradas.push(linha); continue; }
    dados[campo] = final;
    reconhecidos.add(campo);
  }

  return { dados, reconhecidos, ignoradas };
}
