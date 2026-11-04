import { useEffect, useRef, useState } from 'react';
import { Badge, Icon, inputCls } from '../components/ui.jsx';

// verde: liberado · amarelo: atenção (meia-entrada ou já utilizado) · vermelho: barrado
function avaliar(bilhete, codigo) {
  if (!bilhete) return { cor: 'red', titulo: 'Ingresso inválido', texto: `Código ${codigo} não encontrado`, };
  if (bilhete.status === 'cancelado') return { cor: 'red', titulo: 'Ingresso cancelado', texto: 'Compra estornada · não liberar', bilhete };
  if (bilhete.status === 'usado') return { cor: 'yellow', titulo: 'Já utilizado', texto: `Check-in feito às ${bilhete.horario}. Confirme com o supervisor.`, bilhete };
  if (bilhete.tipo.includes('Meia')) return { cor: 'yellow', titulo: 'Conferir documento', texto: 'Meia-entrada: peça documento de estudante, idoso ou PcD', bilhete, liberar: true };
  return { cor: 'green', titulo: 'Entrada liberada', texto: [bilhete.tipo, bilhete.lote].filter(Boolean).join(' · '), bilhete, liberar: true, auto: true };
}

const FUNDO = { green: 'bg-emerald-600', yellow: 'bg-amber-400 text-ink', red: 'bg-fight' };
const ICONE = { green: 'check', yellow: 'alert', red: 'x' };

