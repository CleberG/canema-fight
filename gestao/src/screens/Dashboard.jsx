import { Badge, Card, Icon, PageTitle, nomeExibido } from '../components/ui.jsx';
import { totalDe, vendidosDe } from '../lib/data.js';

function Kpi({ label, valor, total, cor = 'text-white', icon, sub }) {
  const pct = total ? Math.min(100, Math.round((valor / total) * 100)) : null;
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
        <Icon name={icon} className="size-4 text-zinc-500" />
      </div>
      <p className={`mt-2 font-display text-4xl leading-none tracking-wide ${cor}`}>
        {valor}{total != null && <span className="text-xl text-zinc-500"> / {total}</span>}
      </p>
      {pct != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel-2">
          <div className="h-full rounded-full bg-gradient-to-r from-fight to-gold" style={{ width: `${pct}%` }} />
        </div>
      )}
      {sub && <p className="mt-2 text-xs text-muted">{sub}</p>}
    </Card>
  );
}

export default function Dashboard({ store }) {
  const { evento, atletas, lutas, sugestoes, ingressos, checkins, ir } = store;
  const pagos = atletas.filter((a) => a.pagamento === 'pago').length;
  const pendentes = atletas.length - pagos;
  const vendidos = ingressos.reduce((s, i) => s + vendidosDe(i), 0);
  const capacidade = ingressos.reduce((s, i) => s + totalDe(i), 0);
  const porId = Object.fromEntries(atletas.map((a) => [a.id, a]));
  const dias = Math.max(0, Math.ceil((new Date(evento.data) - new Date()) / 86400000));

  const atalhos = [
    { r: 'ficha', label: 'Colar ficha', icon: 'paste', desc: 'Cadastrar atleta do WhatsApp' },
    { r: 'matches', label: 'Ver matches', icon: 'swords', desc: `${sugestoes.length} sugestões` },
    { r: 'card', label: 'Montar card', icon: 'layers', desc: `${lutas.length} lutas aprovadas` },
    { r: 'pagamentos', label: 'Cobrar Pix', icon: 'pix', desc: `${pendentes} pendentes` },
    { r: 'portaria', label: 'Portaria', icon: 'qr', desc: 'Leitor de ingressos' },
    { r: 'publico', label: 'Página pública', icon: 'ticket', desc: 'Venda de ingressos' },
  ];

  return (
    <>
      <PageTitle kicker={`${evento.dataTexto} · ${evento.local}`} title={evento.nome}>
        <Badge color="gold"><Icon name="calendar" className="size-3.5" /> faltam {dias} dias</Badge>
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Atletas" valor={atletas.length} icon="users" sub={`${atletas.filter((a) => a.idade < 18).length} menores`} />
        <Kpi label="Lutas confirmadas" valor={lutas.length} icon="swords" cor="text-gold" sub={`${store.card.length} no card`} />
        <Kpi label="Inscrições pagas" valor={pagos} total={atletas.length} icon="check" cor="text-emerald-400" />
        <Kpi label="Pendentes" valor={pendentes} icon="alert" cor="text-amber-300" sub="Pix aguardando" />
        <Kpi label="Ingressos" valor={vendidos} total={capacidade} icon="ticket" />
        <Kpi label="Check-ins" valor={checkins} total={vendidos} icon="qr" cor="text-fight" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 font-display text-2xl tracking-wide">
            <Icon name="bell" className="size-5 text-fight" /> Alertas
          </h2>
          <div className="space-y-3">
            {sugestoes.slice(0, 3).map((s) => (
              <button key={s.id} onClick={() => ir('matches')} className="flex w-full items-center gap-3 rounded-2xl border border-fight/30 bg-fight/10 p-3 text-left transition hover:bg-fight/15">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-fight text-white"><Icon name="swords" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">Novo match: {nomeExibido(porId[s.a])} × {nomeExibido(porId[s.b])}</span>
                  <span className="block truncate text-xs text-zinc-400">{porId[s.a].sexo} · {porId[s.a].peso} kg × {porId[s.b].peso} kg</span>
                </span>
                <span className="font-display text-2xl text-gold">{s.pontuacao}</span>
              </button>
            ))}
            {sugestoes.length === 0 && <Card className="p-4 text-sm text-muted">Nenhum match novo no momento.</Card>}
            {pendentes > 0 && (
              <button onClick={() => ir('pagamentos')} className="flex w-full items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-left hover:bg-amber-400/15">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-400 text-ink"><Icon name="pix" /></span>
                <span className="flex-1 text-sm"><b>{pendentes} inscrições</b> com Pix pendente ou expirado</span>
                <Icon name="arrowLeft" className="size-4 rotate-180 text-amber-300" />
              </button>
            )}
            {ingressos.filter((i) => vendidosDe(i) / totalDe(i) > 0.85).map((i) => (
              <div key={i.id} className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold text-ink"><Icon name="ticket" /></span>
                <span className="flex-1 text-sm"><b>{i.nome}</b> quase esgotado: restam {totalDe(i) - vendidosDe(i)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-3 font-display text-2xl tracking-wide">Atalhos</h2>
          <div className="grid grid-cols-2 gap-3">
            {atalhos.map((a) => (
              <button key={a.r} onClick={() => ir(a.r)} className="group rounded-2xl border border-line bg-panel p-4 text-left transition hover:border-gold/50 hover:bg-panel-2">
                <Icon name={a.icon} className="size-6 text-gold transition group-hover:scale-110" />
                <p className="mt-3 text-sm font-semibold">{a.label}</p>
                <p className="text-xs text-muted">{a.desc}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
