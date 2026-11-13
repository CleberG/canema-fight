import { useState } from 'react';
import { loteAtual, novoCodigo, venderNoLote } from '../lib/data.js';
import { TIPOS_CHAVE } from '../lib/pix.js';
import { Button, Icon, brl, horaExibida, iniciais, inputCls, minutosEntre, montarCardPublico } from '../components/ui.jsx';
import { normalizar, proxima, situacao } from '../lib/aovivo.js';

const MAX_POR_COMPRA = 10;

// Nome completo = pelo menos nome e sobrenome.
const nomeOk = (n) => n.trim().split(/\s+/).filter((p) => p.length > 1).length >= 2;
const idadeOk = (v) => /^\d{1,3}$/.test(String(v).trim()) && Number(v) <= 120;

// Um lado do confronto: foto grande (ou iniciais), nome e equipe.
// Ao vivo: vídeo curto em loop (ou a foto "respirando", se não houver vídeo). resultado: 'ganhou' | 'perdeu' | null
function Lutador({ atleta, canto, aoVivo = false, resultado = null }) {
  const cor = resultado === 'ganhou' ? 'ring-gold' : canto === 'red' ? 'ring-fight/70' : 'ring-corner-blue/70';
  const fundo = canto === 'red' ? 'from-fight to-fight-dark' : 'from-corner-blue to-blue-800';
  const mexe = aoVivo ? 'animate-respira' : '';
  let midia;
  if (aoVivo && atleta.videoUrl) {
    midia = (
      <video
        key={atleta.videoUrl} src={atleta.videoUrl} poster={atleta.fotoUrl ?? undefined}
        autoPlay muted loop playsInline preload="auto" aria-label={`${atleta.nome} em ação`}
        className="size-full object-cover"
      />
    );
  } else if (atleta.fotoUrl) {
    midia = <img src={atleta.fotoUrl} alt={atleta.nome} loading="lazy" className={`size-full object-cover ${mexe}`} />;
  } else {
    midia = <div className={`grid size-full place-items-center bg-gradient-to-br ${fundo} font-display text-4xl text-white ${mexe}`}>{iniciais(atleta.nome)}</div>;
  }
  return (
    <div className={`min-w-0 ${canto === 'blue' ? 'text-right' : ''} ${resultado === 'perdeu' ? 'opacity-45 grayscale' : ''}`}>
      <div className={`relative aspect-square w-full overflow-hidden rounded-2xl ${resultado === 'ganhou' ? 'ring-4' : 'ring-2'} ${cor} ${aoVivo ? 'brilho-ao-vivo' : ''}`}>
        {midia}
        {resultado === 'ganhou' && (
          <span className={`absolute bottom-2 ${canto === 'blue' ? 'right-2' : 'left-2'} inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold uppercase text-ink`}>
            <Icon name="trophy" className="size-3.5" /> Venceu
          </span>
        )}
      </div>
      <p className={`mt-2 truncate font-display text-xl leading-none tracking-wide sm:text-2xl ${canto === 'red' ? 'text-red-300' : 'text-blue-300'}`}>{atleta.nome}</p>
      {atleta.academia && <p className="truncate text-xs text-muted">{atleta.academia}</p>}
    </div>
  );
}

const ladoDoResultado = (vencedor, lado) => (!vencedor || vencedor === 'empate' ? null : vencedor === lado ? 'ganhou' : 'perdeu');

