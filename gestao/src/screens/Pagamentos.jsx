import { useState } from 'react';
import { PAGAMENTOS_INFO } from '../lib/data.js';
import { TIPOS_CHAVE } from '../lib/pix.js';
import { Avatar, Badge, Button, Card, Icon, PageTitle, Select, brl, inputCls, nomeExibido } from '../components/ui.jsx';
import { STATUS_INSCRICAO } from './EditarAtleta.jsx';

const COR_INSCRICAO = { pago: 'green', pendente: 'yellow', expirado: 'red' };
const STATUS_PEDIDO = [
  { id: 'pago', label: 'Pago' },
  { id: 'pendente', label: 'Aguardando Pix' },
  { id: 'cancelado', label: 'Cancelado' },
];
const COR_PEDIDO = { pago: 'green', pendente: 'yellow', cancelado: 'red' };

const SELECT_COR = {
  green: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  yellow: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  red: 'border-fight/40 bg-fight/10 text-red-300',
};

// Select colorido para trocar o status de um pagamento.
function StatusSelect({ valor, opcoes, cores, onChange, rotulo }) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-label={rotulo}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-gold/30 ${SELECT_COR[cores[valor]]}`}
    >
      {opcoes.map((o) => <option key={o.id} value={o.id} className="bg-panel text-zinc-100">{o.label}</option>)}
    </select>
  );
}

function Kpi({ label, valor, cor = 'text-white' }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 font-display text-3xl ${cor}`}>{valor}</p>
    </Card>
  );
}

function Filtros({ opcoes, valor, onChange }) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {opcoes.map(([id, label, n]) => (
        <button key={id} onClick={() => onChange(id)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${valor === id ? 'bg-fight text-white' : 'bg-panel-2 text-zinc-300 hover:bg-line'}`}>
          {label} <span className="opacity-60">{n}</span>
        </button>
      ))}
    </div>
  );
}

const semAcento = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function Busca({ valor, onChange, placeholder, children }) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
        <input value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} pl-9`} />
        {valor && <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-white" aria-label="Limpar busca"><Icon name="x" className="size-4" /></button>}
      </div>
      {children}
    </div>
  );
}

const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');

// ───────── Inscrições dos atletas ─────────

function Inscricoes({ store }) {
  const { atletas, setAtletas, evento } = store;
  const [filtro, setFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [academia, setAcademia] = useState('');
  const [cobranca, setCobranca] = useState(null); // atleta
  const [copiado, setCopiado] = useState(null);

  const academias = [...new Set(atletas.map((a) => a.academia).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'pt-BR'));
  const termo = semAcento(busca.trim().replace(/^#/, ''));
  // Busca e academia valem para os contadores dos filtros; o status filtra a lista.
  const base = atletas.filter((a) => (!academia || a.academia === academia)
    && (!termo || semAcento(`${a.nome} ${a.academia} ${a.professor ?? ''} ${String(a.id).padStart(4, '0')}`).includes(termo)));
  const conta = (s) => base.filter((a) => a.pagamento === s).length;
  const contaTodos = (s) => atletas.filter((a) => a.pagamento === s).length;
  const lista = base.filter((a) => !filtro || a.pagamento === filtro);

  const mudar = (a, pagamento) => {
    const anterior = a.pagamento;
    setAtletas((l) => l.map((x) => (x.id === a.id ? { ...x, pagamento, pagoEm: pagamento === 'pago' ? new Date().toISOString() : null } : x)));
    store.remoto(() => store.db.definirPagamentoAtleta(a.id, pagamento))
      .catch(() => setAtletas((l) => l.map((x) => (x.id === a.id ? { ...x, pagamento: anterior } : x))));
    if (cobranca?.id === a.id) setCobranca(null);
  };

  const tipoChave = TIPOS_CHAVE.find((t) => t.id === evento.tipoChave)?.label ?? 'Chave';
  const mensagem = cobranca
    ? `Olá, ${nomeExibido(cobranca)}! Inscrição no ${evento.nome}: ${brl(evento.inscricao)}.\nPix (${tipoChave}): ${evento.chavePix}\nRecebedor: ${evento.recebedor}\nDepois de pagar, envie o comprovante por aqui. Obrigado!`
    : '';
  const copiar = (texto, qual) => { navigator.clipboard?.writeText(texto).catch(() => {}); setCopiado(qual); };

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Recebido" valor={brl(contaTodos('pago') * evento.inscricao)} cor="text-emerald-400" />
        <Kpi label="A receber" valor={brl((atletas.length - contaTodos('pago')) * evento.inscricao)} cor="text-amber-300" />
        <Kpi label="Pagas" valor={contaTodos('pago')} />
        <Kpi label="Aguardando / expiradas" valor={`${contaTodos('pendente')} / ${contaTodos('expirado')}`} />
      </div>

      <Busca valor={busca} onChange={setBusca} placeholder="Buscar atleta, academia ou nº da inscrição">
        <Select value={academia} onChange={setAcademia} className="sm:w-56">
          <option value="">Todas as academias</option>
          {academias.map((x) => <option key={x}>{x}</option>)}
        </Select>
      </Busca>
      <Filtros
        valor={filtro}
        onChange={setFiltro}
        opcoes={[['', 'Todas', base.length], ['pago', 'Pagas', conta('pago')], ['pendente', 'Aguardando', conta('pendente')], ['expirado', 'Expiradas', conta('expirado')]]}
      />

      <Card className="divide-y divide-line">
        {lista.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:flex-nowrap">
            <Avatar atleta={a} corner={a.sexo === 'Feminino' ? 'red' : 'blue'} size="size-10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{nomeExibido(a)}</p>
              <p className="truncate text-xs text-muted">
                <span className="sm:hidden">{brl(evento.inscricao)} · </span>{a.academia} · {a.pagamento === 'pago' ? `pago ${a.pagoEm ? dataHora(a.pagoEm) : PAGAMENTOS_INFO[a.id] ?? ''}` : `inscrição #${String(a.id).padStart(4, '0')}`}
              </p>
            </div>
            <span className="hidden font-display text-xl text-zinc-300 sm:inline">{brl(evento.inscricao)}</span>
            <StatusSelect valor={a.pagamento} opcoes={STATUS_INSCRICAO} cores={COR_INSCRICAO} onChange={(v) => mudar(a, v)} rotulo={`Status da inscrição de ${nomeExibido(a)}`} />
            {a.pagamento !== 'pago' && (
              <Button variant="ghost" className="w-full py-1.5 sm:w-auto" onClick={() => { setCobranca(a); setCopiado(null); }}>
                <Icon name="pix" className="size-4 text-emerald-400" /> Cobrar
              </Button>
            )}
          </div>
        ))}
        {lista.length === 0 && <p className="p-6 text-center text-sm text-muted">Nenhuma inscrição encontrada com esses filtros.</p>}
      </Card>

      {cobranca && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 sm:place-items-center" onClick={() => setCobranca(null)}>
          <div className="w-full max-w-sm rounded-t-3xl border border-line bg-panel p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl tracking-wide">Cobrar inscrição</h3>
              <button onClick={() => setCobranca(null)} className="rounded-lg p-1 hover:bg-panel-2" aria-label="Fechar"><Icon name="x" /></button>
            </div>
            <p className="font-semibold">{nomeExibido(cobranca)}</p>
            <p className="font-display text-4xl text-gold">{brl(evento.inscricao)}</p>
            <div className="mt-3 rounded-xl bg-panel-2 p-3 text-sm">
              <p className="text-xs text-muted">Pix ({tipoChave}) · {evento.recebedor}</p>
              <p className="break-all font-mono">{evento.chavePix}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => copiar(evento.chavePix, 'chave')}><Icon name="copy" className="size-4" /> {copiado === 'chave' ? 'Copiada!' : 'Copiar chave'}</Button>
              <Button variant="ghost" onClick={() => copiar(mensagem, 'msg')}><Icon name="copy" className="size-4" /> {copiado === 'msg' ? 'Copiada!' : 'Mensagem'}</Button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">"Mensagem" copia um texto pronto para enviar ao atleta pelo WhatsApp.</p>
            <Button variant="success" className="mt-4 w-full" onClick={() => mudar(cobranca, 'pago')}><Icon name="check" className="size-4" /> Recebi o Pix · marcar pago</Button>
          </div>
        </div>
      )}
    </>
  );
}

