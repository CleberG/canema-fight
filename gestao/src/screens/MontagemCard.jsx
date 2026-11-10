import { useRef, useState } from 'react';
import { Avatar, Button, Card, Icon, PageTitle, categoriaDaLuta, montarCardPublico, nomeExibido } from '../components/ui.jsx';

// Arrastar e soltar com Pointer Events: funciona com mouse e com toque.
// Arraste pela alça (⋮⋮) entre "Lutas aprovadas" e "Card do evento".
export default function MontagemCard({ store }) {
  const { lutas, card, setCard, atletas, evento } = store;
  const porId = Object.fromEntries(atletas.map((a) => [a.id, a]));
  const lutaPorId = Object.fromEntries(lutas.map((l) => [l.id, l]));
  const pool = lutas.filter((l) => !card.includes(l.id)).map((l) => l.id);

  const [drag, setDrag] = useState(null); // { id, x, y, w, offX, offY }
  const [alvo, setAlvo] = useState(null); // { lista: 'card'|'pool', antesDe: id|null }
  const alvoRef = useRef(null);

  const iniciar = (e, id) => {
    const item = e.currentTarget.closest('[data-item]').getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, x: e.clientX, y: e.clientY, w: item.width, offX: e.clientX - item.left, offY: e.clientY - item.top });
  };

  const mover = (e) => {
    if (!drag) return;
    setDrag((d) => ({ ...d, x: e.clientX, y: e.clientY }));
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const zona = el?.closest('[data-zona]');
    if (!zona) { alvoRef.current = null; setAlvo(null); return; }
    const itemEl = el.closest('[data-item]');
    let antesDe = null;
    if (itemEl && itemEl.dataset.item !== drag.id) {
      const r = itemEl.getBoundingClientRect();
      const ids = [...zona.querySelectorAll('[data-item]')].map((n) => n.dataset.item).filter((i) => i !== drag.id);
      const i = ids.indexOf(itemEl.dataset.item);
      antesDe = e.clientY < r.top + r.height / 2 ? ids[i] : ids[i + 1] ?? null;
    } else if (itemEl) {
      antesDe = alvoRef.current?.antesDe ?? null; // sobre o próprio item: mantém
    }
    const novo = { lista: zona.dataset.zona, antesDe };
    alvoRef.current = novo;
    setAlvo(novo);
  };

  const soltar = () => {
    const a = alvoRef.current;
    if (drag && a) {
      setCard((c) => {
        const sem = c.filter((x) => x !== drag.id);
        if (a.lista === 'pool') return sem;
        const i = a.antesDe ? sem.indexOf(a.antesDe) : -1;
        return i < 0 ? [...sem, drag.id] : [...sem.slice(0, i), drag.id, ...sem.slice(i)];
      });
    }
    setDrag(null); setAlvo(null); alvoRef.current = null;
  };

  const subir = (id, delta) => setCard((c) => {
    const i = c.indexOf(id);
    const j = i + delta;
    if (j < 0 || j >= c.length) return c;
    const n = [...c];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });

  const luta = (id, numero, total, naLista) => {
    const l = lutaPorId[id];
    const A = porId[l.a];
    const B = porId[l.b];
    const principal = naLista === 'card' && numero === total;
    const arrastando = drag?.id === id;
    return (
      <div
        data-item={id}
        className={`flex items-center gap-2 rounded-2xl border bg-panel p-2.5 transition ${principal ? 'border-gold/60 shadow-lg shadow-gold/10' : 'border-line'} ${arrastando ? 'opacity-30' : ''}`}
      >
        <button
          onPointerDown={(e) => iniciar(e, id)}
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          className="cursor-grab touch-none self-stretch rounded-lg px-1 text-zinc-500 hover:bg-panel-2 hover:text-white active:cursor-grabbing"
          aria-label="Arrastar luta"
        >
          <Icon name="grip" className="size-5" />
        </button>
        {naLista === 'card' && (
          <div className="w-12 shrink-0 text-center">
            <p className={`font-display text-2xl leading-none ${principal ? 'text-gold' : 'text-zinc-300'}`}>{String(numero).padStart(2, '0')}</p>
            {principal && <p className="text-[9px] font-bold uppercase tracking-wider text-gold">Principal</p>}
          </div>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar atleta={A} corner="red" size="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold"><span className="text-red-300">{nomeExibido(A)}</span> <span className="text-zinc-500">×</span> <span className="text-blue-300">{nomeExibido(B)}</span></p>
            <p className="truncate text-xs text-muted">{A.sexo} · {categoriaDaLuta(l, A, B)} · {A.idade == null ? 'Idade a completar' : A.idade < 18 ? 'Juvenil' : 'Adulto'}{l.pontuacao > 0 ? ` · score ${l.pontuacao}` : ""}</p>
          </div>
          <Avatar atleta={B} corner="blue" size="size-9" />
        </div>
        {naLista === 'card' ? (
          <div className="flex flex-col">
            <button onClick={() => subir(id, -1)} className="rounded p-0.5 text-zinc-500 hover:text-white" aria-label="Subir"><Icon name="up" className="size-4" /></button>
            <button onClick={() => subir(id, 1)} className="rounded p-0.5 text-zinc-500 hover:text-white" aria-label="Descer"><Icon name="down" className="size-4" /></button>
          </div>
        ) : (
          <button onClick={() => setCard((c) => [...c, id])} className="rounded-lg p-1.5 text-gold hover:bg-gold/10" aria-label="Adicionar ao card"><Icon name="plus" className="size-5" /></button>
        )}
      </div>
    );
  };

  const indicador = <div className="h-1 rounded-full bg-gold shadow-[0_0_12px] shadow-gold" />;

  const zona = (nome, ids, vazio) => {
    const ativa = drag && alvo?.lista === nome;
    return (
      <div data-zona={nome} className={`min-h-32 space-y-2 rounded-2xl border-2 border-dashed p-2 transition ${ativa ? 'border-gold/70 bg-gold/5' : 'border-transparent'}`}>
        {ids.map((id, i) => (
          <div key={id} className="space-y-2">
            {ativa && alvo.antesDe === id && indicador}
            {luta(id, i + 1, ids.length, nome)}
          </div>
        ))}
        {ativa && alvo.antesDe === null && indicador}
        {ids.length === 0 && <p className="grid h-28 place-items-center text-center text-sm text-muted">{vazio}</p>}
      </div>
    );
  };

  const fantasma = drag && lutaPorId[drag.id];

  // Publicado = o que a página pública mostra é igual ao card atual
  const cardPublico = montarCardPublico(card, lutas, atletas);
  // Compara sem os links temporários de foto/vídeo (gerados a cada carga) e com as chaves
  // em ordem fixa (o banco guarda o JSON com as chaves reordenadas).
  const ordenado = (x) => (Array.isArray(x) ? x.map(ordenado)
    : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, ordenado(x[k])])) : x);
  const semLinks = (c) => JSON.stringify(ordenado(c.map((l) => {
    const tirar = ({ fotoUrl: _f, videoUrl: _v, ...x }) => x;
    return { ...l, vermelho: tirar(l.vermelho), azul: tirar(l.azul) };
  })));
  const publicado = card.length > 0 && semLinks(cardPublico) === semLinks(store.cardPublicado);
  const publicar = () => {
    const anterior = store.cardPublicado;
    store.setCardPublicado(cardPublico);
    store.remoto(() => store.db.publicarCard(store.eventoId, cardPublico))
      // gera os links das fotos e vídeos para a página pública aberta neste aparelho
      .then(() => (store.demo ? null : store.db.assinarCard(cardPublico).then(store.setCardPublicado)))
      .catch(() => store.setCardPublicado(anterior));
  };

  return (
    <>
      <PageTitle kicker={evento.nome} title="Montagem do card">
        <Button variant={publicado ? 'success' : 'gold'} onClick={publicar} disabled={card.length === 0 || publicado}>
          <Icon name={publicado ? 'check' : 'trophy'} className="size-4" /> {publicado ? 'Card publicado' : 'Publicar card'}
        </Button>
      </PageTitle>
      <p className="-mt-2 mb-5 text-sm text-muted">Arraste pela alça <Icon name="grip" className="inline size-4" /> para ordenar. A última luta é a principal da noite.</p>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="min-w-0 xl:col-span-2">
          <h2 className="mb-2 flex items-center justify-between font-display text-2xl tracking-wide">Lutas aprovadas <span className="text-base text-muted">{pool.length}</span></h2>
          <Card className="p-1">
            {zona('pool', pool, <>Nenhuma luta fora do card.<br /><button className="text-gold" onClick={() => store.ir('matches')}>Aprovar matches →</button></>)}
          </Card>
        </section>
        <section className="min-w-0 xl:col-span-3">
          <h2 className="mb-2 flex items-center justify-between font-display text-2xl tracking-wide">Card do evento <span className="text-base text-muted">{card.length} lutas</span></h2>
          <Card className="bg-gradient-to-b from-fight/10 to-panel p-1">
            {zona('card', card, 'Arraste lutas aprovadas para cá')}
          </Card>
        </section>
      </div>

      {fantasma && (
        <div
          className="pointer-events-none fixed z-50 rotate-2 rounded-2xl border border-gold bg-panel-2/95 p-3 text-sm font-semibold shadow-2xl"
          style={{ left: drag.x - drag.offX, top: drag.y - drag.offY, width: drag.w }}
        >
          <span className="text-red-300">{nomeExibido(porId[fantasma.a])}</span> × <span className="text-blue-300">{nomeExibido(porId[fantasma.b])}</span>
        </div>
      )}
    </>
  );
}