export default function PaginaPublica({ store, carga }) {
  const { evento, ingressos, setIngressos, card, lutas, atletas, bilhetes, setBilhetes } = store;
  const [etapa, setEtapa] = useState(null); // null | 'dados' | 'ok'
  const [pessoas, setPessoas] = useState([]); // um titular por ingresso
  const [email, setEmail] = useState('');
  const [tentou, setTentou] = useState(false);
  const [emitidos, setEmitidos] = useState([]);
  const [comprando, setComprando] = useState(false);
  const [erroCompra, setErroCompra] = useState(null);
  // Demonstração mostra o card ao vivo; com Supabase, só o que o organizador publicou.
  const cardLista = store.demo ? montarCardPublico(card, lutas, atletas) : store.cardPublicado;
  const aoVivo = normalizar(store.aoVivo);
  const lutaAtual = cardLista.find((l) => l.id === aoVivo.atual) ?? null;
  const proximaLuta = proxima(cardLista, aoVivo);

  // Por enquanto há um único tipo de ingresso; o preço vem do lote vigente, sem exibir o lote.
  const tipo = ingressos[0] ?? null;
  const lote = tipo ? loteAtual(tipo) : null;
  const preco = lote?.preco ?? 0;
  const restam = lote ? lote.qtd - lote.vendidos : 0;
  const maximo = Math.min(restam, MAX_POR_COMPRA);
  const n = pessoas.length;
  const total = preco * n;
  const tipoChave = TIPOS_CHAVE.find((t) => t.id === evento.tipoChave)?.label ?? 'Chave';

  const novaPessoa = () => ({ nome: '', idade: '' });
  const abrir = () => {
    setPessoas([novaPessoa()]);
    setTentou(false);
    setErroCompra(null);
    setEtapa('dados');
  };
  const mudarQtd = (d) => setPessoas((p) => {
    const alvo = Math.max(1, Math.min(p.length + d, maximo));
    return alvo > p.length ? [...p, ...Array.from({ length: alvo - p.length }, novaPessoa)] : p.slice(0, alvo);
  });
  const editar = (k, campo, valor) => setPessoas((p) => p.map((x, j) => (j === k ? { ...x, [campo]: valor } : x)));
  const dadosValidos = pessoas.every((p) => nomeOk(p.nome) && idadeOk(p.idade));

  const irParaPix = (e) => {
    e.preventDefault();
    setTentou(true);
    if (dadosValidos) concluir();
  };

  // Registra o pedido (aguardando Pix) e os ingressos nominais. A organização confirma o Pix depois.
  const [pedidoDemo, setPedidoDemo] = useState(null);
  const [copiado, setCopiado] = useState(null);
  const copiar = (texto, qual) => { navigator.clipboard?.writeText(texto).catch(() => {}); setCopiado(qual); };
  const concluir = async () => {
    const lista = pessoas.map((p) => ({ ...p, tipoId: tipo.id, tipo: tipo.nome, lote: lote.nome, preco }));
    if (!store.demo) {
      setComprando(true);
      setErroCompra(null);
      try {
        const novos = await store.db.comprarIngressos(store.eventoId, lista, email);
        setEmitidos(novos);
        setEtapa('ok');
        store.db.carregarPublico(store.eventoId).then((d) => setIngressos(d.ingressos)).catch(() => {});
      } catch (e) {
        setErroCompra(e.message);
      } finally {
        setComprando(false);
      }
      return;
    }
    const usados = bilhetes.map((b) => b.codigo);
    const pedidoId = Math.max(0, ...store.pedidos.map((x) => x.id)) + 1;
    const novos = lista.map((p) => {
      const codigo = novoCodigo(usados);
      usados.push(codigo);
      return { codigo, nome: p.nome.trim().replace(/\s+/g, ' '), idade: Number(p.idade), tipo: p.tipo, lote: p.lote, status: 'valido', pedidoId, pagamento: 'pendente' };
    });
    setIngressos((l) => venderNoLote(l, tipo.id, novos.length));
    setBilhetes((b) => [...b, ...novos]);
    store.setPedidos((l) => [{
      id: pedidoId, compradorNome: novos[0].nome, compradorEmail: email || null, total, pagamento: 'pendente', criadoEm: new Date().toISOString(),
      bilhetes: novos.map(({ codigo, nome, idade, tipo: t, lote: lt }) => ({ codigo, nome, idade, tipo: t, lote: lt })),
    }, ...l]);
    setPedidoDemo({ id: pedidoId, pago: false });
    setEmitidos(novos);
    setEtapa('ok');
  };

  // Só no modo demonstração: faz o papel do organizador confirmando o Pix.
  const simularConfirmacao = () => {
    store.setPedidos((l) => l.map((x) => (x.id === pedidoDemo.id ? { ...x, pagamento: 'pago', pagoEm: new Date().toISOString() } : x)));
    setBilhetes((l) => l.map((b) => (b.pedidoId === pedidoDemo.id ? { ...b, pagamento: 'pago' } : b)));
    setPedidoDemo({ ...pedidoDemo, pago: true });
  };

  const fechar = () => {
    if (etapa === 'ok') { setEmail(''); setPedidoDemo(null); setCopiado(null); setPessoas([]); }
    setEtapa(null);
  };

  if (!store.demo && !['ok', 'publico'].includes(carga?.estado)) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink p-6 text-center text-sm text-zinc-300">
        {carga?.estado === 'erro' ? `Não foi possível carregar o evento: ${carga.erro}` : 'Carregando evento…'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink pb-16">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,rgba(229,38,47,.45),transparent),radial-gradient(60%_60%_at_100%_100%,rgba(242,182,50,.25),transparent)]" />
        <div className="absolute inset-0 opacity-[.07] [background:repeating-linear-gradient(-45deg,#fff_0_2px,transparent_2px_14px)]" />
        <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-6">
          <a href="#/dashboard" className="mb-8 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"><Icon name="arrowLeft" className="size-3.5" /> Painel do organizador</a>
          <p className="text-xs font-bold uppercase tracking-[.3em] text-gold">{evento.subtitulo}</p>
          <h1 className="mt-1 max-w-2xl font-display text-7xl leading-[.85] tracking-wide sm:text-8xl">{evento.nome}</h1>
          <div className="mt-6 flex flex-col gap-2 text-sm text-zinc-300 sm:flex-row sm:gap-6">
            <span className="flex items-center gap-2"><Icon name="calendar" className="size-4 text-gold" /> {evento.dataTexto}</span>
            <span className="flex items-center gap-2"><Icon name="pin" className="size-4 text-gold" /> {evento.local} · {evento.cidade}</span>
          </div>
          <button onClick={abrir} disabled={!lote} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-fight px-5 py-3 font-semibold text-white shadow-xl shadow-fight/30 hover:bg-fight-dark disabled:opacity-40">
            <Icon name="ticket" className="size-5" /> {lote ? 'Comprar ingresso' : 'Ingressos esgotados'}
          </button>
          {lote && <p className="mt-2 text-sm text-zinc-300">Ingresso para assistir · <b className="text-gold">{brl(preco)}</b></p>}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-4 pt-8">
        {lutaAtual && (
          <section aria-live="polite">
            <h2 className="mb-3 flex items-center gap-2 font-display text-3xl tracking-wide">
              <span className="size-3 animate-pulse rounded-full bg-fight" /> Acontecendo agora
            </h2>
            <article className="relative overflow-hidden rounded-3xl border border-fight/70 bg-gradient-to-b from-fight/20 to-panel p-3 shadow-2xl shadow-fight/20 sm:p-5">
              <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
                <Lutador atleta={lutaAtual.vermelho} canto="red" aoVivo />
                <div className="flex w-16 flex-col items-center text-center sm:w-24">
                  <span className="rounded-full bg-fight px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Ao vivo</span>
                  <p className="mt-1 font-display text-4xl leading-none text-fight sm:text-5xl">VS</p>
                  {lutaAtual.peso && <p className="mt-1 text-[11px] font-semibold leading-tight text-zinc-300">{lutaAtual.peso}</p>}
                </div>
                <Lutador atleta={lutaAtual.azul} canto="blue" aoVivo />
              </div>
            </article>
          </section>
        )}

        <section>
          <h2 className="mb-1 font-display text-3xl tracking-wide">Card de lutas</h2>
          {cardLista.length > 0 && (
            <p className="mb-4 text-sm text-muted">
              {cardLista.length} lutas confirmadas
              {cardLista.some((l) => l.horario) && ' · horários previstos, podem adiantar ou atrasar um pouco'}
            </p>
          )}
          <div className="space-y-3">
            {cardLista.map((l, i) => {
              const principal = i === 0;
              const numero = cardLista.length - i;
              const categoria = typeof l.peso === 'number' ? `${l.peso} kg` : l.peso;
              const s = situacao(aoVivo, l.id);
              const vencedor = aoVivo.resultados[l.id]?.vencedor ?? null;
              const borda = s === 'ao_vivo' ? 'border-fight/70 bg-panel' : principal ? 'border-gold/60 bg-gradient-to-b from-gold/10 to-panel' : 'border-line bg-panel';
              const ehProxima = s === 'aguardando' && proximaLuta?.id === l.id && aoVivo.atual == null && Object.keys(aoVivo.resultados).length > 0;
              // Intervalo: pausa longa entre esta luta e a anterior da noite (a próxima da lista)
              const anterior = cardLista[i + 1];
              const intervalo = anterior && minutosEntre(anterior.horario, l.horario) >= 20;
              return (
                <div key={l.id} className="space-y-3">
                  <article className={`relative overflow-hidden rounded-3xl border p-3 sm:p-4 ${borda}`}>
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-fight/15 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-corner-blue/15 to-transparent" />
                    <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
                      <Lutador atleta={l.vermelho} canto="red" resultado={ladoDoResultado(vencedor, 'vermelho')} />
                      <div className="flex w-16 flex-col items-center text-center sm:w-24">
                        {l.horario && (
                          <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold tabular-nums text-white sm:text-sm">
                            <Icon name="clock" className="size-3.5 text-gold" />{horaExibida(l.horario)}
                          </p>
                        )}
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${principal ? 'text-gold' : 'text-zinc-500'}`}>{principal ? 'Principal' : `Luta ${String(numero).padStart(2, '0')}`}</p>
                        <p className="font-display text-4xl leading-none text-fight sm:text-5xl">VS</p>
                        {categoria && <p className="mt-1 text-[11px] font-semibold leading-tight text-zinc-300">{categoria}</p>}
                        {s === 'ao_vivo' && (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-fight px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                            <span className="size-1.5 animate-pulse rounded-full bg-white" />Ao vivo
                          </span>
                        )}
                        {s === 'encerrada' && <span className="mt-1.5 rounded-full bg-zinc-700/60 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-300">{vencedor === 'empate' ? 'Empate' : 'Encerrada'}</span>}
                        {ehProxima && <span className="mt-1.5 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">Próxima</span>}
                      </div>
                      <Lutador atleta={l.azul} canto="blue" resultado={ladoDoResultado(vencedor, 'azul')} />
                    </div>
                  </article>
                  {intervalo && (
                    <p className="flex items-center gap-3 py-1 text-xs font-bold uppercase tracking-[.25em] text-gold">
                      <span className="h-px flex-1 bg-gold/30" /> Intervalo <span className="h-px flex-1 bg-gold/30" />
                    </p>
                  )}
                </div>
              );
            })}
            {cardLista.length === 0 && <p className="text-sm text-muted">Card em breve.</p>}
          </div>
        </section>

        <section id="ingressos" className="scroll-mt-4">
          <h2 className="mb-3 font-display text-3xl tracking-wide">Ingresso</h2>
          {tipo ? (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-panel p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{tipo.nome}</p>
                <p className="text-xs text-muted">Exclusivo para o público que vai assistir ao evento{tipo.descricao ? ` · ${tipo.descricao}` : ''}</p>
                {lote
                  ? <p className="mt-1 font-display text-3xl leading-none text-gold">{brl(preco)}</p>
                  : <p className="mt-1 font-display text-2xl text-fight">Esgotado</p>}
              </div>
              <Button className="px-6 py-3" onClick={abrir} disabled={!lote}><Icon name="ticket" className="size-4" /> Comprar</Button>
            </div>
          ) : <p className="text-sm text-muted">Venda de ingressos em breve.</p>}
        </section>
      </main>

      {etapa && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 sm:place-items-center" onClick={fechar}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-panel p-5 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl tracking-wide">{etapa === 'ok' ? 'Pagamento via Pix' : 'Comprar ingresso'}</h3>
              <button onClick={fechar} className="rounded-lg p-1 hover:bg-panel-2" aria-label="Fechar"><Icon name="x" /></button>
            </div>

            {etapa === 'dados' && (
              <form onSubmit={irParaPix} className="space-y-4" noValidate>
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel-2/60 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{tipo.nome}</p>
                    <p className="text-xs text-muted">{brl(preco)} cada · para quem vai assistir</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => mudarQtd(-1)} disabled={n <= 1} className="grid size-9 place-items-center rounded-full border border-line text-lg hover:bg-panel-2 disabled:opacity-30" aria-label="Diminuir quantidade">−</button>
                    <span className="w-6 text-center font-display text-2xl" aria-live="polite">{n}</span>
                    <button type="button" onClick={() => mudarQtd(1)} disabled={n >= maximo} className="grid size-9 place-items-center rounded-full bg-fight text-lg text-white hover:bg-fight-dark disabled:opacity-30" aria-label="Aumentar quantidade">+</button>
                  </div>
                </div>
                {n >= maximo && <p className="-mt-2 text-xs text-zinc-500">Máximo de {maximo} ingresso(s) por compra.</p>}

                <p className="text-sm text-zinc-400">Cada ingresso é nominal: preencha os dados de quem vai usar.</p>
                {pessoas.map((p, k) => {
                  const erroNome = tentou && !nomeOk(p.nome);
                  const erroIdade = tentou && !idadeOk(p.idade);
                  return (
                    <div key={k} className="space-y-2 rounded-2xl border border-line bg-panel-2/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gold">Pessoa {k + 1}</p>
                      <input
                        placeholder="Nome completo"
                        autoComplete={k === 0 ? 'name' : 'off'}
                        value={p.nome}
                        onChange={(e) => editar(k, 'nome', e.target.value)}
                        className={`${inputCls} ${erroNome ? 'border-fight/70' : ''}`}
                      />
                      {erroNome && <p className="text-xs text-red-300">Informe nome e sobrenome</p>}
                      <input
                        placeholder="Idade"
                        inputMode="numeric"
                        value={p.idade}
                        onChange={(e) => editar(k, 'idade', e.target.value.replace(/\D/g, '').slice(0, 3))}
                        className={`${inputCls} w-28 ${erroIdade ? 'border-fight/70' : ''}`}
                      />
                      {erroIdade && <p className="text-xs text-red-300">Informe a idade em anos</p>}
                    </div>
                  );
                })}
                <label className="block">
                  <span className="mb-1.5 block text-xs text-zinc-400">E-mail para contato (opcional)</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className={inputCls} />
                </label>
                <div className="flex justify-between border-t border-line pt-3 font-semibold"><span>Total · {n} ingresso(s)</span><span className="text-gold">{brl(total)}</span></div>
                {erroCompra && <p className="w-full rounded-lg bg-fight/15 px-3 py-2 text-sm text-red-300">{erroCompra}</p>}
                <Button type="submit" className="w-full py-3" disabled={comprando}><Icon name="pix" className="size-4" /> {comprando ? 'Registrando pedido…' : 'Pagar com Pix'}</Button>
              </form>
            )}

            {etapa === 'ok' && (
              <div className="flex flex-col">
                {pedidoDemo?.pago ? (
                  <div className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 p-3 text-sm text-emerald-300"><Icon name="check" className="size-4" /> Pix confirmado · ingressos liberados</div>
                ) : (
                  <>
                    <p className="text-sm text-zinc-300">Faça o Pix com os dados abaixo. Seus ingressos ficam liberados assim que a organização confirmar o pagamento.</p>
                    <div className="mt-3 space-y-3 rounded-2xl border border-gold/40 bg-gold/5 p-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted">Valor</p>
                          <p className="font-display text-4xl leading-none text-gold">{brl(total)}</p>
                        </div>
                        <button onClick={() => copiar(total.toFixed(2).replace('.', ','), 'valor')} className="text-xs font-medium text-gold hover:underline">{copiado === 'valor' ? 'Valor copiado!' : 'Copiar valor'}</button>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Tipo de chave</p>
                        <p className="font-semibold">{tipoChave}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Chave Pix</p>
                        <p className="break-all rounded-lg bg-panel-2 px-3 py-2 font-mono text-sm">{evento.chavePix}</p>
                      </div>
                      <p className="text-xs text-muted">Recebedor: <span className="text-zinc-200">{evento.recebedor}</span></p>
                      <Button className="w-full py-3" onClick={() => copiar(evento.chavePix, 'chave')}>
                        <Icon name="copy" className="size-4" /> {copiado === 'chave' ? 'Chave copiada!' : `Copiar chave (${tipoChave})`}
                      </Button>
                    </div>
                    <p className="mt-2 flex items-center justify-center gap-2 text-xs text-amber-300"><span className="size-2 animate-pulse rounded-full bg-amber-300" /> Aguardando confirmação do pagamento</p>
                  </>
                )}
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Ingressos no nome de</p>
                <ul className="mt-2 space-y-2">
                  {emitidos.map((b) => (
                    <li key={b.codigo} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel-2/60 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate font-semibold">{b.nome}</span>
                      <span className="shrink-0 text-xs text-muted">{b.idade} anos</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-zinc-500">Na entrada, basta informar o nome na portaria.</p>
                {store.demo && !pedidoDemo?.pago && (
                  <Button variant="success" className="mt-4 w-full" onClick={simularConfirmacao}>Simular confirmação do Pix (organizador)</Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
