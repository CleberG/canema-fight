import { useState } from 'react';
import { indiceLoteAtual, loteAtual, novoCodigo, venderNoLote } from '../lib/data.js';
import { Avatar, Button, FakeQR, Icon, brl, inputCls, nomeExibido } from '../components/ui.jsx';

const MAX_POR_TIPO = 10;

// Nome completo = pelo menos nome e sobrenome.
const nomeOk = (n) => n.trim().split(/\s+/).filter((p) => p.length > 1).length >= 2;
const idadeOk = (v) => /^\d{1,3}$/.test(String(v).trim()) && Number(v) <= 120;

export default function PaginaPublica({ store }) {
  const { evento, ingressos, setIngressos, card, lutas, atletas, bilhetes, setBilhetes } = store;
  const [qtd, setQtd] = useState({});
  const [etapa, setEtapa] = useState(null); // null | 'dados' | 'pix' | 'ok'
  const [pessoas, setPessoas] = useState([]); // um titular por ingresso
  const [email, setEmail] = useState('');
  const [tentou, setTentou] = useState(false);
  const [emitidos, setEmitidos] = useState([]);
  const porId = Object.fromEntries(atletas.map((a) => [a.id, a]));
  const lutaPorId = Object.fromEntries(lutas.map((l) => [l.id, l]));

  const itens = ingressos.filter((i) => qtd[i.id] > 0).map((i) => ({ ...i, lote: loteAtual(i), n: qtd[i.id] }));
  const total = itens.reduce((s, i) => s + i.lote.preco * i.n, 0);
  const n = itens.reduce((s, i) => s + i.n, 0);
  const restamNoLote = (i) => { const l = loteAtual(i); return l ? l.qtd - l.vendidos : 0; };
  const mudar = (i, d) => setQtd((q) => ({ ...q, [i.id]: Math.max(0, Math.min((q[i.id] ?? 0) + d, restamNoLote(i), MAX_POR_TIPO)) }));

  const vigentes = ingressos.map(loteAtual).filter(Boolean);
  const aPartirDe = vigentes.length ? Math.min(...vigentes.map((l) => l.preco)) : null;

  const continuar = () => {
    setPessoas(itens.flatMap((i) => Array.from({ length: i.n }, () => ({ tipoId: i.id, tipo: i.nome, lote: i.lote.nome, preco: i.lote.preco, nome: '', idade: '' }))));
    setTentou(false);
    setEtapa('dados');
  };
  const editar = (k, campo, valor) => setPessoas((p) => p.map((x, j) => (j === k ? { ...x, [campo]: valor } : x)));
  const dadosValidos = pessoas.every((p) => nomeOk(p.nome) && idadeOk(p.idade));

  const irParaPix = (e) => {
    e.preventDefault();
    setTentou(true);
    if (dadosValidos) setEtapa('pix');
  };

  const concluir = () => {
    const usados = bilhetes.map((b) => b.codigo);
    const novos = pessoas.map((p) => {
      const codigo = novoCodigo(usados);
      usados.push(codigo);
      return { codigo, nome: p.nome.trim().replace(/\s+/g, ' '), idade: Number(p.idade), tipo: p.tipo, lote: p.lote, status: 'valido', comprador: email };
    });
    setIngressos((l) => itens.reduce((acc, i) => venderNoLote(acc, i.id, i.n), l));
    setBilhetes((b) => [...b, ...novos]);
    setEmitidos(novos);
    setEtapa('ok');
  };

  const fechar = () => {
    if (etapa === 'ok') { setQtd({}); setEmail(''); }
    setEtapa(null);
  };

  return (
    <div className="min-h-screen bg-ink pb-28">
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
          <a href="#ingressos" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-fight px-5 py-3 font-semibold text-white shadow-xl shadow-fight/30 hover:bg-fight-dark">
            <Icon name="ticket" className="size-5" /> Comprar ingresso
          </a>
          {aPartirDe != null && <p className="mt-2 text-sm text-zinc-300">Lote atual a partir de <b className="text-gold">{brl(aPartirDe)}</b></p>}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-4 pt-8">
        <section>
          <h2 className="mb-3 font-display text-3xl tracking-wide">Card de lutas</h2>
          <div className="space-y-2">
            {[...card].reverse().map((id, i) => {
              const l = lutaPorId[id];
              const A = porId[l.a];
              const B = porId[l.b];
              const principal = i === 0;
              return (
                <div key={id} className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border p-3 ${principal ? 'border-gold/60 bg-gold/5' : 'border-line bg-panel'}`}>
                  <div className="flex min-w-0 items-center gap-2"><Avatar atleta={A} corner="red" size="size-10" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{nomeExibido(A)}</p><p className="truncate text-xs text-muted">{A.academia}</p></div></div>
                  <div className="text-center">
                    {principal && <p className="text-[9px] font-bold uppercase tracking-wider text-gold">Principal</p>}
                    <p className="font-display text-2xl text-fight">VS</p>
                    <p className="text-[10px] text-zinc-500">{Math.round(Math.max(A.peso, B.peso))} kg</p>
                  </div>
                  <div className="flex min-w-0 flex-row-reverse items-center gap-2 text-right"><Avatar atleta={B} corner="blue" size="size-10" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{nomeExibido(B)}</p><p className="truncate text-xs text-muted">{B.academia}</p></div></div>
                </div>
              );
            })}
            {card.length === 0 && <p className="text-sm text-muted">Card em breve.</p>}
          </div>
        </section>

        <section id="ingressos" className="scroll-mt-4">
          <h2 className="mb-3 font-display text-3xl tracking-wide">Ingressos</h2>
          <div className="space-y-3">
            {ingressos.map((i) => {
              const atual = indiceLoteAtual(i);
              const lote = i.lotes[atual];
              const proximo = atual >= 0 ? i.lotes[atual + 1] : null;
              const restam = restamNoLote(i);
              return (
                <div key={i.id} className="rounded-2xl border border-line bg-panel p-4">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{i.nome}</p>
                        {lote && <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink">{lote.nome}</span>}
                      </div>
                      <p className="text-xs text-muted">{i.descricao}</p>
                      {lote ? (
                        <>
                          <p className="mt-1 font-display text-3xl leading-none text-gold">{brl(lote.preco)}</p>
                          <p className={`mt-1 text-xs ${restam < 20 ? 'font-semibold text-fight' : 'text-zinc-400'}`}>
                            {restam < 20 ? `Últimos ${restam} neste lote` : `Restam ${restam} neste lote`}
                            {proximo && <span className="font-normal text-zinc-500"> · depois {proximo.nome.toLowerCase()} a {brl(proximo.preco)}</span>}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 font-display text-2xl text-fight">Esgotado</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => mudar(i, -1)} className="grid size-9 place-items-center rounded-full border border-line text-lg hover:bg-panel-2" aria-label={`Menos ${i.nome}`}>−</button>
                      <span className="w-6 text-center font-display text-2xl">{qtd[i.id] ?? 0}</span>
                      <button onClick={() => mudar(i, 1)} disabled={!lote} className="grid size-9 place-items-center rounded-full bg-fight text-lg text-white hover:bg-fight-dark disabled:opacity-30" aria-label={`Mais ${i.nome}`}>+</button>
                    </div>
                  </div>
                  {i.lotes.length > 1 && (
                    <div className="mt-3 flex gap-1.5">
                      {i.lotes.map((l, k) => (
                        <span
                          key={l.nome}
                          className={`flex-1 rounded-lg px-2 py-1 text-center text-[11px] ${k < atual || atual < 0 ? 'bg-panel-2 text-zinc-600 line-through' : k === atual ? 'bg-gold/15 font-semibold text-gold ring-1 ring-gold/40' : 'bg-panel-2 text-zinc-400'}`}
                        >
                          {l.nome} · {brl(l.preco)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {n > 0 && !etapa && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center gap-4">
            <div className="flex-1"><p className="text-xs text-muted">{n} ingresso(s)</p><p className="font-display text-3xl leading-none">{brl(total)}</p></div>
            <Button className="px-6 py-3" onClick={continuar}>Continuar</Button>
          </div>
        </div>
      )}

      {etapa && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 sm:place-items-center">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-panel p-5 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl tracking-wide">{etapa === 'ok' ? (emitidos.length > 1 ? 'Ingressos emitidos' : 'Ingresso emitido') : etapa === 'pix' ? 'Pagamento' : 'Dados dos participantes'}</h3>
              <button onClick={fechar} className="rounded-lg p-1 hover:bg-panel-2" aria-label="Fechar"><Icon name="x" /></button>
            </div>

            {etapa === 'dados' && (
              <form onSubmit={irParaPix} className="space-y-4" noValidate>
                <p className="text-sm text-zinc-400">Cada ingresso é nominal: preencha os dados de quem vai usar. Cada pessoa recebe um QR Code.</p>
                {pessoas.map((p, k) => {
                  const erroNome = tentou && !nomeOk(p.nome);
                  const erroIdade = tentou && !idadeOk(p.idade);
                  return (
                    <div key={k} className="space-y-2 rounded-2xl border border-line bg-panel-2/60 p-3">
                      <p className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gold">
                        <span>Ingresso {k + 1} · {p.tipo}</span>
                        <span className="text-zinc-400">{p.lote} · {brl(p.preco)}</span>
                      </p>
                      <input
                        placeholder="Nome completo"
                        autoComplete="name"
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
                      {p.tipoId === 'meia' && <p className="text-xs text-amber-300">Meia-entrada: leve o documento que comprova o direito.</p>}
                    </div>
                  );
                })}
                <label className="block">
                  <span className="mb-1.5 block text-xs text-zinc-400">E-mail para receber os ingressos (opcional)</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className={inputCls} />
                </label>
                <div className="flex justify-between border-t border-line pt-3 font-semibold"><span>Total · {n} ingresso(s)</span><span className="text-gold">{brl(total)}</span></div>
                <Button type="submit" className="w-full py-3"><Icon name="pix" className="size-4" /> Pagar com Pix</Button>
              </form>
            )}

            {etapa === 'pix' && (
              <div className="flex flex-col items-center text-center">
                <FakeQR texto={`pix-${evento.chavePix}-${total}-${n}`} className="size-48" />
                <p className="mt-3 font-display text-3xl text-gold">{brl(total)}</p>
                <p className="text-xs text-muted">Pagar para {evento.recebedor} · expira em 15 min</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-300"><span className="size-2 animate-pulse rounded-full bg-amber-300" /> Aguardando pagamento…</div>
                <Button variant="success" className="mt-4 w-full py-3" onClick={concluir}>Simular pagamento aprovado</Button>
                <button onClick={() => setEtapa('dados')} className="mt-2 text-xs text-zinc-400 hover:text-white">Voltar e corrigir dados</button>
              </div>
            )}

            {etapa === 'ok' && (
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 grid size-12 place-items-center rounded-full bg-emerald-500 text-white"><Icon name="check" /></div>
                <p className="text-sm text-zinc-300">Pagamento confirmado. Cada pessoa apresenta o próprio QR na portaria{email ? <> · cópia enviada para <b>{email}</b></> : ''}.</p>
                <div className="mt-4 w-full space-y-3">
                  {emitidos.map((b) => (
                    <div key={b.codigo} className="flex items-center gap-4 rounded-2xl border border-gold/50 bg-gradient-to-b from-fight/20 to-panel-2 p-3 text-left">
                      <FakeQR texto={b.codigo} className="size-28 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{b.nome}</p>
                        <p className="text-xs text-muted">{b.idade} anos</p>
                        <p className="mt-1 text-xs text-zinc-300">{b.tipo} · {b.lote}</p>
                        <p className="mt-1 font-mono text-sm tracking-widest text-gold">{b.codigo}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-zinc-500">Protótipo: pagamento simulado, nenhum valor cobrado.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
