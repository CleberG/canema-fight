import { useState } from 'react';
import { PAGAMENTOS_INFO } from '../lib/data.js';
import { Avatar, Badge, Button, Card, FakeQR, Icon, PageTitle, brl, nomeExibido } from '../components/ui.jsx';

const STATUS = {
  pago: { cor: 'green', label: 'Pago' },
  pendente: { cor: 'yellow', label: 'Aguardando Pix' },
  expirado: { cor: 'red', label: 'Pix expirado' },
};

export default function Pagamentos({ store }) {
  const { atletas, setAtletas, evento } = store;
  const [filtro, setFiltro] = useState('');
  const [cobranca, setCobranca] = useState(null); // atleta
  const [copiado, setCopiado] = useState(false);

  const conta = (s) => atletas.filter((a) => a.pagamento === s).length;
  const lista = atletas.filter((a) => !filtro || a.pagamento === filtro);
  const arrecadado = conta('pago') * evento.inscricao;

  const marcarPago = (id) => {
    setAtletas((l) => l.map((a) => (a.id === id ? { ...a, pagamento: 'pago' } : a)));
    setCobranca(null);
  };

  const copiaECola = cobranca ? `00020126PIX.FICTICIO.CANEMA${String(cobranca.id).padStart(4, '0')}5204000053039865406${evento.inscricao.toFixed(2)}5802BR6304DEMO` : '';

  return (
    <>
      <PageTitle kicker={`Inscrição ${brl(evento.inscricao)} por atleta`} title="Pagamentos Pix" />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4"><p className="text-xs uppercase tracking-wider text-muted">Arrecadado</p><p className="mt-1 font-display text-3xl text-emerald-400">{brl(arrecadado)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wider text-muted">A receber</p><p className="mt-1 font-display text-3xl text-amber-300">{brl((atletas.length - conta('pago')) * evento.inscricao)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wider text-muted">Pagos</p><p className="mt-1 font-display text-3xl">{conta('pago')}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wider text-muted">Pendentes / expirados</p><p className="mt-1 font-display text-3xl">{conta('pendente')} / {conta('expirado')}</p></Card>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[['', 'Todos', atletas.length], ['pago', 'Pagos', conta('pago')], ['pendente', 'Pendentes', conta('pendente')], ['expirado', 'Expirados', conta('expirado')]].map(([id, label, n]) => (
          <button key={id} onClick={() => setFiltro(id)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${filtro === id ? 'bg-fight text-white' : 'bg-panel-2 text-zinc-300 hover:bg-line'}`}>
            {label} <span className="opacity-60">{n}</span>
          </button>
        ))}
      </div>

      <Card className="divide-y divide-line">
        {lista.map((a) => {
          const s = STATUS[a.pagamento];
          return (
            <div key={a.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
              <Avatar atleta={a} corner={a.sexo === 'Feminino' ? 'red' : 'blue'} size="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{nomeExibido(a)}</p>
                <p className="truncate text-xs text-muted">{a.academia} · {a.pagamento === 'pago' ? `Pix recebido ${PAGAMENTOS_INFO[a.id] ?? 'hoje'}` : `Inscrição #${String(a.id).padStart(4, '0')}`}</p>
              </div>
              <span className="font-display text-xl text-zinc-300">{brl(evento.inscricao)}</span>
              <Badge color={s.cor}>{s.label}</Badge>
              {a.pagamento !== 'pago' && (
                <Button variant="ghost" className="w-full py-1.5 sm:w-auto" onClick={() => { setCobranca(a); setCopiado(false); }}>
                  <Icon name="pix" className="size-4 text-emerald-400" /> {a.pagamento === 'expirado' ? 'Gerar novo Pix' : 'Ver cobrança'}
                </Button>
              )}
            </div>
          );
        })}
      </Card>

      {cobranca && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 sm:place-items-center" onClick={() => setCobranca(null)}>
          <div className="w-full max-w-sm rounded-t-3xl border border-line bg-panel p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl tracking-wide">Cobrança Pix</h3>
              <button onClick={() => setCobranca(null)} className="rounded-lg p-1 hover:bg-panel-2" aria-label="Fechar"><Icon name="x" /></button>
            </div>
            <div className="flex flex-col items-center text-center">
              <FakeQR texto={copiaECola} className="size-44" />
              <p className="mt-3 font-semibold">{nomeExibido(cobranca)}</p>
              <p className="font-display text-3xl text-gold">{brl(evento.inscricao)}</p>
              <p className="text-xs text-muted">Recebedor: {evento.recebedor}</p>
              <p className="break-all text-xs text-muted">Chave Pix: {evento.chavePix} · vence em 24h</p>
            </div>
            <div className="mt-4 rounded-xl bg-panel-2 p-2 font-mono text-[11px] break-all text-zinc-400">{copiaECola}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => { navigator.clipboard?.writeText(copiaECola).catch(() => {}); setCopiado(true); }}>
                <Icon name="copy" className="size-4" /> {copiado ? 'Copiado!' : 'Copiar código'}
              </Button>
              <Button variant="success" onClick={() => marcarPago(cobranca.id)}><Icon name="check" className="size-4" /> Marcar pago</Button>
            </div>
            <p className="mt-3 text-center text-[11px] text-zinc-500">Protótipo: QR e código são fictícios.</p>
          </div>
        </div>
      )}
    </>
  );
}
