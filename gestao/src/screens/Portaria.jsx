import { useEffect, useState } from 'react';
import { Badge, Icon, horaExibida, inputCls, lutaDeCadaAtleta } from '../components/ui.jsx';

// Nesta versão não há leitura de QR: a portaria confere pelo nome na lista.
const ABAS = [
  { id: 'pagos', label: 'Pagos', icon: 'check' },
  { id: 'pendentes', label: 'Não pagaram', icon: 'alert' },
  { id: 'atletas', label: 'Atletas', icon: 'users' },
];

const horaDe = (iso) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');
const INSCRICAO = { pago: ['green', 'Inscrição paga'], pendente: ['yellow', 'Inscrição pendente'], expirado: ['red', 'Inscrição expirada'] };

const semAcento = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Portaria({ store }) {
  const { bilhetes, setBilhetes, checkins, setCheckins, demo, db, atletas, setAtletas } = store;
  const [aba, setAba] = useState('pagos');
  const [busca, setBusca] = useState('');
  const [atualizando, setAtualizando] = useState(false);
  const [confirmar, setConfirmar] = useState(null); // bilhete pendente aguardando confirmação

  // Com Supabase, recarrega a lista (outros aparelhos podem ter registrado entradas ou pagamentos).
  const atualizar = async () => {
    if (demo) return;
    setAtualizando(true);
    try {
      const [lista, chegadas] = await Promise.all([db.listarBilhetes(store.eventoId), db.listarChegadas(store.eventoId)]);
      setBilhetes(lista);
      const porId = Object.fromEntries(chegadas.map((c) => [c.id, c]));
      setAtletas((l) => l.map((a) => (porId[a.id] ? { ...a, chegouEm: porId[a.id].chegou_em, pagamento: porId[a.id].pagamento } : a)));
    } catch (e) {
      store.setAviso(`Falha ao atualizar a lista: ${e.message}`);
    } finally {
      setAtualizando(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { atualizar(); }, []);

  const registrar = async (b) => {
    let hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (!demo) {
      try {
        hora = await db.checkin(b.codigo);
      } catch (e) {
        store.setAviso(`Entrada não registrada: ${e.message}`);
        return;
      }
      if (!hora) {
        store.setAviso(`${b.nome} já teve a entrada registrada em outro aparelho.`);
        atualizar();
        return;
      }
    }
    setBilhetes((l) => l.map((x) => (x.codigo === b.codigo ? { ...x, status: 'usado', horario: hora } : x)));
    setCheckins((c) => c + 1);
    if (navigator.vibrate) navigator.vibrate(60);
  };

  // Atletas: chegada no dia (só quem está no card)
  const [desfazer, setDesfazer] = useState(null); // atleta com chegada a desfazer
  const marcarChegada = async (a, chegou) => {
    let quando = chegou ? new Date().toISOString() : null;
    if (!demo) {
      try {
        quando = await db.registrarChegada(a.id, chegou);
      } catch (e) {
        store.setAviso(`Chegada não registrada: ${e.message}`);
        return;
      }
    }
    setAtletas((l) => l.map((x) => (x.id === a.id ? { ...x, chegouEm: quando } : x)));
    if (chegou && navigator.vibrate) navigator.vibrate(60);
  };
  const lutaDe = lutaDeCadaAtleta(store.card, store.lutas, atletas);
  const doCard = atletas.filter((a) => lutaDe[a.id]);
  const chegaram = doCard.filter((a) => a.chegouEm).length;

  const ativos = bilhetes.filter((b) => b.status !== 'cancelado' && b.pagamento !== 'cancelado');
  const pagos = ativos.filter((b) => b.pagamento === 'pago');
  const pendentes = ativos.filter((b) => b.pagamento === 'pendente');
  const base = aba === 'pagos' ? pagos : pendentes;
  const termo = semAcento(busca.trim());
  const listaAtletas = doCard
    .filter((a) => !termo || semAcento(a.nome).includes(termo))
    .sort((x, y) => (!!x.chegouEm - !!y.chegouEm) || lutaDe[x.id].numero - lutaDe[y.id].numero);
  const lista = base
    .filter((b) => !termo || semAcento(`${b.nome} ${b.codigo}`).includes(termo))
    .sort((x, y) => (x.status === 'usado') - (y.status === 'usado') || x.nome.localeCompare(y.nome, 'pt-BR'));
  const entraram = pagos.filter((b) => b.status === 'usado').length;

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <a href="#/dashboard" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><Icon name="arrowLeft" className="size-4" /> Painel</a>
          <span className="font-display text-2xl tracking-wide">Portaria</span>
          <Badge color="green">{checkins} entradas</Badge>
        </div>
        <div className="mx-auto max-w-2xl space-y-3 px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {ABAS.map((a) => {
              const total = a.id === 'pagos' ? pagos.length : a.id === 'pendentes' ? pendentes.length : doCard.length;
              const ativo = aba === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAba(a.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-sm font-semibold ring-1 transition ${ativo
                    ? ({ pagos: 'bg-emerald-600/20 text-emerald-300 ring-emerald-500/50', pendentes: 'bg-amber-400/15 text-amber-300 ring-amber-400/50', atletas: 'bg-fight/20 text-red-200 ring-fight/50' })[a.id]
                    : 'bg-panel text-zinc-400 ring-line hover:text-white'}`}
                >
                  <Icon name={a.icon} className="size-4" /> {a.label} <span className="rounded-full bg-black/30 px-2 text-xs">{total}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pelo nome" className={`${inputCls} py-3 pl-9`} />
            </div>
            {!demo && (
              <button onClick={atualizar} disabled={atualizando} className="rounded-xl border border-line px-3 text-sm text-zinc-300 hover:bg-panel-2 disabled:opacity-50">
                {atualizando ? '…' : 'Atualizar'}
              </button>
            )}
          </div>
          <p className="text-xs text-muted">
            {aba === 'pagos'
              ? `${entraram} de ${pagos.length} já entraram`
              : aba === 'atletas'
                ? `${chegaram} de ${doCard.length} atletas do card chegaram · em ordem de luta`
                : 'Pediram ingresso e o Pix ainda não foi confirmado. Confira o comprovante antes de liberar.'}
          </p>
        </div>
      </header>

      {aba === 'atletas' && (
        <main className="mx-auto max-w-2xl space-y-2 p-4">
          {listaAtletas.map((a) => {
            const l = lutaDe[a.id];
            const [cor, rotulo] = INSCRICAO[a.pagamento] ?? INSCRICAO.pendente;
            return (
              <div key={a.id} className={`flex items-center gap-3 rounded-xl border border-line p-3 ${a.chegouEm ? 'bg-panel/50' : 'bg-panel'}`}>
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-semibold ${a.chegouEm ? 'text-zinc-500' : ''}`}>
                    <span className={`mr-1.5 inline-block size-2 rounded-full ${l.canto === 'vermelho' ? 'bg-fight' : 'bg-corner-blue'}`} />
                    {a.nome}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {l.numero === l.total ? 'Luta principal' : `Luta ${String(l.numero).padStart(2, '0')}`}
                    {l.horario ? ` · ${horaExibida(l.horario)}` : ''} · contra {l.adversario?.nome ?? '—'}
                  </p>
                  <div className="mt-1"><Badge color={cor}>{rotulo}</Badge></div>
                </div>
                {a.chegouEm ? (
                  <button onClick={() => setDesfazer(a)} title="Desfazer chegada"><Badge color="gray">Chegou {horaDe(a.chegouEm)}</Badge></button>
                ) : (
                  <button onClick={() => marcarChegada(a, true)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Chegou</button>
                )}
              </div>
            );
          })}
          {listaAtletas.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">{termo ? 'Nenhum atleta com esse nome.' : 'Nenhum atleta no card.'}</p>
          )}
        </main>
      )}

      {desfazer && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 sm:place-items-center" onClick={() => setDesfazer(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-t-3xl border border-line bg-panel p-5 sm:rounded-3xl">
            <p className="font-display text-2xl tracking-wide">Desfazer chegada?</p>
            <p className="mt-2 text-sm text-zinc-300">Chegada de <b>{desfazer.nome}</b> registrada às {horaDe(desfazer.chegouEm)}.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setDesfazer(null)} className="flex-1 rounded-xl border border-line py-3 text-sm font-semibold hover:bg-panel-2">Voltar</button>
              <button onClick={() => { marcarChegada(desfazer, false); setDesfazer(null); }} className="flex-1 rounded-xl bg-fight py-3 text-sm font-bold text-white hover:bg-fight-dark">Desfazer</button>
            </div>
          </div>
        </div>
      )}

      {aba !== 'atletas' && (
      <main className="mx-auto max-w-2xl space-y-2 p-4">
        {lista.map((b) => {
          const usado = b.status === 'usado';
          return (
            <div key={b.codigo} className={`flex items-center gap-3 rounded-xl border p-3 ${usado ? 'border-line bg-panel/50' : 'border-line bg-panel'}`}>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-semibold ${usado ? 'text-zinc-500' : ''}`}>{b.nome}</p>
                <p className="text-xs text-muted">{b.idade != null ? `${b.idade} anos · ` : ''}{b.tipo}</p>
              </div>
              {usado ? (
                <Badge color="gray">Entrou {b.horario}</Badge>
              ) : aba === 'pagos' ? (
                <button onClick={() => registrar(b)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Liberar entrada</button>
              ) : (
                <button onClick={() => setConfirmar(b)} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-ink hover:bg-amber-300">Liberar</button>
              )}
            </div>
          );
        })}
        {lista.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            {termo ? 'Ninguém encontrado com esse nome.' : aba === 'pagos' ? 'Nenhum ingresso pago ainda.' : 'Nenhum pedido aguardando pagamento.'}
          </p>
        )}
      </main>
      )}

      {confirmar && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 sm:place-items-center" onClick={() => setConfirmar(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-t-3xl border border-amber-400/40 bg-panel p-5 sm:rounded-3xl">
            <p className="flex items-center gap-2 font-display text-2xl tracking-wide text-amber-300"><Icon name="alert" /> Pix não confirmado</p>
            <p className="mt-2 text-lg font-semibold">{confirmar.nome}</p>
            <p className="mt-1 text-sm text-zinc-400">O pagamento deste pedido ainda não foi confirmado pela organização. Libere só depois de ver o comprovante do Pix.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmar(null)} className="flex-1 rounded-xl border border-line py-3 text-sm font-semibold hover:bg-panel-2">Voltar</button>
              <button onClick={() => { registrar(confirmar); setConfirmar(null); }} className="flex-1 rounded-xl bg-amber-400 py-3 text-sm font-bold text-ink hover:bg-amber-300">Comprovante ok · liberar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
