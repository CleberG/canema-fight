import { useEffect, useRef, useState } from 'react';
import { Icon, iniciais, montarCardPublico } from '../components/ui.jsx';
import { fila, normalizar, ordemDaNoite, tempoDecorrido } from '../lib/aovivo.js';

// Tela para TV (16:9, vista de longe). Tamanhos em vh para ocupar a tela inteira em qualquer resolução.
// Mostra a luta ao vivo (ou a próxima), o vencedor logo após o encerramento e as lutas seguintes.

const VENCEDOR_SEGUNDOS = 20;
const categoria = (l) => (typeof l.peso === 'number' ? `${l.peso} kg` : l.peso);

function useAgora(intervalo = 1000) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(t);
  }, [intervalo]);
  return agora;
}

// Foto (ou vídeo, ao vivo) grande de um lado do confronto
function Midia({ atleta, canto, aoVivo, className = '' }) {
  const fundo = canto === 'red' ? 'from-fight to-fight-dark' : 'from-corner-blue to-blue-800';
  if (aoVivo && atleta.videoUrl) {
    return (
      <video
        key={atleta.videoUrl} src={atleta.videoUrl} poster={atleta.fotoUrl ?? undefined}
        autoPlay muted loop playsInline preload="auto" className={`size-full object-cover ${className}`}
      />
    );
  }
  if (atleta.fotoUrl) return <img src={atleta.fotoUrl} alt="" className={`size-full object-cover ${aoVivo ? 'animate-respira' : ''} ${className}`} />;
  return <div className={`grid size-full place-items-center bg-gradient-to-br ${fundo} font-display text-[16vh] text-white ${className}`}>{iniciais(atleta.nome)}</div>;
}

function Lado({ atleta, canto, aoVivo }) {
  const azul = canto === 'blue';
  return (
    <div className={`flex min-w-0 flex-col ${azul ? 'items-end text-right' : 'items-start'}`}>
      <div
        className={`relative aspect-square h-[54vh] overflow-hidden rounded-[3vh] ring-[0.6vh] ${azul ? 'ring-corner-blue' : 'ring-fight'} ${aoVivo ? 'brilho-ao-vivo' : ''} shadow-2xl ${azul ? 'shadow-corner-blue/30' : 'shadow-fight/30'}`}
      >
        <Midia atleta={atleta} canto={canto} aoVivo={aoVivo} />
        <span className={`absolute top-[1.6vh] ${azul ? 'right-[1.6vh]' : 'left-[1.6vh]'} rounded-full px-[1.4vh] py-[0.4vh] text-[1.8vh] font-bold uppercase tracking-widest text-white ${azul ? 'bg-corner-blue' : 'bg-fight'}`}>
          {azul ? 'Canto azul' : 'Canto vermelho'}
        </span>
      </div>
      <p className={`mt-[2vh] max-w-[70vh] truncate font-display ${atleta.nome.length > 14 ? 'text-[7vh]' : 'text-[10vh]'} leading-[.9] tracking-wide ${azul ? 'text-blue-300' : 'text-red-300'}`}>{atleta.nome}</p>
      {atleta.academia && <p className="max-w-[70vh] truncate text-[2.4vh] text-zinc-400">{atleta.academia}</p>}
    </div>
  );
}

function Confronto({ luta, aoVivo, rotulo, tempo }) {
  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-[3vh]">
      <Lado atleta={luta.vermelho} canto="red" aoVivo={aoVivo} />
      <div className="flex w-[34vh] flex-col items-center text-center">
        {aoVivo ? (
          <span className="inline-flex items-center gap-[1vh] whitespace-nowrap rounded-full bg-fight px-[2.4vh] py-[0.8vh] text-[3vh] font-bold uppercase tracking-[.2em] text-white shadow-lg shadow-fight/40">
            <span className="size-[1.6vh] animate-pulse rounded-full bg-white" /> Ao vivo
          </span>
        ) : (
          <span className="whitespace-nowrap rounded-full bg-gold px-[2.4vh] py-[0.8vh] text-[3vh] font-bold uppercase tracking-[.2em] text-ink">Próxima luta</span>
        )}
        <p className="mt-[2vh] font-display text-[22vh] leading-[.8] text-fight drop-shadow-[0_0_4vh_rgba(229,38,47,.45)]">VS</p>
        <p className="mt-[1.5vh] text-[2.6vh] font-bold uppercase tracking-[.25em] text-gold">{rotulo}</p>
        {categoria(luta) && <p className="mt-[0.6vh] text-[3.4vh] font-semibold text-zinc-200">{categoria(luta)}</p>}
        {aoVivo && <p className="mt-[2vh] font-mono text-[5vh] tabular-nums text-zinc-100">{tempo}</p>}
      </div>
      <Lado atleta={luta.azul} canto="blue" aoVivo={aoVivo} />
    </div>
  );
}

