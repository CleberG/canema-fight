import { useEffect, useMemo, useState } from 'react';
import { ATLETAS, BILHETES, CHECKINS_INICIAIS, EVENTO, INGRESSOS, PEDIDOS } from './lib/data.js';
import { sugerirMatches } from './lib/matching.js';
import { Icon, montarCardPublico } from './components/ui.jsx';
import * as db from './lib/db.js';
import Login from './screens/Login.jsx';
import Dashboard from './screens/Dashboard.jsx';
import ColarFicha from './screens/ColarFicha.jsx';
import Atletas from './screens/Atletas.jsx';
import Matches from './screens/Matches.jsx';
import MontagemCard from './screens/MontagemCard.jsx';
import Pagamentos from './screens/Pagamentos.jsx';
import PaginaPublica from './screens/PaginaPublica.jsx';
import Portaria from './screens/Portaria.jsx';
import Configuracoes from './screens/Configuracoes.jsx';
import AoVivo from './screens/AoVivo.jsx';
import TelaTV from './screens/TelaTV.jsx';

const CHAVE_EVENTO = 'canema.evento';

// Configurações ficam salvas neste navegador para sobreviver ao recarregar.
function eventoSalvo() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_EVENTO));
    return salvo ? { ...EVENTO, ...salvo } : EVENTO;
  } catch {
    return EVENTO;
  }
}

export const ROTAS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'ficha', label: 'Colar ficha', icon: 'paste' },
  { id: 'atletas', label: 'Atletas', icon: 'users' },
  { id: 'matches', label: 'Matches', icon: 'swords' },
  { id: 'card', label: 'Montar card', icon: 'layers' },
  { id: 'aovivo', label: 'Ao vivo', icon: 'play' },
  { id: 'pagamentos', label: 'Pagamentos', icon: 'pix' },
  { id: 'publico', label: 'Página pública', icon: 'ticket' },
  { id: 'tv', label: 'Tela da TV', icon: 'tv' },
  { id: 'portaria', label: 'Portaria', icon: 'qr' },
  { id: 'config', label: 'Configurações', icon: 'settings' },
];
const BOTTOM = ['dashboard', 'matches', 'card', 'aovivo'];
const TELA_CHEIA = ['publico', 'tv', 'portaria'];
const PUBLICAS = ['publico', 'tv']; // abrem sem login

function rotaAtual() {
  const r = window.location.hash.replace('#/', '');
  return r || 'login';
}

// Estado inicial: duas lutas já aprovadas e no card.
function estadoInicial() {
  const sugestoes = sugerirMatches(ATLETAS);
  const lutas = [];
  const usados = new Set();
  for (const s of sugestoes) {
    if (lutas.length === 2) break;
    if (usados.has(s.a) || usados.has(s.b)) continue;
    lutas.push(s);
    usados.add(s.a); usados.add(s.b);
  }
  return { lutas, card: lutas.map((l) => l.id) };
}

function Tela1({ texto, acao }) {
  return (
    <div className="stripe-bg grid min-h-screen place-items-center p-6 text-center">
      <div className="max-w-sm">
        <p className="text-sm text-zinc-300">{texto}</p>
        {acao && <button onClick={acao} className="mt-4 rounded-xl bg-fight px-4 py-2 text-sm font-semibold text-white">Sair e entrar com outra conta</button>}
      </div>
    </div>
  );
}

