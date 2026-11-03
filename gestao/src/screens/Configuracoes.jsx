import { useState } from 'react';
import { EVENTO, textoData } from '../lib/data.js';
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

export default function Configuracoes({ store }) {
  const { evento, setEvento } = store;
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
  const valido = !Object.values(erros).some(Boolean);
  const tipo = TIPOS_CHAVE.find((t) => t.id === form.tipoChave);

  const salvar = (e) => {
    e.preventDefault();
    setTentou(true);
    if (!valido) return;
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
          </Card>
          <Card className="flex gap-3 border-amber-400/30 bg-amber-400/5 p-4 text-xs text-amber-200">
            <Icon name="alert" className="size-4 shrink-0" />
            <p>No protótipo a chave é só exibida e fica salva neste navegador. Na versão final, cobranças e baixas automáticas dependem de integrar um provedor de pagamento com esta chave.</p>
          </Card>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={restaurar}>Restaurar padrão</Button>
            <Button type="submit" variant="success" className="flex-1"><Icon name="check" className="size-4" /> Salvar</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
