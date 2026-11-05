// Acesso ao Supabase. Converte entre as colunas do banco (snake_case) e o formato das telas.
import { supabase, EVENTO_ID } from './supabase.js';
import { textoData } from './data.js';

export const modoDemo = !supabase;
export { supabase, EVENTO_ID };

function ok({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

const pad = (n) => String(n).padStart(2, '0');
// timestamptz → 'AAAA-MM-DDTHH:mm:ss' no fuso do navegador (formato usado nas telas)
function paraLocal(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : undefined);

const eventoDoBanco = (e) => {
  const data = paraLocal(e.data);
  return {
    id: e.id, nome: e.nome, subtitulo: e.subtitulo, data, dataTexto: textoData(data), local: e.local, cidade: e.cidade,
    inscricao: Number(e.inscricao), tipoChave: e.tipo_chave, chavePix: e.chave_pix, recebedor: e.recebedor,
  };
};

const atletaDoBanco = (a) => ({
  id: a.id, nome: a.nome, sexo: a.sexo, idade: a.idade, peso: a.peso == null ? null : Number(a.peso), altura: a.altura == null ? null : Number(a.altura),
  academia: a.academia, professor: a.professor, cidade: a.cidade, lutas: a.lutas, luvoes: a.luvoes,
  tempoTreino: a.tempo_treino, instagram: a.instagram, telefone: a.telefone, responsavel: a.responsavel,
  pagamento: a.pagamento, pagoEm: a.pago_em, status: 'aguardando', fotoPath: a.foto_path, fotoUrl: null,
});

// Campos editáveis do atleta (formato das telas → colunas)
const atletaParaBanco = (a) => ({
  nome: a.nome, sexo: a.sexo, idade: a.idade, peso: a.peso, altura: a.altura || null,
  academia: a.academia, professor: a.professor || '', cidade: a.cidade || '', lutas: a.lutas, luvoes: a.luvoes,
  tempo_treino: a.tempoTreino, instagram: a.instagram || '', telefone: a.telefone || '', responsavel: a.responsavel || '',
});

const ingressosDoBanco = (tipos) => tipos
  .sort((x, y) => x.ordem - y.ordem)
  .map((t) => ({
    id: t.slug, dbId: t.id, nome: t.nome, descricao: t.descricao,
    lotes: t.lotes.sort((x, y) => x.ordem - y.ordem).map((l) => ({ id: l.id, nome: l.nome, preco: Number(l.preco), qtd: l.qtd, vendidos: l.vendidos })),
  }));

const bilheteDoBanco = (b) => ({
  codigo: b.codigo, nome: b.nome, idade: b.idade, status: b.status, horario: hora(b.usado_em),
  tipo: b.tipos_ingresso?.nome ?? '', lote: b.lotes?.nome ?? '', pedidoId: b.pedido_id, pagamento: b.pedidos?.pagamento ?? 'pago',
});

const BILHETE_COLS = 'codigo, nome, idade, status, usado_em, pedido_id, tipos_ingresso(nome), lotes(nome), pedidos(pagamento)';

const pedidoDoBanco = (p) => ({
  id: p.id, compradorNome: p.comprador_nome, compradorEmail: p.comprador_email, total: Number(p.total),
  pagamento: p.pagamento, pagoEm: p.pago_em, criadoEm: p.created_at,
  bilhetes: (p.bilhetes ?? []).map((b) => ({ codigo: b.codigo, nome: b.nome, idade: b.idade, tipo: b.tipos_ingresso?.nome ?? '', lote: b.lotes?.nome ?? '' })),
});

// URLs temporárias das fotos (bucket privado)
async function assinarFotos(atletas) {
  const comFoto = atletas.filter((a) => a.fotoPath);
  if (!comFoto.length) return atletas;
  const { data } = await supabase.storage.from('atletas').createSignedUrls(comFoto.map((a) => a.fotoPath), 60 * 60 * 12);
  const url = Object.fromEntries((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
  return atletas.map((a) => (a.fotoPath ? { ...a, fotoUrl: url[a.fotoPath] ?? null } : a));
}

// ── Público (sem login) ──

export async function carregarPublico(eventoId = EVENTO_ID) {
  const [evento, tipos] = await Promise.all([
    supabase.from('eventos').select('*').eq('id', eventoId).single().then(ok),
    supabase.from('tipos_ingresso').select('id, slug, nome, descricao, ordem, lotes(id, nome, preco, qtd, vendidos, ordem)').eq('evento_id', eventoId).then(ok),
  ]);
  return { evento: eventoDoBanco(evento), cardPublico: await assinarCard(evento.card_publicado ?? []), ingressos: ingressosDoBanco(tipos) };
}

// Fotos do card publicado: o bucket é privado, mas quem está no card pode ser visto pelo público.
async function assinarCard(card) {
  const caminhos = [...new Set(card.flatMap((l) => [l.vermelho?.foto, l.azul?.foto]).filter(Boolean))];
  if (!caminhos.length) return card;
  const { data } = await supabase.storage.from('atletas').createSignedUrls(caminhos, 60 * 60 * 6);
  const url = Object.fromEntries((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
  const canto = (c) => (c?.foto ? { ...c, fotoUrl: url[c.foto] ?? null } : c);
  return card.map((l) => ({ ...l, vermelho: canto(l.vermelho), azul: canto(l.azul) }));
}

export async function comprarIngressos(eventoId, pessoas, email) {
  const linhas = ok(await supabase.rpc('comprar_ingressos', {
    p_evento: eventoId,
    p_pessoas: pessoas.map((p) => ({ tipo: p.tipoId, nome: p.nome, idade: Number(p.idade) })),
    p_email: email || null,
  }));
  return linhas.map((l) => ({ ...l, status: 'valido', preco: Number(l.preco) }));
}

// ── Organizador ──

export const entrar = async (email, senha) => ok(await supabase.auth.signInWithPassword({ email, password: senha }));
export const sair = () => supabase.auth.signOut();

export async function carregarOrganizador() {
  const membros = ok(await supabase.from('evento_membros').select('evento_id').limit(1));
  if (!membros.length) throw new Error('Esta conta não está ligada a nenhum evento. Peça ao administrador para incluí-la em evento_membros.');
  const eventoId = membros[0].evento_id;

  const [publico, atletas, lutas, bilhetes, checkins, pedidos] = await Promise.all([
    carregarPublico(eventoId),
    supabase.from('atletas').select('*').eq('evento_id', eventoId).order('id').then(ok).then((l) => assinarFotos(l.map(atletaDoBanco))),
    supabase.from('lutas').select('*').eq('evento_id', eventoId).then(ok),
    supabase.from('bilhetes').select(BILHETE_COLS).eq('evento_id', eventoId).order('created_at', { ascending: false }).limit(2000).then(ok),
    supabase.from('bilhetes').select('id', { count: 'exact', head: true }).eq('evento_id', eventoId).eq('status', 'usado'),
    supabase.from('pedidos').select('*, bilhetes(codigo, nome, idade, tipos_ingresso(nome), lotes(nome))').eq('evento_id', eventoId)
      .order('created_at', { ascending: false }).limit(500).then(ok),
  ]);

  const aprovadas = lutas.filter((l) => l.status === 'aprovada').map((l) => ({
    id: `${l.atleta_a}-${l.atleta_b}`, a: l.atleta_a, b: l.atleta_b, pontuacao: l.pontuacao, posicao: l.posicao_card, categoria: l.categoria,
  }));
  return {
    ...publico,
    eventoId,
    atletas,
    pedidos: pedidos.map(pedidoDoBanco),
    lutas: aprovadas,
    recusados: lutas.filter((l) => l.status === 'recusada').map((l) => `${l.atleta_a}-${l.atleta_b}`),
    card: aprovadas.filter((l) => l.posicao != null).sort((x, y) => x.posicao - y.posicao).map((l) => l.id),
    bilhetes: bilhetes.map(bilheteDoBanco),
    checkins: checkins.count ?? 0,
  };
}

export async function salvarEvento(eventoId, e) {
  ok(await supabase.from('eventos').update({
    nome: e.nome, subtitulo: e.subtitulo, data: new Date(e.data).toISOString(), local: e.local, cidade: e.cidade,
    inscricao: e.inscricao, tipo_chave: e.tipoChave, chave_pix: e.chavePix, recebedor: e.recebedor,
  }).eq('id', eventoId));
}

export async function inserirAtleta(eventoId, a) {
  const linha = ok(await supabase.from('atletas').insert({ evento_id: eventoId, ...atletaParaBanco(a) }).select().single());
  return atletaDoBanco(linha);
}

export async function atualizarAtleta(id, a) {
  ok(await supabase.from('atletas').update(atletaParaBanco(a)).eq('id', id));
}

// Inscrição do atleta: 'pago' | 'pendente' | 'expirado'
export async function definirPagamentoAtleta(id, pagamento) {
  ok(await supabase.from('atletas').update({ pagamento, pago_em: pagamento === 'pago' ? new Date().toISOString() : null }).eq('id', id));
}

// Pedido de ingressos: 'pago' | 'pendente' | 'cancelado'
export async function definirPagamentoPedido(id, pagamento) {
  ok(await supabase.from('pedidos').update({ pagamento, pago_em: pagamento === 'pago' ? new Date().toISOString() : null }).eq('id', id));
}

// Envia a foto (já reduzida) para <evento>/<atleta>-<data>.jpg e apaga a anterior.
export async function salvarFoto(eventoId, atleta, blob) {
  const caminho = `${eventoId}/${atleta.id}-${Date.now()}.jpg`;
  ok(await supabase.storage.from('atletas').upload(caminho, blob, { contentType: 'image/jpeg' }));
  ok(await supabase.from('atletas').update({ foto_path: caminho }).eq('id', atleta.id));
  if (atleta.fotoPath) await supabase.storage.from('atletas').remove([atleta.fotoPath]);
  const { data } = await supabase.storage.from('atletas').createSignedUrl(caminho, 60 * 60 * 12);
  return { fotoPath: caminho, fotoUrl: data?.signedUrl ?? null };
}

export async function removerFoto(atleta) {
  ok(await supabase.from('atletas').update({ foto_path: null }).eq('id', atleta.id));
  if (atleta.fotoPath) await supabase.storage.from('atletas').remove([atleta.fotoPath]);
}

const par = (s) => ({ atleta_a: Math.min(s.a, s.b), atleta_b: Math.max(s.a, s.b) });

export async function decidirLuta(eventoId, s, status) {
  ok(await supabase.from('lutas').upsert(
    { evento_id: eventoId, ...par(s), pontuacao: s.pontuacao, status, posicao_card: null },
    { onConflict: 'evento_id,atleta_a,atleta_b' },
  ));
}

export async function desfazerLuta(eventoId, s) {
  const p = par(s);
  ok(await supabase.from('lutas').delete().eq('evento_id', eventoId).eq('atleta_a', p.atleta_a).eq('atleta_b', p.atleta_b));
}

// Grava a ordem do card: posição para quem está no card, null para o resto.
export async function salvarCard(eventoId, card, lutas) {
  await Promise.all(lutas.map((l) => {
    const pos = card.indexOf(l.id);
    const p = par(l);
    return supabase.from('lutas').update({ posicao_card: pos < 0 ? null : pos })
      .eq('evento_id', eventoId).eq('atleta_a', p.atleta_a).eq('atleta_b', p.atleta_b).then(ok);
  }));
}

export async function publicarCard(eventoId, cardPublico) {
  ok(await supabase.from('eventos').update({ card_publicado: cardPublico }).eq('id', eventoId));
}

// ── Portaria ──

export async function buscarBilhete(codigo) {
  const linha = ok(await supabase.from('bilhetes').select(BILHETE_COLS).eq('codigo', codigo).maybeSingle());
  return linha ? bilheteDoBanco(linha) : null;
}

export async function buscarBilhetes(eventoId, termo) {
  const t = termo.replace(/[%_,()]/g, ' ').trim();
  const linhas = ok(await supabase.from('bilhetes').select(BILHETE_COLS).eq('evento_id', eventoId)
    .or(`nome.ilike.%${t}%,codigo.ilike.%${t}%`).limit(20));
  return linhas.map(bilheteDoBanco);
}

// Check-in só vale se o ingresso ainda estiver válido (evita duas entradas simultâneas).
export async function checkin(codigo) {
  const linhas = ok(await supabase.from('bilhetes').update({ status: 'usado', usado_em: new Date().toISOString() })
    .eq('codigo', codigo).eq('status', 'valido').select('usado_em'));
  return linhas.length ? hora(linhas[0].usado_em) : null;
}

// Lista completa para a portaria (recarregada sob demanda, vários aparelhos ao mesmo tempo).
export async function listarBilhetes(eventoId) {
  const linhas = ok(await supabase.from('bilhetes').select(BILHETE_COLS).eq('evento_id', eventoId)
    .order('nome').limit(5000));
  return linhas.map(bilheteDoBanco);
}