export default function App() {
  const [rota, setRota] = useState(rotaAtual);
  const [menuAberto, setMenuAberto] = useState(false);
  const inicial = useMemo(estadoInicial, []);
  const demo = db.modoDemo;
  const [evento, setEventoState] = useState(demo ? eventoSalvo : EVENTO);
  const [eventoId, setEventoId] = useState(db.EVENTO_ID);
  const [atletas, setAtletas] = useState(demo ? ATLETAS : []);
  const [lutas, setLutas] = useState(demo ? inicial.lutas : []); // matches aprovados
  const [recusados, setRecusados] = useState([]);
  const [card, setCardState] = useState(demo ? inicial.card : []); // ids de lutas na ordem do card
  const [cardPublicado, setCardPublicado] = useState(() => (demo ? montarCardPublico(inicial.card, inicial.lutas, ATLETAS) : []));
  const [bilhetes, setBilhetes] = useState(demo ? BILHETES : []);
  const [pedidos, setPedidos] = useState(demo ? PEDIDOS : []);
  const [checkins, setCheckins] = useState(demo ? CHECKINS_INICIAIS : 0);
  const [ingressos, setIngressos] = useState(demo ? INGRESSOS : []);
  const [aoVivo, setAoVivoState] = useState({}); // luta em andamento e resultados (lib/aovivo.js)

  // Supabase: sessão do organizador e carga dos dados
  const [sessao, setSessao] = useState(null);
  const [authPronto, setAuthPronto] = useState(demo);
  const [carga, setCarga] = useState({ estado: demo ? 'ok' : 'vazio', erro: null });
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    const on = () => { setRota(rotaAtual()); setMenuAberto(false); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  useEffect(() => {
    if (demo) return undefined;
    db.supabase.auth.getSession().then(({ data }) => { setSessao(data.session); setAuthPronto(true); });
    const { data } = db.supabase.auth.onAuthStateChange((_evento, s) => setSessao(s));
    return () => data.subscription.unsubscribe();
  }, [demo]);

  const usuario = sessao?.user?.id;
  useEffect(() => {
    if (demo || !usuario) return;
    setCarga({ estado: 'carregando', erro: null });
    db.carregarOrganizador()
      .then((d) => {
        setEventoId(d.eventoId); setEventoState(d.evento); setAtletas(d.atletas); setLutas(d.lutas);
        setRecusados(d.recusados); setCardState(d.card); setCardPublicado(d.cardPublico);
        setBilhetes(d.bilhetes); setPedidos(d.pedidos); setCheckins(d.checkins); setIngressos(d.ingressos); setAoVivoState(d.aoVivo);
        setCarga({ estado: 'ok', erro: null });
      })
      .catch((e) => setCarga({ estado: 'erro', erro: e.message }));
  }, [demo, usuario]);

  // Visitante sem login: só os dados públicos do evento
  useEffect(() => {
    if (demo || !authPronto || usuario || !PUBLICAS.includes(rota)) return;
    db.carregarPublico()
      .then((d) => { setEventoState(d.evento); setIngressos(d.ingressos); setCardPublicado(d.cardPublico); setAoVivoState(d.aoVivo); setCarga({ estado: 'publico', erro: null }); })
      .catch((e) => setCarga({ estado: 'erro', erro: e.message }));
  }, [demo, authPronto, usuario, rota]);

  // Lutas ao vivo: mudanças feitas em outro aparelho chegam na hora (Realtime).
  // Na página pública (30 s) e na TV (15 s) também confere de tempos em tempos, caso a conexão em tempo real caia.
  const pronto = carga.estado === 'ok' || carga.estado === 'publico';
  useEffect(() => {
    if (demo || !pronto) return undefined;
    const parar = db.ouvirAoVivo(eventoId, setAoVivoState);
    const timer = PUBLICAS.includes(rota) ? setInterval(() => db.lerAoVivo(eventoId).then(setAoVivoState).catch(() => {}), rota === 'tv' ? 15000 : 30000) : null;
    return () => { parar(); if (timer) clearInterval(timer); };
  }, [demo, pronto, eventoId, rota]);

  const ir = (r) => { window.location.hash = `/${r}`; };

  // Executa a gravação no Supabase (no modo demonstração não faz nada) e avisa se falhar.
  const remoto = (fn) => (demo ? Promise.resolve(null) : fn().catch((e) => { setAviso(`Não foi possível salvar: ${e.message}`); throw e; }));

  const setEvento = (novo) => {
    setEventoState(novo);
    if (demo) {
      try { localStorage.setItem(CHAVE_EVENTO, JSON.stringify(novo)); } catch { /* sem armazenamento */ }
    } else {
      remoto(() => db.salvarEvento(eventoId, novo)).catch(() => {});
    }
  };
  const setAoVivo = (novo) => {
    setAoVivoState(novo);
    remoto(() => db.salvarAoVivo(eventoId, novo)).catch(() => {});
  };
  const setCard = (f) => {
    const novo = typeof f === 'function' ? f(card) : f;
    setCardState(novo);
    remoto(() => db.salvarCard(eventoId, novo, lutas)).catch(() => {});
  };

  const emLuta = useMemo(() => new Set(lutas.flatMap((l) => [l.a, l.b])), [lutas]);
  const sugestoes = useMemo(() => {
    const disponiveis = atletas.filter((a) => !emLuta.has(a.id));
    return sugerirMatches(disponiveis).filter((s) => !recusados.includes(s.id));
  }, [atletas, emLuta, recusados]);

  const store = {
    evento, setEvento, eventoId, atletas, setAtletas, lutas, setLutas, recusados, setRecusados,
    card, setCard, cardPublicado, setCardPublicado, bilhetes, setBilhetes, pedidos, setPedidos, checkins, setCheckins, ingressos, setIngressos,
    emLuta, sugestoes, ir, demo, db, remoto, setAviso, aoVivo, setAoVivo,
  };

  const toast = aviso && (
    <div className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-fight/50 bg-panel p-3 text-sm shadow-2xl lg:bottom-6">
      <Icon name="alert" className="size-5 shrink-0 text-fight" />
      <span className="flex-1">{aviso}</span>
      <button onClick={() => setAviso(null)} aria-label="Fechar aviso"><Icon name="x" className="size-4" /></button>
    </div>
  );

  const entrar = async (email, senha) => {
    if (!demo) await db.entrar(email, senha);
    ir('dashboard');
  };

  if (rota === 'login') return <Login onEntrar={entrar} demo={demo} />;
  if (rota === 'publico') return <>{<PaginaPublica store={store} carga={carga} />}{toast}</>;
  if (rota === 'tv') return <TelaTV store={store} carga={carga} />;

  // Fora do modo demonstração, as telas do organizador exigem login.
  if (!demo) {
    if (!authPronto) return <Tela1 texto="Carregando…" />;
    if (!sessao) return <Login onEntrar={entrar} demo={demo} />;
    if (carga.estado === 'erro') return <Tela1 texto={carga.erro} acao={() => db.sair().then(() => ir('login'))} />;
    if (carga.estado !== 'ok') return <Tela1 texto="Carregando dados do evento…" />;
  }

  if (rota === 'portaria') return <><Portaria store={store} />{toast}</>;

  const TELAS = { dashboard: Dashboard, ficha: ColarFicha, atletas: Atletas, matches: Matches, card: MontagemCard, aovivo: AoVivo, pagamentos: Pagamentos, config: Configuracoes };
  const Tela = TELAS[rota] ?? Dashboard;

  const NavItem = ({ r, compacto }) => {
    const ativo = rota === r.id;
    const badge = r.id === 'matches' && sugestoes.length > 0 ? sugestoes.length : null;
    if (compacto) {
      return (
        <a href={`#/${r.id}`} className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium ${ativo ? 'text-gold' : 'text-muted'}`}>
          <Icon name={r.icon} className="size-5" />
          {r.label}
          {badge && <span className="absolute right-[22%] top-1 grid min-w-4 place-items-center rounded-full bg-fight px-1 text-[10px] text-white">{badge}</span>}
        </a>
      );
    }
    return (
      <a
        href={`#/${r.id}`}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${ativo ? 'bg-fight/15 text-white ring-1 ring-fight/40' : 'text-zinc-400 hover:bg-panel-2 hover:text-white'}`}
      >
        <Icon name={r.icon} className={`size-5 ${ativo ? 'text-fight' : ''}`} />
        <span className="flex-1">{r.label}</span>
        {badge && <span className="rounded-full bg-fight px-2 text-xs text-white">{badge}</span>}
        {TELA_CHEIA.includes(r.id) && <Icon name="external" className="size-3.5 opacity-50" />}
      </a>
    );
  };

  const Logo = () => (
    <a href="#/dashboard" className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-lg bg-fight font-display text-xl text-white">CF</span>
      <span className="font-display text-2xl leading-none tracking-wide">Canema <span className="text-gold">Fight</span></span>
    </a>
  );

  return (
    <div className="stripe-bg min-h-screen lg:flex">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-ink/60 p-4 backdrop-blur lg:flex">
        <Logo />
        <p className="mt-1 mb-6 text-xs text-muted">{evento.nome} · {evento.dataTexto.split('·')[0]}{demo && <span className="mt-1 block text-amber-300">Modo demonstração</span>}</p>
        <nav className="flex flex-col gap-1">{ROTAS.map((r) => <NavItem key={r.id} r={r} />)}</nav>
        <a href="#/login" onClick={() => { if (!demo) db.sair(); }} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 hover:text-white">
          <Icon name="logout" /> Sair
        </a>
      </aside>

      {/* Topo mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-ink/85 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={() => setMenuAberto(true)} className="rounded-lg p-2 text-zinc-300 hover:bg-panel-2" aria-label="Abrir menu">
          <Icon name="menu" className="size-6" />
        </button>
      </header>

      {/* Drawer mobile */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMenuAberto(false)} />
          <nav className="absolute right-0 top-0 flex h-full w-72 flex-col gap-1 border-l border-line bg-panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-2xl tracking-wide">Menu</span>
              <button onClick={() => setMenuAberto(false)} className="rounded-lg p-2 hover:bg-panel-2" aria-label="Fechar menu"><Icon name="x" /></button>
            </div>
            {ROTAS.map((r) => <NavItem key={r.id} r={r} />)}
            <a href="#/login" onClick={() => { if (!demo) db.sair(); }} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500"><Icon name="logout" /> Sair</a>
          </nav>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-8">
        <Tela store={store} />
      </main>

      {/* Barra inferior mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {ROTAS.filter((r) => BOTTOM.includes(r.id)).map((r) => <NavItem key={r.id} r={r} compacto />)}
        <button onClick={() => setMenuAberto(true)} className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted">
          <Icon name="menu" /> Mais
        </button>
      </nav>
      {toast}
    </div>
  );
}
