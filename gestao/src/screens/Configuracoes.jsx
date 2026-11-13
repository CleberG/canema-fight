import { useState } from 'react';
import { EVENTO, indiceLoteAtual, textoData } from '../lib/data.js';
import { TIPOS_CHAVE, validarChave } from '../lib/pix.js';
import { Button, Card, Icon, PageTitle, brl, inputCls } from '../components/ui.jsx';

function Campo({ label, dica, erro, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      {children}
      {erro ? <span className="mt-1 block text-xs text-red-300">{erro}</span> : dica && <span className="mt-1 block text-xs text-zinc-500">{dica}</span>}
    </label>
  );
}

// "35", "35,50", "1.000,00" ou "35.50" → número
const numero = (v) => {
  const t = String(v).trim();
  return Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
};
const loteParaForm = (l) => ({ ...l, preco: String(l.preco).replace('.', ','), qtd: String(l.qtd) });
const tiposParaForm = (ingressos) => ingressos.map((t) => ({ ...t, lotes: t.lotes.map(loteParaForm) }));

// Erro de um lote do formulário (ou null)
function erroDoLote(l) {
  const preco = numero(l.preco);
  const qtd = Number(l.qtd);
  if (!l.nome.trim()) return 'Informe o nome do lote';
  if (String(l.preco).trim() === '' || !(preco >= 0)) return 'Preço inválido';
  if (!Number.isInteger(qtd) || qtd < 1) return 'Quantidade deve ser 1 ou mais';
  if (qtd < l.vendidos) return `Já foram vendidos ${l.vendidos}; a quantidade não pode ser menor`;
  return null;
}

