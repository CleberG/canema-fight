import { useState } from 'react';
import { Button, Icon, inputCls } from '../components/ui.jsx';

export default function Login({ onEntrar, demo }) {
  const [email, setEmail] = useState(demo ? 'organizacao@canemafight.com.br' : '');
  const [senha, setSenha] = useState(demo ? 'demo1234' : '');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const entrar = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    try {
      await onEntrar(email, senha);
    } catch (err) {
      setErro(/invalid login/i.test(err.message) ? 'E-mail ou senha incorretos.' : err.message);
      setCarregando(false);
    }
  };

  return (
    <div className="stripe-bg relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-fight/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-16 rotate-3 place-items-center rounded-2xl bg-fight font-display text-3xl text-white shadow-2xl shadow-fight/40">CF</div>
          <h1 className="font-display text-5xl leading-none tracking-wide">Canema <span className="text-gold">Fight</span></h1>
          <p className="mt-2 text-sm text-muted">Painel do organizador</p>
        </div>

        <form onSubmit={entrar} className="space-y-4 rounded-2xl border border-line bg-panel/90 p-6 backdrop-blur">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">E-mail</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">Senha</span>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className={inputCls} required />
          </label>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted"><input type="checkbox" defaultChecked className="accent-fight" /> Lembrar de mim</label>
            {demo && <a href="#/login" className="text-gold hover:underline">Esqueci a senha</a>}
          </div>
          {erro && <p className="rounded-lg bg-fight/15 px-3 py-2 text-sm text-red-300">{erro}</p>}
          <Button type="submit" className="w-full py-3" disabled={carregando}>
            {carregando ? 'Entrando…' : <>Entrar <Icon name="arrowLeft" className="size-4 rotate-180" /></>}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          {demo ? 'Modo demonstração · dados fictícios · qualquer senha entra' : 'Acesso restrito aos organizadores do evento'}
        </p>
        <div className="mt-3 flex justify-center gap-4 text-xs">
          <a href="#/publico" className="text-zinc-400 hover:text-white">Ver página pública</a>
          <a href="#/portaria" className="text-zinc-400 hover:text-white">Abrir portaria</a>
        </div>
      </div>
    </div>
  );
}