// Tela de vencedor logo depois que o organizador encerra a luta
function Vencedor({ luta, vencedor, rotulo }) {
  if (vencedor !== 'vermelho' && vencedor !== 'azul') {
    return (
      <div className="flex flex-col items-center text-center">
        <p className="text-[3vh] font-bold uppercase tracking-[.3em] text-gold">{rotulo} · encerrada</p>
        <p className="mt-[2vh] font-display text-[18vh] leading-none tracking-wide">{vencedor === 'empate' ? 'Empate' : 'Luta encerrada'}</p>
        <p className="mt-[2vh] font-display text-[7vh] tracking-wide">
          <span className="text-red-300">{luta.vermelho.nome}</span> <span className="text-zinc-500">×</span> <span className="text-blue-300">{luta.azul.nome}</span>
        </p>
      </div>
    );
  }
  const a = luta[vencedor];
  const canto = vencedor === 'vermelho' ? 'red' : 'blue';
  return (
    <div className="flex items-center gap-[6vh]">
      <div className="relative aspect-square h-[62vh] overflow-hidden rounded-[3vh] ring-[0.9vh] ring-gold shadow-[0_0_10vh] shadow-gold/40">
        <Midia atleta={a} canto={canto} aoVivo />
      </div>
      <div className="max-w-[80vh]">
        <p className="inline-flex items-center gap-[1.4vh] text-[4vh] font-bold uppercase tracking-[.3em] text-gold">
          <Icon name="trophy" className="size-[5vh]" /> Vencedor
        </p>
        <p className={`mt-[1vh] font-display ${a.nome.length > 14 ? 'text-[13vh]' : 'text-[20vh]'} leading-[.85] tracking-wide ${canto === 'red' ? 'text-red-300' : 'text-blue-300'}`}>{a.nome}</p>
        {a.academia && <p className="mt-[1vh] text-[3.4vh] text-zinc-300">{a.academia}</p>}
        <p className="mt-[3vh] text-[2.8vh] uppercase tracking-[.2em] text-zinc-400">{rotulo}{categoria(luta) ? ` · ${categoria(luta)}` : ''}</p>
      </div>
    </div>
  );
}

function Miniatura({ atleta, canto }) {
  const fundo = canto === 'red' ? 'from-fight to-fight-dark ring-fight/70' : 'from-corner-blue to-blue-800 ring-corner-blue/70';
  return (
    <span className={`grid size-[8vh] shrink-0 place-items-center overflow-hidden rounded-[1.4vh] bg-gradient-to-br font-display text-[3.4vh] text-white ring-[0.3vh] ${fundo}`}>
      {atleta.fotoUrl ? <img src={atleta.fotoUrl} alt="" className="size-full object-cover" /> : iniciais(atleta.nome)}
    </span>
  );
}

