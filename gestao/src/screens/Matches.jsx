import { useState } from 'react';
import { Avatar, Badge, Button, Card, Icon, PageTitle, formatarTreino, nomeExibido } from '../components/ui.jsx';

const REGRAS = [
  'Mesmo sexo',
  'Até 2 kg de diferença',
  'Menor nunca contra adulto',
  'Menores: até 2 anos de diferença',
  'Experiência próxima (lutas, luvões, treino)',
  'Nunca a mesma academia',
];

function Pontuacao({ valor }) {
  const cor = valor >= 80 ? '#34d399' : valor >= 65 ? '#f2b632' : '#e5262f';
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-20 place-items-center">
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} stroke="#2a2a36" strokeWidth="6" fill="none" />
        <circle cx="32" cy="32" r={r} stroke={cor} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - valor / 100)} />
      </svg>
      <span className="font-display text-3xl leading-none" style={{ color: cor }}>{valor}</span>
    </div>
  );
}

function Linha({ label, a, b, destaque }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-line/60 py-1.5 text-sm">
      <span className={`text-right ${destaque === 'a' ? 'font-semibold text-white' : 'text-zinc-300'}`}>{a}</span>
      <span className="w-20 text-center text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
      <span className={destaque === 'b' ? 'font-semibold text-white' : 'text-zinc-300'}>{b}</span>
    </div>
  );
}

function MatchCard({ s, A, B, onAprovar, onRecusar }) {
  const [detalhe, setDetalhe] = useState(false);
  const maior = (x, y) => (x > y ? 'a' : y > x ? 'b' : null);
  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-fight via-gold to-corner-blue" />
      <div className="p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex min-w-0 flex-col items-center text-center">
            <Avatar atleta={A} corner="red" size="size-14" />
            <p className="mt-2 w-full truncate text-sm font-semibold">{nomeExibido(A)}</p>
            <p className="w-full truncate text-xs text-muted">{A.academia}</p>
          </div>
          <Pontuacao valor={s.pontuacao} />
          <div className="flex min-w-0 flex-col items-center text-center">
            <Avatar atleta={B} corner="blue" size="size-14" />
            <p className="mt-2 w-full truncate text-sm font-semibold">{nomeExibido(B)}</p>
            <p className="w-full truncate text-xs text-muted">{B.academia}</p>
          </div>
        </div>

        <div className="mt-4">
          <Linha label="Sexo" a={A.sexo} b={B.sexo} />
          <Linha label="Idade" a={`${A.idade} anos`} b={`${B.idade} anos`} />
          <Linha label="Peso" a={`${A.peso} kg`} b={`${B.peso} kg`} destaque={maior(A.peso, B.peso)} />
          <Linha label="Altura" a={`${A.altura} m`} b={`${B.altura} m`} />
          <Linha label="Lutas" a={A.lutas} b={B.lutas} destaque={maior(A.lutas, B.lutas)} />
          <Linha label="Luvões" a={A.luvoes} b={B.luvoes} destaque={maior(A.luvoes, B.luvoes)} />
          <Linha label="Treino" a={formatarTreino(A.tempoTreino)} b={formatarTreino(B.tempoTreino)} destaque={maior(A.tempoTreino, B.tempoTreino)} />
        </div>

        <button onClick={() => setDetalhe((v) => !v)} className="mt-2 flex items-center gap-1 text-xs text-gold hover:underline">
          <Icon name={detalhe ? 'up' : 'down'} className="size-3.5" /> Como a pontuação foi calculada
        </button>
        {detalhe && (
          <div className="mt-2 space-y-1.5">
            {s.detalhes.map((d) => (
              <div key={d.label} className="text-xs">
                <div className="flex justify-between text-zinc-400"><span>{d.label} · {d.info}</span><span>{Math.round(d.pontos)}/{d.max}</span></div>
                <div className="mt-0.5 h-1 rounded-full bg-panel-2"><div className="h-full rounded-full bg-gold" style={{ width: `${(d.pontos / d.max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="danger" onClick={onRecusar}><Icon name="x" className="size-4" /> Recusar</Button>
          <Button variant="success" onClick={onAprovar}><Icon name="check" className="size-4" /> Aprovar</Button>
        </div>
      </div>
    </Card>
  );
}

export default function Matches({ store }) {
  const { sugestoes, atletas, lutas, setLutas, setRecusados, setCard } = store;
  const [aviso, setAviso] = useState(null);
  const porId = Object.fromEntries(atletas.map((a) => [a.id, a]));

  const { remoto, db, eventoId } = store;
  const aprovar = (s) => {
    remoto(() => db.decidirLuta(eventoId, s, 'aprovada')).catch(() => setLutas((l) => l.filter((x) => x.id !== s.id)));
    setLutas((l) => [...l, s]);
    setAviso({ tipo: 'ok', texto: `Luta aprovada: ${nomeExibido(porId[s.a])} × ${nomeExibido(porId[s.b])}. Já está disponível na montagem do card.` });
  };
  const recusar = (s) => {
    remoto(() => db.decidirLuta(eventoId, s, 'recusada')).catch(() => setRecusados((r) => r.filter((x) => x !== s.id)));
    setRecusados((r) => [...r, s.id]);
    setAviso({ tipo: 'x', texto: 'Match recusado. Os atletas continuam disponíveis para outras sugestões.' });
  };
  const desfazer = (id) => {
    const luta = lutas.find((x) => x.id === id);
    remoto(() => db.desfazerLuta(eventoId, luta)).catch(() => {});
    setLutas((l) => l.filter((x) => x.id !== id));
    if (store.card.includes(id)) setCard((c) => c.filter((x) => x !== id));
  };

  return (
    <>
      <PageTitle kicker={`${sugestoes.length} sugestões · ${lutas.length} aprovadas`} title="Matches sugeridos" />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {REGRAS.map((r) => <Badge key={r} color="gray"><Icon name="check" className="size-3 text-emerald-400" /> {r}</Badge>)}
      </div>

      {aviso && (
        <div className={`mb-4 flex items-center gap-3 rounded-2xl border p-3 text-sm ${aviso.tipo === 'ok' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-line bg-panel'}`}>
          <Icon name={aviso.tipo === 'ok' ? 'check' : 'x'} className={aviso.tipo === 'ok' ? 'text-emerald-400' : 'text-zinc-400'} />
          <span className="flex-1">{aviso.texto}</span>
          {aviso.tipo === 'ok' && <button onClick={() => store.ir('card')} className="text-xs font-semibold text-gold">Montar card →</button>}
        </div>
      )}

      {sugestoes.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">Sem sugestões no momento. Cadastre mais atletas em <button className="text-gold" onClick={() => store.ir('ficha')}>Colar ficha</button>.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sugestoes.map((s) => (
            <MatchCard key={s.id} s={s} A={porId[s.a]} B={porId[s.b]} onAprovar={() => aprovar(s)} onRecusar={() => recusar(s)} />
          ))}
        </div>
      )}

      {lutas.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-2xl tracking-wide">Aprovadas</h2>
          <div className="space-y-2">
            {lutas.map((l) => (
              <Card key={l.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="font-display text-xl text-gold">{l.pontuacao}</span>
                <span className="flex-1 truncate"><span className="text-red-300">{nomeExibido(porId[l.a])}</span> × <span className="text-blue-300">{nomeExibido(porId[l.b])}</span></span>
                <button onClick={() => desfazer(l.id)} className="text-xs text-zinc-500 hover:text-fight">Desfazer</button>
              </Card>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
