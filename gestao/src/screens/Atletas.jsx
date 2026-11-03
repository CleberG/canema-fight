import { useMemo, useState } from 'react';
import { Avatar, Badge, Card, Icon, PageTitle, Select, formatarTreino, inputCls, instagramExibido, nomeExibido } from '../components/ui.jsx';

const PESOS = [
  { id: '', label: 'Todos os pesos' },
  { id: '0-50', label: 'Até 50 kg' },
  { id: '50-60', label: '50–60 kg' },
  { id: '60-70', label: '60–70 kg' },
  { id: '70-80', label: '70–80 kg' },
  { id: '80-999', label: '80+ kg' },
];
const IDADES = [
  { id: '', label: 'Todas as idades' },
  { id: 'menor', label: 'Menores (<18)' },
  { id: '18-25', label: '18–25' },
  { id: '26-99', label: '26+' },
];
const EXPERIENCIAS = [
  { id: '', label: 'Toda experiência' },
  { id: 'estreante', label: 'Estreante (0 lutas)' },
  { id: '1-3', label: '1–3 lutas' },
  { id: '4-99', label: '4+ lutas' },
];

const PAG = { pago: ['green', 'Pago'], pendente: ['yellow', 'Pendente'], expirado: ['red', 'Expirado'] };

export default function Atletas({ store }) {
  const { atletas, emLuta } = store;
  const [busca, setBusca] = useState('');
  const [sexo, setSexo] = useState('');
  const [peso, setPeso] = useState('');
  const [idade, setIdade] = useState('');
  const [exp, setExp] = useState('');
  const [status, setStatus] = useState('');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const entre = (v, faixa) => { const [a, b] = faixa.split('-').map(Number); return v >= a && v <= b; };

  const lista = useMemo(() => atletas.filter((a) => {
    if (busca && !`${a.nome} ${a.academia}`.toLowerCase().includes(busca.toLowerCase())) return false;
    if (sexo && a.sexo !== sexo) return false;
    if (peso && !entre(a.peso, peso)) return false;
    if (idade === 'menor' ? a.idade >= 18 : idade && !entre(a.idade, idade)) return false;
    if (exp === 'estreante' ? a.lutas > 0 : exp && !entre(a.lutas, exp)) return false;
    if (status === 'confirmado' && !emLuta.has(a.id)) return false;
    if (status === 'aguardando' && emLuta.has(a.id)) return false;
    if (['pago', 'pendente', 'expirado'].includes(status) && a.pagamento !== status) return false;
    return true;
  }), [atletas, busca, sexo, peso, idade, exp, status, emLuta]);

  const ativos = [sexo, peso, idade, exp, status].filter(Boolean).length;

  return (
    <>
      <PageTitle kicker={`${atletas.length} inscritos`} title="Atletas">
        <button onClick={() => store.ir('ficha')} className="rounded-xl bg-fight px-3 py-2 text-sm font-semibold text-white hover:bg-fight-dark">+ Colar ficha</button>
      </PageTitle>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome ou academia" className={`${inputCls} pl-9`} />
        </div>
        <button onClick={() => setFiltrosAbertos((v) => !v)} className={`flex items-center gap-2 rounded-xl border px-3 text-sm md:hidden ${ativos ? 'border-gold/60 text-gold' : 'border-line text-zinc-300'}`}>
          <Icon name="filter" className="size-4" /> {ativos || ''}
        </button>
      </div>

      <div className={`${filtrosAbertos ? 'grid' : 'hidden'} mb-4 grid-cols-2 gap-2 md:grid md:grid-cols-5`}>
        <Select value={sexo} onChange={setSexo}><option value="">Ambos os sexos</option><option>Feminino</option><option>Masculino</option></Select>
        <Select value={peso} onChange={setPeso}>{PESOS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</Select>
        <Select value={idade} onChange={setIdade}>{IDADES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</Select>
        <Select value={exp} onChange={setExp}>{EXPERIENCIAS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</Select>
        <Select value={status} onChange={setStatus} className="col-span-2 md:col-span-1">
          <option value="">Todos os status</option>
          <option value="confirmado">Luta confirmada</option>
          <option value="aguardando">Aguardando match</option>
          <option value="pago">Inscrição paga</option>
          <option value="pendente">Pix pendente</option>
          <option value="expirado">Pix expirado</option>
        </Select>
      </div>

      <p className="mb-3 text-xs text-muted">
        {lista.length} atleta(s) · <Icon name="alert" className="inline size-3.5" /> Sobrenome e Instagram de menores de 18 ficam ocultos.
      </p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((a) => {
          const insta = instagramExibido(a);
          const [cor, txt] = PAG[a.pagamento];
          return (
            <Card key={a.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar atleta={a} corner={a.sexo === 'Feminino' ? 'red' : 'blue'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{nomeExibido(a)}</p>
                  <p className="truncate text-xs text-muted">{a.academia}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{insta ?? (a.idade < 18 ? 'Instagram oculto (menor)' : '—')}</p>
                </div>
                {a.idade < 18 && <Badge color="blue">Menor</Badge>}
              </div>
              <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[['Idade', a.idade], ['Peso', `${a.peso}`], ['Lutas', a.lutas], ['Luvões', a.luvoes]].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-panel-2 py-1.5">
                    <dt className="text-[10px] uppercase tracking-wider text-zinc-500">{k}</dt>
                    <dd className="font-display text-xl leading-tight">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted">Treino: {formatarTreino(a.tempoTreino)}</span>
                <span className="ml-auto" />
                {emLuta.has(a.id) ? <Badge color="gold">Luta confirmada</Badge> : <Badge>Aguardando match</Badge>}
                <Badge color={cor}>{txt}</Badge>
              </div>
            </Card>
          );
        })}
      </div>
      {lista.length === 0 && <Card className="p-8 text-center text-sm text-muted">Nenhum atleta com esses filtros.</Card>}
    </>
  );
}