// ───────── Pedidos de ingresso do público ─────────

const ORDENS = {
  recentes: (x, y) => String(y.criadoEm).localeCompare(String(x.criadoEm)),
  antigos: (x, y) => String(x.criadoEm).localeCompare(String(y.criadoEm)),
  nome: (x, y) => x.compradorNome.localeCompare(y.compradorNome, 'pt-BR'),
  valor: (x, y) => y.total - x.total,
};

function Ingressos({ store }) {
  const { pedidos, setPedidos, setBilhetes } = store;
  const [filtro, setFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('recentes');
  const [aberto, setAberto] = useState(null);

  const termo = semAcento(busca.trim().replace(/^#/, ''));
  // Busca pelo comprador, por qualquer pessoa do pedido, e-mail ou número do pedido.
  const base = pedidos.filter((p) => !termo || semAcento(
    `${p.id} ${p.compradorNome} ${p.compradorEmail ?? ''} ${p.bilhetes.map((b) => `${b.nome} ${b.codigo}`).join(' ')}`,
  ).includes(termo));
  const conta = (s) => base.filter((p) => p.pagamento === s).length;
  const doStatus = (s) => pedidos.filter((p) => p.pagamento === s);
  const soma = (s) => doStatus(s).reduce((t, p) => t + p.total, 0);
  const lista = base.filter((p) => !filtro || p.pagamento === filtro).sort(ORDENS[ordem]);

  const aplicar = (p, pagamento) => {
    setPedidos((l) => l.map((x) => (x.id === p.id ? { ...x, pagamento, pagoEm: pagamento === 'pago' ? new Date().toISOString() : null } : x)));
    setBilhetes((l) => l.map((b) => (b.pedidoId === p.id ? { ...b, pagamento } : b)));
  };
  const mudar = (p, pagamento) => {
    if (pagamento === 'cancelado' && !window.confirm(`Cancelar o pedido #${p.id}? Os ${p.bilhetes.length} ingresso(s) deixam de valer na portaria.`)) return;
    const anterior = p.pagamento;
    aplicar(p, pagamento);
    store.remoto(() => store.db.definirPagamentoPedido(p.id, pagamento)).catch(() => aplicar(p, anterior));
  };

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Recebido" valor={brl(soma('pago'))} cor="text-emerald-400" />
        <Kpi label="Aguardando Pix" valor={brl(soma('pendente'))} cor="text-amber-300" />
        <Kpi label="Pedidos pagos" valor={doStatus('pago').length} />
        <Kpi label="Aguardando / cancelados" valor={`${doStatus('pendente').length} / ${doStatus('cancelado').length}`} />
      </div>

      <Busca valor={busca} onChange={setBusca} placeholder="Buscar nome, e-mail ou nº do pedido">
        <Select value={ordem} onChange={setOrdem} className="sm:w-48">
          <option value="recentes">Mais recentes</option>
          <option value="antigos">Mais antigos</option>
          <option value="nome">Nome (A–Z)</option>
          <option value="valor">Maior valor</option>
        </Select>
      </Busca>
      <Filtros
        valor={filtro}
        onChange={setFiltro}
        opcoes={[['', 'Todos', base.length], ['pendente', 'Aguardando', conta('pendente')], ['pago', 'Pagos', conta('pago')], ['cancelado', 'Cancelados', conta('cancelado')]]}
      />

      <Card className="divide-y divide-line">
        {lista.map((p) => (
          <div key={p.id} className="p-3">
            <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
              <button onClick={() => setAberto(aberto === p.id ? null : p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={aberto === p.id}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-panel-2 text-gold"><Icon name="ticket" /></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{p.compradorNome}</span>
                  <span className="block truncate text-xs text-muted">
                    <span className="sm:hidden">{brl(p.total)} · </span>Pedido #{p.id} · {p.bilhetes.length} ingresso(s) · {dataHora(p.criadoEm)}{p.compradorEmail ? ` · ${p.compradorEmail}` : ''}
                  </span>
                </span>
                <Icon name={aberto === p.id ? 'up' : 'down'} className="size-4 shrink-0 text-zinc-500" />
              </button>
              <span className="hidden font-display text-xl text-zinc-300 sm:inline">{brl(p.total)}</span>
              <StatusSelect valor={p.pagamento} opcoes={STATUS_PEDIDO} cores={COR_PEDIDO} onChange={(v) => mudar(p, v)} rotulo={`Status do pedido ${p.id}`} />
            </div>
            {aberto === p.id && (
              <ul className="mt-3 space-y-1.5 rounded-xl bg-panel-2/70 p-3 text-sm">
                {p.bilhetes.map((b) => (
                  <li key={b.codigo} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{b.nome} <span className="text-zinc-500">· {b.idade} anos</span></span>
                    <span className="text-xs text-zinc-400">{b.tipo} · <span className="font-mono text-gold">{b.codigo}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {lista.length === 0 && <p className="p-6 text-center text-sm text-muted">Nenhum pedido encontrado com esses filtros.</p>}
      </Card>
      <p className="mt-3 text-xs text-zinc-500">
        Na portaria, quem tem pedido aguardando aparece na lista “Não pagaram”; pedidos cancelados não aparecem. Cancelar não devolve o ingresso ao estoque.
      </p>
    </>
  );
}

export default function Pagamentos({ store }) {
  const [aba, setAba] = useState('inscricoes');
  const pendentesIngresso = store.pedidos.filter((p) => p.pagamento === 'pendente').length;
  const pendentesInscricao = store.atletas.filter((a) => a.pagamento !== 'pago').length;

  return (
    <>
      <PageTitle kicker="Pix" title="Pagamentos" />
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-panel p-1 sm:inline-grid sm:w-auto">
        {[
          ['inscricoes', 'Inscrições', 'atletas', pendentesInscricao],
          ['ingressos', 'Ingressos', 'público', pendentesIngresso],
        ].map(([id, label, sub, n]) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`rounded-xl px-4 py-2 text-left text-sm font-semibold transition sm:min-w-44 ${aba === id ? 'bg-fight text-white' : 'text-zinc-300 hover:bg-panel-2'}`}
          >
            {label} <span className="font-normal opacity-70">· {sub}</span>
            {n > 0 && <Badge color={aba === id ? 'gold' : 'yellow'} className="ml-2">{n}</Badge>}
          </button>
        ))}
      </div>
      {aba === 'inscricoes' ? <Inscricoes store={store} /> : <Ingressos store={store} />}
    </>
  );
}