export default function TelaTV({ store, carga }) {
  const card = store.demo ? montarCardPublico(store.card, store.lutas, store.atletas) : store.cardPublicado;
  const v = normalizar(store.aoVivo);
  const ordem = ordemDaNoite(card);
  const agora = useAgora();

  // Vencedor: aparece por alguns segundos quando uma luta é encerrada com a tela aberta
  const chaveFim = v.ultima && !v.atual ? `${v.ultima}|${v.resultados[v.ultima]?.vencedor ?? ''}` : null;
  const anterior = useRef(chaveFim);
  const [vencedorAte, setVencedorAte] = useState(0);
  useEffect(() => {
    if (chaveFim && chaveFim !== anterior.current) setVencedorAte(Date.now() + VENCEDOR_SEGUNDOS * 1000);
    if (!chaveFim) setVencedorAte(0);
    anterior.current = chaveFim;
  }, [chaveFim]);

  // Atualiza o card e os links das fotos de tempos em tempos (a TV fica ligada a noite toda)
  const { demo, db, eventoId, setCardPublicado } = store;
  useEffect(() => {
    if (demo) return undefined;
    const t = setInterval(() => db.carregarPublico(eventoId).then((d) => setCardPublicado(d.cardPublico)).catch(() => {}), 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [demo, db, eventoId, setCardPublicado]);

  // Tela cheia, cursor escondido e tela sem apagar
  const [cheia, setCheia] = useState(!!document.fullscreenElement);
  const [mexeu, setMexeu] = useState(true);
  useEffect(() => {
    const onFull = () => setCheia(!!document.fullscreenElement);
    let t;
    const onMove = () => { setMexeu(true); clearTimeout(t); t = setTimeout(() => setMexeu(false), 3000); };
    const onKey = (e) => { if (e.key === 'f' || e.key === 'F') alternar(); };
    document.addEventListener('fullscreenchange', onFull);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onKey);
    onMove();
    return () => {
      document.removeEventListener('fullscreenchange', onFull);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, []);
  useEffect(() => {
    let trava = null;
    const pedir = () => navigator.wakeLock?.request('screen').then((w) => { trava = w; }).catch(() => {});
    const onVis = () => { if (document.visibilityState === 'visible') pedir(); };
    pedir();
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); trava?.release().catch(() => {}); };
  }, []);

  if (!store.demo && !['ok', 'publico'].includes(carga?.estado)) {
    return (
      <div className="grid h-screen place-items-center bg-ink text-[3vh] text-zinc-400">
        {carga?.estado === 'erro' ? `Não foi possível carregar o evento: ${carga.erro}` : 'Carregando…'}
      </div>
    );
  }

  const numero = (l) => ordem.indexOf(l) + 1;
  const rotulo = (l) => (numero(l) === ordem.length ? 'Luta principal' : `Luta ${String(numero(l)).padStart(2, '0')}`);
  const atual = ordem.find((l) => l.id === v.atual) ?? null;
  const pendentes = fila(card, v); // já considera lutas adiadas/adiantadas
  const encerradas = ordem.filter((l) => v.resultados[l.id]).length;
  const ultima = ordem.find((l) => l.id === v.ultima) ?? null;
  const mostrarVencedor = !atual && ultima && agora < vencedorAte;
  const destaque = atual ?? pendentes[0] ?? null;
  const aSeguir = (atual ? pendentes : pendentes.slice(1)).slice(0, 3);
  const hora = new Date(agora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`relative flex h-screen w-screen flex-col overflow-hidden bg-ink ${mexeu ? '' : 'cursor-none'}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_0%_50%,rgba(229,38,47,.28),transparent),radial-gradient(60%_70%_at_100%_50%,rgba(31,111,229,.28),transparent)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[.05] [background:repeating-linear-gradient(-45deg,#fff_0_2px,transparent_2px_16px)]" />

      {/* Topo */}
      <header className="relative flex h-[10vh] shrink-0 items-center justify-between border-b border-white/10 px-[4vh]">
        <p className="font-display text-[6vh] leading-none tracking-wide">
          {store.evento.nome.split(' ').slice(0, -1).join(' ')} <span className="text-gold">{store.evento.nome.split(' ').at(-1)}</span>
        </p>
        <p className="text-[2.6vh] font-semibold uppercase tracking-[.25em] text-zinc-400">
          {card.length > 0 ? `${encerradas} de ${ordem.length} lutas encerradas` : ''}
        </p>
        <p className="font-mono text-[4.4vh] tabular-nums text-zinc-200">{hora}</p>
      </header>

      {/* Palco */}
      <main className="relative flex min-h-0 flex-1 items-center justify-center px-[6vh]">
        {card.length === 0 ? (
          <p className="font-display text-[10vh] tracking-wide text-zinc-400">Card em breve</p>
        ) : mostrarVencedor ? (
          <Vencedor luta={ultima} vencedor={v.resultados[ultima.id]?.vencedor ?? null} rotulo={rotulo(ultima)} />
        ) : destaque ? (
          <Confronto luta={destaque} aoVivo={!!atual} rotulo={rotulo(destaque)} tempo={tempoDecorrido(v.inicio, agora)} />
        ) : (
          <div className="text-center">
            <Icon name="trophy" className="mx-auto size-[14vh] text-gold" />
            <p className="mt-[2vh] font-display text-[14vh] leading-none tracking-wide">Fim do evento</p>
            <p className="mt-[2vh] text-[3.4vh] text-zinc-300">Obrigado a todos os atletas e ao público!</p>
          </div>
        )}
      </main>

      {/* A seguir */}
      {aSeguir.length > 0 && (
        <footer className="relative flex h-[16vh] shrink-0 items-center gap-[3vh] border-t border-white/10 bg-black/30 px-[4vh]">
          <p className="w-[14vh] shrink-0 font-display text-[4.6vh] leading-[.9] tracking-wide text-gold">A seguir</p>
          {aSeguir.map((l) => (
            <div key={l.id} className="flex min-w-0 flex-1 items-center gap-[1.6vh] rounded-[2vh] border border-white/10 bg-panel/70 p-[1.2vh]">
              <Miniatura atleta={l.vermelho} canto="red" />
              <div className="min-w-0 flex-1 text-center">
                <p className="text-[1.8vh] font-bold uppercase tracking-[.2em] text-zinc-500">{rotulo(l)}{categoria(l) ? ` · ${categoria(l)}` : ''}</p>
                <p className="truncate font-display text-[3.4vh] leading-tight tracking-wide">
                  <span className="text-red-300">{l.vermelho.nome}</span> <span className="text-zinc-500">×</span> <span className="text-blue-300">{l.azul.nome}</span>
                </p>
              </div>
              <Miniatura atleta={l.azul} canto="blue" />
            </div>
          ))}
        </footer>
      )}

      {!cheia && mexeu && (
        <button
          onClick={alternar}
          className="absolute right-[3vh] top-[12vh] z-10 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
        >
          Tela cheia (F)
        </button>
      )}
    </div>
  );
}

function alternar() {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
}
