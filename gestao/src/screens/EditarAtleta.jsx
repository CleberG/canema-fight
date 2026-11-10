import { useEffect, useRef, useState } from 'react';
import { CAMPOS } from '../lib/parser.js';
import { Button, FotoInput, Icon, formatarTreino, inputCls } from '../components/ui.jsx';

// Idade e peso podem ficar para depois (atleta importado de cartaz); sem eles não entra nas sugestões de match.
const OBRIGATORIOS = ['nome', 'sexo', 'lutas', 'luvoes', 'tempoTreino'];
const NUMEROS = ['idade', 'peso', 'altura', 'lutas', 'luvoes', 'tempoTreino'];
export const STATUS_INSCRICAO = [
  { id: 'pago', label: 'Pago' },
  { id: 'pendente', label: 'Aguardando Pix' },
  { id: 'expirado', label: 'Pix expirado' },
];

const num = (v) => Number(String(v).replace(',', '.'));
const VIDEO_MAX = 2 * 1024 * 1024; // limite do bucket

// Vídeo curto (mp4) que aparece na página pública enquanto a luta do atleta está acontecendo.
function VideoInput({ previa, onChange, carregando }) {
  const escolher = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.type !== 'video/mp4') { window.alert('Use um vídeo MP4.'); return; }
    if (f.size > VIDEO_MAX) { window.alert('O vídeo passa de 2 MB. Corte para 3 a 5 segundos ou reduza a qualidade.'); return; }
    onChange(f);
  };
  return (
    <div className="flex items-center gap-3">
      {previa ? (
        <video src={previa} autoPlay muted loop playsInline className="size-16 rounded-xl object-cover ring-2 ring-fight/60" />
      ) : (
        <div className="grid size-16 place-items-center rounded-xl border border-dashed border-line text-zinc-500"><Icon name="video" /></div>
      )}
      <div className="flex flex-wrap gap-2">
        <label className={`cursor-pointer rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm font-medium hover:bg-line ${carregando ? 'pointer-events-none opacity-50' : ''}`}>
          {carregando ? 'Enviando…' : previa ? 'Trocar vídeo' : 'Adicionar vídeo'}
          <input type="file" accept="video/mp4" className="hidden" onChange={escolher} />
        </label>
        {previa && !carregando && (
          <button type="button" onClick={() => onChange(null)} className="rounded-xl px-3 py-2 text-sm text-zinc-400 hover:text-fight">Remover</button>
        )}
      </div>
    </div>
  );
}

