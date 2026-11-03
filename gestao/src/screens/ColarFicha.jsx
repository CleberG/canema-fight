import { useState } from 'react';
import { CAMPOS, FICHA_EXEMPLO, lerFicha } from '../lib/parser.js';
import { Badge, Button, Card, Icon, PageTitle, formatarTreino, inputCls } from '../components/ui.jsx';

const OBRIGATORIOS = ['nome', 'idade', 'sexo', 'peso', 'academia', 'lutas', 'luvoes', 'tempoTreino'];

export default function ColarFicha({ store }) {
  const [texto, setTexto] = useState('');
  const [form, setForm] = useState(null);
  const [reconhecidos, setReconhecidos] = useState(new Set());
  const [ignoradas, setIgnoradas] = useState([]);
  const [salvo, setSalvo] = useState(null);

  const ler = () => {
    const r = lerFicha(texto);
    setForm(Object.fromEntries(CAMPOS.map((c) => [c.key, r.dados[c.key] ?? ''])));
    setReconhecidos(r.reconhecidos);
    setIgnoradas(r.ignoradas);
    setSalvo(null);
  };

  const menor = form && Number(form.idade) > 0 && Number(form.idade) < 18;
  const campos = CAMPOS.filter((c) => c.key !== 'responsavel' || menor);
  const faltando = form ? OBRIGATORIOS.filter((k) => form[k] === '' || form[k] == null) : [];

  const salvar = () => {
    const id = Math.max(...store.atletas.map((a) => a.id)) + 1;
    const num = (k) => Number(String(form[k]).replace(',', '.')) || 0;
    const novo = {
      ...form, id, idade: num('idade'), peso: num('peso'), altura: num('altura'),
      lutas: num('lutas'), luvoes: num('luvoes'), tempoTreino: num('tempoTreino'),
      status: 'aguardando', pagamento: 'pendente',
    };
    store.setAtletas((l) => [...l, novo]);
    setSalvo(novo.nome);
    setTexto(''); setForm(null);
  };

  return (
    <>
      <PageTitle kicker="Cadastro rápido" title="Colar ficha" />

      {salvo && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
          <Icon name="check" className="text-emerald-400" />
          <span className="flex-1"><b>{salvo}</b> cadastrado(a). Inscrição criada com Pix pendente.</span>
          <Button variant="ghost" className="py-1.5" onClick={() => store.ir('matches')}>Ver matches</Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="ficha" className="text-sm font-semibold">Ficha do WhatsApp</label>
            <button onClick={() => setTexto(FICHA_EXEMPLO)} className="text-xs font-medium text-gold hover:underline">Usar ficha de exemplo</button>
          </div>
          <textarea
            id="ficha"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={14}
            placeholder={'Cole aqui a ficha recebida, ex.:\n*Nome:* ...\n*Peso:* 52,4 kg\n*Nº de lutas:* 3'}
            className={`${inputCls} resize-y font-mono text-[13px] leading-relaxed`}
          />
          <Button className="mt-3 w-full py-3" onClick={ler} disabled={!texto.trim()}>
            <Icon name="search" className="size-4" /> Ler ficha
          </Button>
          {ignoradas.length > 0 && (
            <div className="mt-3 text-xs text-muted">
              <p className="mb-1 font-medium text-zinc-400">Linhas não reconhecidas:</p>
              <ul className="space-y-0.5">{ignoradas.map((l, i) => <li key={i} className="truncate">· {l}</li>)}</ul>
            </div>
          )}
        </Card>

        <Card className="p-4">
          {!form ? (
            <div className="grid h-full min-h-60 place-items-center text-center text-sm text-muted">
              <div>
                <Icon name="paste" className="mx-auto mb-3 size-10 text-zinc-600" />
                Cole uma ficha e toque em <b className="text-zinc-300">Ler ficha</b>.<br />O formulário aparece aqui pré-preenchido.
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge color="green">{reconhecidos.size} reconhecidos</Badge>
                <Badge color="yellow">{campos.filter((c) => !reconhecidos.has(c.key)).length} faltando</Badge>
                {menor && <Badge color="blue">Menor de idade</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {campos.map((c) => {
                  const ok = reconhecidos.has(c.key);
                  const ring = ok ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-amber-400/60 bg-amber-400/5';
                  const largo = ['nome', 'academia', 'professor', 'responsavel', 'telefone'].includes(c.key);
                  return (
                    <label key={c.key} className={largo ? 'col-span-2' : 'col-span-1'}>
                      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                        <span className={`size-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {c.label}{c.suffix && <span className="text-zinc-600">({c.suffix})</span>}
                      </span>
                      {c.options ? (
                        <select value={form[c.key]} onChange={(e) => setForm({ ...form, [c.key]: e.target.value })} className={`${inputCls} ${ring}`}>
                          <option value="">Selecione</option>
                          {c.options.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          value={form[c.key]}
                          inputMode={c.type === 'number' ? 'decimal' : undefined}
                          onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                          className={`${inputCls} ${ring}`}
                        />
                      )}
                      {c.key === 'tempoTreino' && form.tempoTreino !== '' && (
                        <span className="mt-1 block text-[11px] text-zinc-500">= {formatarTreino(Number(form.tempoTreino))}</span>
                      )}
                    </label>
                  );
                })}
              </div>
              {faltando.length > 0 && (
                <p className="mt-3 text-xs text-amber-300">Preencha para salvar: {faltando.map((k) => CAMPOS.find((c) => c.key === k).label).join(', ')}</p>
              )}
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" onClick={() => setForm(null)}>Descartar</Button>
                <Button variant="success" className="flex-1" onClick={salvar} disabled={faltando.length > 0}>
                  <Icon name="check" className="size-4" /> Salvar atleta
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