export default function Portaria({ store }) {
  const { bilhetes, setBilhetes, checkins, setCheckins } = store;
  const [resultado, setResultado] = useState(null);
  const [busca, setBusca] = useState('');
  const [camera, setCamera] = useState('desligada'); // desligada | ligando | ligada | indisponivel
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const ultimoRef = useRef('');

  const { demo, db } = store;
  const [online, setOnline] = useState([]); // resultados da busca no Supabase

  // Marca o check-in. Retorna false se outro aparelho já registrou a entrada.
  const registrar = async (codigo) => {
    let hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (!demo) {
      try {
        hora = await db.checkin(codigo);
      } catch (e) {
        store.setAviso(`Check-in não registrado: ${e.message}`);
        return false;
      }
      if (!hora) return false;
    }
    setBilhetes((l) => l.map((b) => (b.codigo === codigo ? { ...b, status: 'usado', horario: hora } : b)));
    setCheckins((c) => c + 1);
    return true;
  };

  const validar = async (codigo) => {
    const c = codigo.trim().toUpperCase();
    let bilhete = bilhetes.find((b) => b.codigo === c);
    if (!demo) {
      try {
        bilhete = await db.buscarBilhete(c); // sempre o estado atual do banco
      } catch (e) {
        store.setAviso(`Falha ao consultar ingresso: ${e.message}`);
        return;
      }
    }
    let r = avaliar(bilhete, c);
    if (r.auto && !(await registrar(c))) {
      // outro aparelho registrou a entrada nesse meio-tempo
      r = demo ? r : avaliar(await db.buscarBilhete(c).catch(() => bilhete), c);
    }
    setResultado(r);
    if (navigator.vibrate) navigator.vibrate(r.cor === 'green' ? 80 : [80, 60, 80]);
  };

  // Câmera + BarcodeDetector (Chrome/Android). Sem suporte → botões de simulação.
  const ligarCamera = async () => {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) { setCamera('indisponivel'); return; }
    setCamera('ligando');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCamera('ligada');
    } catch {
      setCamera('indisponivel');
    }
  };

  useEffect(() => {
    if (camera !== 'ligada' || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play();
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    let vivo = true;
    const loop = async () => {
      if (!vivo) return;
      try {
        const [qr] = await detector.detect(video);
        if (qr && qr.rawValue !== ultimoRef.current) { ultimoRef.current = qr.rawValue; validar(qr.rawValue); }
      } catch { /* quadro ainda não pronto */ }
      setTimeout(loop, 300);
    };
    loop();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const fechar = () => { setResultado(null); ultimoRef.current = ''; };

  const termo = busca.trim().toLowerCase();
  useEffect(() => {
    if (demo || termo.length < 2) { setOnline([]); return undefined; }
    const t = setTimeout(() => {
      db.buscarBilhetes(store.eventoId, termo).then(setOnline).catch((e) => store.setAviso(`Falha na busca: ${e.message}`));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, termo]);
  const encontrados = termo.length < 2 ? [] : demo
    ? bilhetes.filter((b) => `${b.nome} ${b.codigo}`.toLowerCase().includes(termo))
    : online;

  return (
    <div className="min-h-screen bg-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <a href="#/dashboard" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><Icon name="arrowLeft" className="size-4" /> Painel</a>
        <span className="font-display text-2xl tracking-wide">Portaria</span>
        <Badge color="green">{checkins} check-ins</Badge>
      </header>

      <main className="mx-auto max-w-md space-y-5 p-4">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-black">
          {camera === 'ligada' ? (
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center p-6 text-center">
              <div>
                <Icon name="camera" className="mx-auto mb-3 size-12 text-zinc-600" />
                {camera === 'indisponivel' ? (
                  <p className="text-sm text-muted">Leitor de QR indisponível neste navegador. Use a simulação ou a busca manual abaixo.</p>
                ) : (
                  <button onClick={ligarCamera} className="rounded-xl bg-fight px-5 py-3 font-semibold text-white hover:bg-fight-dark">
                    {camera === 'ligando' ? 'Abrindo câmera…' : 'Ligar câmera'}
                  </button>
                )}
              </div>
            </div>
          )}
          {/* mira */}
          <div className="pointer-events-none absolute inset-[18%]">
            {['left-0 top-0 border-l-4 border-t-4', 'right-0 top-0 border-r-4 border-t-4', 'bottom-0 left-0 border-b-4 border-l-4', 'bottom-0 right-0 border-b-4 border-r-4'].map((c) => (
              <span key={c} className={`absolute size-10 rounded-sm border-gold ${c}`} />
            ))}
            {camera === 'ligada' && <span className="absolute inset-x-0 top-1/2 h-0.5 animate-pulse bg-fight shadow-[0_0_12px] shadow-fight" />}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Simular leitura</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => validar(bilhetes.find((b) => b.status === 'valido' && !b.tipo.includes('Meia'))?.codigo ?? 'CF3-XXXXX')} className="rounded-xl bg-emerald-600/20 py-2.5 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/40">Válido</button>
            <button onClick={() => validar(bilhetes.find((b) => b.status === 'usado')?.codigo ?? 'CF3-1B6TR')} className="rounded-xl bg-amber-400/15 py-2.5 text-sm font-semibold text-amber-300 ring-1 ring-amber-400/40">Já usado</button>
            <button onClick={() => validar('CF3-ZZZZZ')} className="rounded-xl bg-fight/15 py-2.5 text-sm font-semibold text-red-300 ring-1 ring-fight/40">Inválido</button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Busca manual</p>
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou código (ex.: CF3-7K2Q9)" className={`${inputCls} py-3 pl-9`} />
          </div>
          <div className="mt-2 space-y-2">
            {encontrados.map((b) => (
              <button key={b.codigo} onClick={() => validar(b.codigo)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-panel p-3 text-left hover:bg-panel-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{b.nome}</span>
                  <span className="block font-mono text-xs text-muted">{b.codigo} · {b.tipo}{b.idade != null ? ` · ${b.idade} anos` : ''}</span>
                </span>
                <Badge color={b.status === 'valido' ? 'green' : b.status === 'usado' ? 'yellow' : 'red'}>{b.status === 'valido' ? 'Válido' : b.status === 'usado' ? `Usado ${b.horario}` : 'Cancelado'}</Badge>
              </button>
            ))}
            {termo.length >= 2 && encontrados.length === 0 && <p className="text-sm text-muted">Nenhum ingresso encontrado.</p>}
          </div>
        </div>
      </main>

      {resultado && (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center ${FUNDO[resultado.cor]}`} onClick={fechar}>
          <div className="grid size-32 place-items-center rounded-full bg-black/15">
            <Icon name={ICONE[resultado.cor]} className="size-20" />
          </div>
          <h2 className="mt-6 font-display text-6xl leading-none tracking-wide sm:text-7xl">{resultado.titulo}</h2>
          {resultado.bilhete && <p className="mt-4 text-2xl font-semibold">{resultado.bilhete.nome}</p>}
          {resultado.bilhete?.idade != null && <p className="mt-1 text-xl font-semibold opacity-90">{resultado.bilhete.idade} anos</p>}
          <p className="mt-2 max-w-sm text-lg opacity-90">{resultado.texto}</p>
          {resultado.bilhete && <p className="mt-2 font-mono opacity-75">{resultado.bilhete.codigo}</p>}
          <div className="mt-10 flex w-full max-w-xs flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            {resultado.liberar && !resultado.auto && (
              <button onClick={async () => { const c = resultado.bilhete.codigo; if (await registrar(c)) fechar(); else validar(c); }} className="rounded-2xl bg-black/80 py-4 text-lg font-bold text-white">Documento ok · liberar</button>
            )}
            <button onClick={fechar} className="rounded-2xl bg-black/25 py-4 text-lg font-bold">Próximo</button>
          </div>
        </div>
      )}
    </div>
  );
}