export default function Configuracoes({ store }) {
  const { evento, setEvento, ingressos, setIngressos } = store;
  const [tipos, setTipos] = useState(() => tiposParaForm(ingressos));
  const [salvando, setSalvando] = useState(false);
  const [erroIngressos, setErroIngressos] = useState(null);
  const [form, setForm] = useState(() => ({
    ...evento,
    dia: evento.data.slice(0, 10),
    hora: evento.data.slice(11, 16),
    inscricao: String(evento.inscricao).replace('.', ','),
  }));
  const [tentou, setTentou] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setSalvo(false); };
  const chave = validarChave(form.tipoChave, form.chavePix);
  const valor = Number(String(form.inscricao).replace(',', '.'));
  const erros = {
    nome: !form.nome.trim() && 'Informe o nome do evento',
    dia: !form.dia && 'Informe a data',
    inscricao: !(valor > 0) && 'Valor deve ser maior que zero',
    chavePix: !chave.ok && chave.erro,
    recebedor: !form.recebedor.trim() && 'Informe o nome do recebedor',
  };
  const errosLotes = tipos.flatMap((t) => t.lotes.map(erroDoLote));
  const valido = !Object.values(erros).some(Boolean) && !errosLotes.some(Boolean) && tipos.every((t) => t.lotes.length > 0);

  // Ingressos: editar lotes (nome, preço, quantidade), criar e remover
  const mudarLote = (ti, li, campo, v) => {
    setTipos((ts) => ts.map((t, i) => (i !== ti ? t : { ...t, lotes: t.lotes.map((l, j) => (j === li ? { ...l, [campo]: v } : l)) })));
    setSalvo(false);
  };
  const novoLote = (ti) => {
    setTipos((ts) => ts.map((t, i) => (i !== ti ? t : {
      ...t,
      lotes: [...t.lotes, { nome: `${t.lotes.length + 1}º lote`, preco: t.lotes.at(-1)?.preco ?? '', qtd: '100', vendidos: 0 }],
    })));
    setSalvo(false);
  };
  const removerLote = (ti, li) => {
    setTipos((ts) => ts.map((t, i) => (i !== ti ? t : { ...t, lotes: t.lotes.filter((_, j) => j !== li) })));
    setSalvo(false);
  };
  const tiposSalvos = () => tipos.map((t) => ({
    ...t, lotes: t.lotes.map((l) => ({ ...l, nome: l.nome.trim(), preco: numero(l.preco), qtd: Number(l.qtd) })),
  }));
  const precoPublico = (() => {
    const t = tipos[0];
    const l = t && t.lotes.find((x) => x.vendidos < Number(x.qtd));
    return l ? { valor: numero(l.preco), lote: l.nome } : null;
  })();
  const tipo = TIPOS_CHAVE.find((t) => t.id === form.tipoChave);

  const salvar = async (e) => {
    e.preventDefault();
    setTentou(true);
    if (!valido) return;
    const novos = tiposSalvos();
    setErroIngressos(null);
    if (store.demo) {
      setIngressos(novos);
    } else {
      setSalvando(true);
      try {
        const doBanco = await store.db.salvarLotes(store.eventoId, novos, ingressos);
        setIngressos(doBanco);
        setTipos(tiposParaForm(doBanco));
      } catch (err) {
        setErroIngressos(`Não foi possível salvar os ingressos: ${err.message}`);
        setSalvando(false);
        return;
      }
      setSalvando(false);
    }
    const data = `${form.dia}T${form.hora || '00:00'}:00`;
    const { dia, hora, ...resto } = form;
    setEvento({ ...resto, data, dataTexto: textoData(data), inscricao: valor, chavePix: chave.valor });
    setForm({ ...form, chavePix: chave.valor });
    setSalvo(true);
  };

  const restaurar = () => {
    setEvento(EVENTO);
    setForm({ ...EVENTO, dia: EVENTO.data.slice(0, 10), hora: EVENTO.data.slice(11, 16), inscricao: String(EVENTO.inscricao) });
    setTentou(false);
    setSalvo(false);
  };

  const erro = (k) => tentou && erros[k];

  return (
    <form onSubmit={salvar}>
      <PageTitle kicker="Administração" title="Configurações" />

      {salvo && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
          <Icon name="check" className="text-emerald-400" /> Configurações salvas. Pagamentos, dashboard e página pública já usam os novos dados.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card className="space-y-4 p-5">
            <h2 className="font-display text-2xl tracking-wide">Evento</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nome do evento" erro={erro('nome')} className="sm:col-span-2"><input value={form.nome} onChange={set('nome')} className={inputCls} /></Campo>
              <Campo label="Subtítulo" className="sm:col-span-2"><input value={form.subtitulo} onChange={set('subtitulo')} className={inputCls} /></Campo>
              <Campo label="Data" erro={erro('dia')}><input type="date" value={form.dia} onChange={set('dia')} className={`${inputCls} [color-scheme:dark]`} /></Campo>
              <Campo label="Horário"><input type="time" value={form.hora} onChange={set('hora')} className={`${inputCls} [color-scheme:dark]`} /></Campo>
              <Campo label="Local"><input value={form.local} onChange={set('local')} className={inputCls} /></Campo>
              <Campo label="Cidade / UF"><input value={form.cidade} onChange={set('cidade')} className={inputCls} /></Campo>
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide"><Icon name="pix" className="size-5 text-emerald-400" /> Recebimento por Pix</h2>
            <Campo label="Valor da inscrição do atleta (R$)" erro={erro('inscricao')}>
              <input value={form.inscricao} onChange={set('inscricao')} inputMode="decimal" className={`${inputCls} sm:max-w-48`} />
            </Campo>
            <div>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">Tipo de chave</span>
              <div className="flex flex-wrap gap-2">
                {TIPOS_CHAVE.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setForm({ ...form, tipoChave: t.id }); setSalvo(false); }}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${form.tipoChave === t.id ? 'bg-fight text-white' : 'bg-panel-2 text-zinc-300 hover:bg-line'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <Campo label={`Chave Pix (${tipo.label})`} erro={erro('chavePix')} dica={form.chavePix && chave.ok ? `Será salva como ${chave.valor}` : null}>
              <input value={form.chavePix} onChange={set('chavePix')} placeholder={tipo.placeholder} className={`${inputCls} font-mono`} autoComplete="off" />
            </Campo>
            <Campo label="Nome do recebedor" erro={erro('recebedor')} dica="Como aparece no app do banco de quem paga">
              <input value={form.recebedor} onChange={set('recebedor')} className={inputCls} />
            </Campo>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide"><Icon name="ticket" className="size-5 text-gold" /> Ingressos</h2>
            <p className="text-sm text-zinc-400">
              Os ingressos são vendidos por lotes, na ordem da lista: quando um lote esgota, começa o próximo.
              Para mudar o preço agora (por exemplo, no dia do evento), altere o valor do lote <b className="text-emerald-300">em venda</b> e salve.
            </p>
            {tipos.map((t, ti) => {
              const atual = indiceLoteAtual({ lotes: t.lotes.map((l) => ({ ...l, qtd: Number(l.qtd) })) });
              return (
                <div key={t.id} className="rounded-2xl border border-line bg-panel-2/40 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{t.nome}</p>
                    {ti === 0 && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold">Vendido na página pública</span>}
                  </div>
                  <div className="mb-1 grid grid-cols-[1fr_6.5rem_5rem_2rem] gap-2 text-[11px] uppercase tracking-wider text-muted">
                    <span>Lote</span><span>Preço</span><span>Qtd.</span><span />
                  </div>
                  <div className="space-y-2">
                    {t.lotes.map((l, li) => {
                      const erroL = tentou && erroDoLote(l);
                      return (
                        <div key={l.id ?? `novo-${li}`}>
                          <div className="grid grid-cols-[1fr_6.5rem_5rem_2rem] items-center gap-2">
                            <input value={l.nome} onChange={(e) => mudarLote(ti, li, 'nome', e.target.value)} aria-label="Nome do lote" className={`${inputCls} py-2`} />
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">R$</span>
                              <input value={l.preco} onChange={(e) => mudarLote(ti, li, 'preco', e.target.value)} inputMode="decimal" aria-label={`Preço do ${l.nome}`} className={`${inputCls} py-2 pl-8`} />
                            </div>
                            <input value={l.qtd} onChange={(e) => mudarLote(ti, li, 'qtd', e.target.value.replace(/\D/g, ''))} inputMode="numeric" aria-label={`Quantidade do ${l.nome}`} className={`${inputCls} py-2`} />
                            {l.vendidos === 0 ? (
                              <button type="button" onClick={() => removerLote(ti, li)} disabled={t.lotes.length === 1} className="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-panel-2 hover:text-fight disabled:opacity-30" aria-label={`Remover ${l.nome}`}>
                                <Icon name="x" className="size-4" />
                              </button>
                            ) : <span />}
                          </div>
                          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                            {li === atual && <span className="font-semibold text-emerald-300">● Em venda</span>}
                            {atual >= 0 && li < atual && <span>Esgotado</span>}
                            {atual < 0 && <span>Esgotado</span>}
                            <span>{l.vendidos} vendido(s) de {l.qtd || 0}</span>
                            {erroL && <span className="text-red-300">{erroL}</span>}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => novoLote(ti)} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline">
                    <Icon name="plus" className="size-4" /> Adicionar lote
                  </button>
                </div>
              );
            })}
            {erroIngressos && <p className="rounded-lg bg-fight/15 px-3 py-2 text-sm text-red-300">{erroIngressos}</p>}
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">Prévia da cobrança</p>
            <div className="rounded-2xl bg-panel-2 p-4 text-center">
              <p className="font-semibold">{form.nome || 'Nome do evento'}</p>
              <p className="text-xs text-muted">{textoData(`${form.dia}T${form.hora || '00:00'}:00`) || 'Data a definir'}</p>
              <p className="mt-3 font-display text-4xl text-gold">{valor > 0 ? brl(valor) : 'R$ —'}</p>
              <p className="mt-2 text-xs text-zinc-400">Pagar para <b className="text-zinc-200">{form.recebedor || '—'}</b></p>
              <p className="mt-1 break-all font-mono text-xs text-zinc-400">{tipo.label}: {chave.ok ? chave.valor : form.chavePix || '—'}</p>
            </div>
            <div className="mt-3 rounded-2xl bg-panel-2 p-4 text-center">
              <p className="text-xs text-muted">Ingresso na página pública</p>
              <p className="mt-1 font-display text-4xl text-gold">{precoPublico ? brl(precoPublico.valor) : 'Esgotado'}</p>
              {precoPublico && <p className="text-xs text-zinc-400">{precoPublico.lote}</p>}
            </div>
          </Card>
          <Card className="flex gap-3 border-amber-400/30 bg-amber-400/5 p-4 text-xs text-amber-200">
            <Icon name="alert" className="size-4 shrink-0" />
            <p>{store.demo ? 'No modo demonstração a configuração fica salva só neste navegador.' : 'A configuração fica salva no banco de dados do evento.'} A chave é exibida nas cobranças; cobranças e baixas automáticas dependem de integrar um provedor de pagamento.</p>
          </Card>
          <div className="flex gap-2">
            {store.demo && <Button type="button" variant="ghost" onClick={restaurar}>Restaurar padrão</Button>}
            <Button type="submit" variant="success" className="flex-1" disabled={salvando}><Icon name="check" className="size-4" /> {salvando ? 'Salvando…' : 'Salvar'}</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
