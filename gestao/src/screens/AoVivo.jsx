import { useEffect, useState } from 'react';
import { Badge, Button, Card, Icon, PageTitle, montarCardPublico } from '../components/ui.jsx';
import {
  VAZIO, VENCEDORES, corrigirVencedor, desfazer, encerrar, iniciar, normalizar, ordemDaNoite, proxima, situacao, tempoDecorrido,
} from '../lib/aovivo.js';

const nomeDoVencedor = (l, vencedor) => (vencedor === 'vermelho' ? l.vermelho.nome : vencedor === 'azul' ? l.azul.nome : vencedor === 'empate' ? 'Empate' : 'Sem resultado');

// Cronômetro da luta em andamento
function Tempo({ inicio }) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono tabular-nums">{tempoDecorrido(inicio, agora)}</span>;
}

function Confronto({ l, grande }) {
  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 ${grande ? 'text-2xl sm:text-3xl' : 'text-lg'}`}>
      <p className="truncate font-display leading-none tracking-wide text-red-300">{l.vermelho.nome}</p>
      <p className="font-display text-sm text-zinc-500">VS</p>
      <p className="truncate text-right font-display leading-none tracking-wide text-blue-300">{l.azul.nome}</p>
    </div>
  );
}

// Controle das lutas durante o evento: iniciar, encerrar com vencedor, desfazer.
export default function AoVivo({ store }) {
  const { aoVivo, setAoVivo, evento } = store;
  const card = store.demo ? montarCardPublico(store.card, store.lutas, store.atletas) : store.cardPublicado;
  const v = normalizar(aoVivo);
  const ordem = ordemDaNoite(card);
  const numero = Object.fromEntries(ordem.map((l, i) => [l.id, i + 1]));
  const atual = ordem.find((l) => l.id === v.atual) ?? null;
  const seguinte = proxima(card, v);
  const encerradas = ordem.filter((l) => v.resultados[l.id]).length;
  const ultima = !atual && v.ultima ? ordem.find((l) => l.id === v.ultima) : null;
  const [zerar, setZerar] = useState(false);

  if (!card.length) {
    return (
      <>
        <PageTitle kicker={evento.nome} title="Ao vivo" />
        <Card className="p-6 text-center text-sm text-zinc-300">
          Publique o card em <a href="#/card" className="text-gold underline">Montar card</a> para controlar as lutas durante o evento.
        </Card>
      </>
    );
  }

  const rotulo = (l) => (numero[l.id] === ordem.length ? 'Principal' : `Luta ${String(numero[l.id]).padStart(2, '0')}`);

  return (
    <>
      <PageTitle kicker={evento.nome} title="Ao vivo">
        <a href="#/publico" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">Ver página pública <Icon name="external" className="size-3.5" /></a>
      </PageTitle>
      <p className="-mt-3 mb-5 text-sm text-muted">{encerradas} de {ordem.length} lutas encerradas · o público vê as mudanças na hora</p>

      {atual ? (
        <Card className="mb-6 border-fight/60 bg-gradient-to-b from-fight/15 to-panel p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-300">
              <span className="size-2.5 animate-pulse rounded-full bg-fight" /> Ao vivo · {rotulo(atual)}
            </span>
            <span className="text-lg text-zinc-200"><Tempo inicio={v.inicio} /></span>
          </div>
          <Confronto l={atual} grande />
          <p className="mt-1 text-center text-xs text-muted">{atual.peso}</p>
          <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Encerrar luta · quem venceu?</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setAoVivo(encerrar(v, 'vermelho'))} className="rounded-2xl bg-fight px-3 py-4 text-left font-semibold text-white active:scale-[.98]">
              <span className="block text-[11px] uppercase tracking-wider opacity-80">Vermelho</span>
              <span className="block truncate font-display text-2xl leading-none tracking-wide">{atual.vermelho.nome}</span>
            </button>
            <button onClick={() => setAoVivo(encerrar(v, 'azul'))} className="rounded-2xl bg-corner-blue px-3 py-4 text-right font-semibold text-white active:scale-[.98]">
              <span className="block text-[11px] uppercase tracking-wider opacity-80">Azul</span>
              <span className="block truncate font-display text-2xl leading-none tracking-wide">{atual.azul.nome}</span>
            </button>
            <Button variant="ghost" className="py-3" onClick={() => setAoVivo(encerrar(v, 'empate'))}>Empate</Button>
            <Button variant="ghost" className="py-3" onClick={() => setAoVivo(encerrar(v, null))}><Icon name="stop" className="size-4" /> Sem resultado</Button>
          </div>
        </Card>
      ) : (
        <Card className="mb-6 p-4 sm:p-5">
          {seguinte ? (
            <>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">Próxima · {rotulo(seguinte)}</p>
              <Confronto l={seguinte} grande />
              <p className="mt-1 text-center text-xs text-muted">{seguinte.peso}</p>
              <Button className="mt-5 w-full py-4 text-base" onClick={() => setAoVivo(iniciar(v, seguinte.id))}>
                <Icon name="play" className="size-5" /> Iniciar luta
              </Button>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-zinc-300"><Icon name="trophy" className="mx-auto mb-2 size-8 text-gold" />Todas as lutas foram encerradas.</p>
          )}
          {ultima && (
            <button onClick={() => setAoVivo(desfazer(v))} className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white">
              <Icon name="undo" className="size-4" /> Desfazer encerramento de {ultima.vermelho.nome} × {ultima.azul.nome}
            </button>
          )}
        </Card>
      )}

      <h2 className="mb-2 font-display text-2xl tracking-wide">Ordem da noite</h2>
      <div className="space-y-2">
        {ordem.map((l) => {
          const s = situacao(v, l.id);
          const r = v.resultados[l.id];
          return (
            <Card key={l.id} className={`p-3 ${s === 'ao_vivo' ? 'border-fight/60' : ''} ${s === 'encerrada' ? 'opacity-80' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wider text-zinc-500">{rotulo(l)}</span>
                <div className="min-w-0 flex-1"><Confronto l={l} /></div>
                {s === 'aguardando' && (
                  <button
                    onClick={() => setAoVivo(iniciar(v, l.id))}
                    disabled={!!v.atual}
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-panel-2 text-zinc-200 hover:bg-fight hover:text-white disabled:opacity-30"
                    aria-label={`Iniciar ${l.vermelho.nome} contra ${l.azul.nome}`}
                  >
                    <Icon name="play" className="size-4" />
                  </button>
                )}
                {s === 'ao_vivo' && <Badge color="red">Ao vivo</Badge>}
              </div>
              {s === 'encerrada' && (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-2 text-xs">
                  <span className="text-muted">Vencedor:</span>
                  {VENCEDORES.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setAoVivo(corrigirVencedor(v, l.id, r.vencedor === o.id ? null : o.id))}
                      className={`rounded-full px-2.5 py-1 ring-1 ring-inset ${r.vencedor === o.id ? 'bg-gold/20 text-gold ring-gold/50' : 'text-zinc-400 ring-line hover:text-white'}`}
                    >
                      {o.id === 'empate' ? 'Empate' : nomeDoVencedor(l, o.id)}
                    </button>
                  ))}
                  {!r.vencedor && <span className="text-zinc-500">sem resultado</span>}
                  <button
                    onClick={() => setAoVivo(iniciar(v, l.id))}
                    disabled={!!v.atual}
                    className="ml-auto inline-flex items-center gap-1 text-zinc-500 hover:text-white disabled:opacity-30"
                  >
                    <Icon name="undo" className="size-3.5" /> Reiniciar luta
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        {zerar ? (
          <div className="inline-flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-zinc-300">Apagar todos os resultados e voltar ao início?</span>
            <Button variant="danger" onClick={() => { setAoVivo(VAZIO); setZerar(false); }}>Sim, zerar</Button>
            <Button variant="ghost" onClick={() => setZerar(false)}>Cancelar</Button>
          </div>
        ) : (
          <button onClick={() => setZerar(true)} className="text-xs text-zinc-500 hover:text-fight">Zerar lutas ao vivo</button>
        )}
      </div>
    </>
  );
}