// Modal de edição: dados da ficha, foto opcional e status da inscrição.
export default function EditarAtleta({ atleta, store, onFechar }) {
  const { demo, db, remoto, setAtletas } = store;
  const [form, setForm] = useState(() => Object.fromEntries(CAMPOS.map((c) => [c.key, atleta[c.key] ?? ''])));
  const [pagamento, setPagamento] = useState(atleta.pagamento);
  const [foto, setFoto] = useState(undefined); // undefined = sem mudança, null = remover, Blob = nova
  const [previa, setPrevia] = useState(atleta.fotoUrl);
  const [video, setVideo] = useState(undefined); // undefined = sem mudança, null = remover, File = novo
  const [previaVideo, setPreviaVideo] = useState(atleta.videoUrl ?? null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  // Libera prévias descartadas (a que foi salva continua em uso na lista no modo demonstração)
  const salvoRef = useRef(false);
  useEffect(() => () => {
    if (!salvoRef.current && previa?.startsWith('blob:') && previa !== atleta.fotoUrl) URL.revokeObjectURL(previa);
  }, [previa, atleta.fotoUrl]);

  const trocarVideo = (arquivo) => {
    setVideo(arquivo);
    setPreviaVideo(arquivo ? URL.createObjectURL(arquivo) : null);
  };

  const trocarFoto = (blob) => {
    setFoto(blob);
    setPrevia(blob ? URL.createObjectURL(blob) : null);
  };

  const faltando = OBRIGATORIOS.filter((k) => form[k] === '' || form[k] == null);
  const invalidos = NUMEROS.filter((k) => form[k] !== '' && form[k] != null && Number.isNaN(num(form[k])));
  const menor = num(form.idade) > 0 && num(form.idade) < 18;

  const salvar = async (e) => {
    e.preventDefault();
    if (faltando.length || invalidos.length) return;
    setSalvando(true);
    setErro(null);
    const dados = { ...form };
    NUMEROS.forEach((k) => { dados[k] = form[k] === '' ? null : num(form[k]); });
    let novo = { ...atleta, ...dados, pagamento };
    try {
      await remoto(() => db.atualizarAtleta(atleta.id, dados));
      if (pagamento !== atleta.pagamento) await remoto(() => db.definirPagamentoAtleta(atleta.id, pagamento));
      if (foto === null) {
        await remoto(() => db.removerFoto(atleta));
        novo = { ...novo, fotoPath: null, fotoUrl: null };
      } else if (foto) {
        const enviada = demo ? { fotoPath: null, fotoUrl: previa } : await remoto(() => db.salvarFoto(store.eventoId, atleta, foto));
        novo = { ...novo, ...enviada };
      }
      if (video === null) {
        await remoto(() => db.removerVideo(atleta));
        novo = { ...novo, videoPath: null, videoUrl: null };
      } else if (video) {
        const enviado = demo ? { videoPath: null, videoUrl: previaVideo } : await remoto(() => db.salvarVideo(store.eventoId, atleta, video));
        novo = { ...novo, ...enviado };
      }
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
      return;
    }
    salvoRef.current = true;
    setAtletas((l) => l.map((a) => (a.id === atleta.id ? novo : a)));
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 sm:place-items-center" onClick={onFechar}>
      <form
        onSubmit={salvar}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-line bg-panel p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl tracking-wide">Editar atleta</h3>
          <button type="button" onClick={onFechar} className="rounded-lg p-1 hover:bg-panel-2" aria-label="Fechar"><Icon name="x" /></button>
        </div>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <FotoInput previa={previa} onChange={trocarFoto} carregando={salvando && !!foto} />
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-400">Inscrição</span>
            <select value={pagamento} onChange={(e) => setPagamento(e.target.value)} className={inputCls}>
              {STATUS_INSCRICAO.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>
        <p className="-mt-2 mb-4 text-xs text-zinc-500">Foto opcional. Fica visível só para a organização{menor ? ' — atleta menor de idade' : ''}.</p>

        <div className="mb-4">
          <VideoInput previa={previaVideo} onChange={trocarVideo} carregando={salvando && !!video} />
          <p className="mt-2 text-xs text-zinc-500">Vídeo opcional (MP4, até 2 MB, 3 a 5 segundos, atleta de frente). Passa em loop na página pública enquanto a luta acontece. Depois de trocar, publique o card de novo.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CAMPOS.filter((c) => c.key !== 'responsavel' || menor).map((c) => {
            const largo = ['nome', 'academia', 'professor', 'responsavel', 'telefone'].includes(c.key);
            const ruim = invalidos.includes(c.key) || (faltando.includes(c.key));
            return (
              <label key={c.key} className={largo ? 'col-span-2 sm:col-span-3' : 'col-span-1'}>
                <span className="mb-1 block text-xs font-medium text-zinc-400">
                  {c.label}{c.suffix && <span className="text-zinc-600"> ({c.suffix})</span>}
                  {OBRIGATORIOS.includes(c.key) && <span className="text-fight"> *</span>}
                </span>
                {c.options ? (
                  <select value={form[c.key]} onChange={(e) => setForm({ ...form, [c.key]: e.target.value })} className={inputCls}>
                    <option value="">Selecione</option>
                    {c.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    value={form[c.key] ?? ''}
                    inputMode={c.type === 'number' ? 'decimal' : undefined}
                    onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                    className={`${inputCls} ${ruim ? 'border-amber-400/60' : ''}`}
                  />
                )}
                {c.key === 'tempoTreino' && form.tempoTreino !== '' && !Number.isNaN(num(form.tempoTreino)) && (
                  <span className="mt-1 block text-[11px] text-zinc-500">= {formatarTreino(num(form.tempoTreino))}</span>
                )}
              </label>
            );
          })}
        </div>

        {(faltando.length > 0 || invalidos.length > 0) && (
          <p className="mt-3 text-xs text-amber-300">
            {faltando.length > 0 && <>Preencha: {faltando.map((k) => CAMPOS.find((c) => c.key === k).label).join(', ')}. </>}
            {invalidos.length > 0 && <>Use números em: {invalidos.map((k) => CAMPOS.find((c) => c.key === k).label).join(', ')}.</>}
          </p>
        )}
        {erro && <p className="mt-3 rounded-lg bg-fight/15 px-3 py-2 text-sm text-red-300">{erro}</p>}

        <div className="mt-5 flex gap-2">
          <Button type="button" variant="ghost" onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="success" className="flex-1" disabled={salvando || faltando.length > 0 || invalidos.length > 0}>
            <Icon name="check" className="size-4" /> {salvando ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
