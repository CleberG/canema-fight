import { useEffect, useState } from 'react';
import { Badge, Icon, inputCls } from '../components/ui.jsx';

// Nesta versão não há leitura de QR: a portaria confere pelo nome na lista.
const ABAS = [
  { id: 'pagos', label: 'Pagos', icon: 'check' },
  { id: 'pendentes', label: 'Não pagaram', icon: 'alert' },
];

const semAcento = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Portaria({ store }) {
  const { bilhetes, setBilhetes, checkins, setCheckins, demo, db } = store;
  const [aba, setAba] = useState('pagos');
  const [busca, setBusca] = useState('');
  const [atualizando, setAtualizando] = useState(false);
  const [confirmar, setConfirmar] = useState(null); // bilhete pendente aguardando confirmação

  // Com Supabase, recarrega a lista (outros aparelhos podem ter registrado entradas ou pagamentos).
  const atualizar = async () => {
    if (demo) return;
    setAtualizando(true);
    try {
      setBilhetes(await db.listarBilhetes(store.eventoId));
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

  const ativos = bilhetes.filter((b) => b.status !== 'cancelado' && b.pagamento !== 'cancelado');
  const pagos = ativos.filter((b) => b.pagamento === 'pago');
  const pendentes = ativos.filter((b) => b.pagamento === 'pendente');
  const base = aba === 'pagos' ? pagos : pendentes;
  const termo = semAcento(busca.trim());
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
          <div className="grid grid-cols-2 gap-2">
            {ABAS.map((a) => {
              const total = a.id === 'pagos' ? pagos.length : pendentes.length;
              const ativo = aba === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAba(a.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ring-1 transition ${ativo
                    ? (a.id === 'pagos' ? 'bg-emerald-600/20 text-emerald-300 ring-emerald-500/50' : 'bg-amber-400/15 text-amber-300 ring-amber-400/50')
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
              : 'Pediram ingresso e o Pix ainda não foi confirmado. Confira o comprovante antes de liberar.'}
          </p>
        </div>
      </header>

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
