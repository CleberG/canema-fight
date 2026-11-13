// Componentes visuais compartilhados.

const PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  paste: 'M9 4h6v3H9zM7 5H5v16h14V5h-2M8 12h8M8 16h5',
  users: 'M16 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1M9 10a3 3 0 100-6 3 3 0 000 6zM22 19v-1a4 4 0 00-3-3.9M16 4.1a3 3 0 010 5.8',
  swords: 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 6.5L14 2h3v3l-4.5 4.5M5 14l4 4M7 17l-3 3M3 19l2 2',
  layers: 'M12 2l10 6-10 6L2 8zM2 16l10 6 10-6M2 12l10 6 10-6',
  pix: 'M12 2l4.5 4.5-4.5 4.5-4.5-4.5zM12 13l4.5 4.5L12 22l-4.5-4.5zM2 12l4.5-4.5L11 12l-4.5 4.5zM13 12l4.5-4.5L22 12l-4.5 4.5z',
  ticket: 'M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4zM14 5v14',
  qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  menu: 'M3 6h18M3 12h18M3 18h18',
  x: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  filter: 'M22 3H2l8 9.5V19l4 2v-8.5z',
  grip: 'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
  up: 'M18 15l-6-6-6 6',
  down: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  calendar: 'M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zM16 2v4M8 2v4M3 10h18',
  pin: 'M12 22s-8-6-8-12a8 8 0 0116 0c0 6-8 12-8 12zM12 13a3 3 0 100-6 3 3 0 000 6z',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  camera: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z',
  tv: 'M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM8 21h8M12 17v4',
  external: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  play: 'M6 4l14 8-14 8z',
  stop: 'M6 6h12v12H6z',
  undo: 'M3 7v6h6M3 13a9 9 0 103-7.7L3 8',
  video: 'M23 7l-7 5 7 5zM1 5h15v14H1z',
  trophy:'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3',
};

export function Icon({ name, className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Card({ className = '', children, ...props }) {
  return <div className={`rounded-2xl border border-line bg-panel ${className}`} {...props}>{children}</div>;
}

const BTN = {
  primary: 'bg-fight hover:bg-fight-dark text-white shadow-lg shadow-fight/20',
  gold: 'bg-gold hover:brightness-110 text-ink',
  ghost: 'bg-panel-2 hover:bg-line text-zinc-100 border border-line',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  danger: 'bg-transparent hover:bg-fight/15 text-fight border border-fight/50',
};

export function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[.98] disabled:opacity-40 disabled:pointer-events-none ${BTN[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const BADGE = {
  green: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  yellow: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
  red: 'bg-fight/15 text-red-300 ring-fight/30',
  gold: 'bg-gold/15 text-gold ring-gold/30',
  gray: 'bg-zinc-500/15 text-zinc-300 ring-zinc-500/30',
  blue: 'bg-corner-blue/15 text-blue-300 ring-corner-blue/30',
};

export function Badge({ color = 'gray', children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE[color]} ${className}`}>{children}</span>;
}

export function PageTitle({ kicker, title, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <p className="text-xs font-semibold uppercase tracking-widest text-gold">{kicker}</p>}
        <h1 className="font-display text-4xl leading-none tracking-wide sm:text-5xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export const inputCls = 'w-full rounded-xl border border-line bg-panel-2 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-gold/70 focus:ring-2 focus:ring-gold/20';

export function Select({ value, onChange, children, className = '' }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} ${className}`}>
      {children}
    </select>
  );
}

// Menores de 18: só primeiro nome, sem Instagram.
export const ehMenor = (a) => a.idade != null && a.idade < 18;
export const nomeExibido = (a) => (ehMenor(a) ? a.nome.split(' ')[0] : a.nome);
export const instagramExibido = (a) => (ehMenor(a) ? null : a.instagram);

// Card como aparece na página pública: luta principal primeiro, só nome público e academia.
export function montarCardPublico(card, lutas, atletas) {
  const porId = Object.fromEntries(atletas.map((a) => [a.id, a]));
  const lutaPorId = Object.fromEntries(lutas.map((l) => [l.id, l]));
  // foto/video = caminho no bucket (a página pública gera o link); fotoUrl/videoUrl só no modo demonstração
  const canto = (a) => ({
    nome: nomeExibido(a), academia: a.academia,
    foto: a.fotoPath ?? null, ...(a.fotoPath ? {} : { fotoUrl: a.fotoUrl ?? null }),
    video: a.videoPath ?? null, ...(a.videoPath ? {} : { videoUrl: a.videoUrl ?? null }),
  });
  return [...card].reverse().filter((id) => lutaPorId[id]).map((id) => {
    const { a, b, categoria } = lutaPorId[id];
    return { id, vermelho: canto(porId[a]), azul: canto(porId[b]), peso: categoriaDaLuta(lutaPorId[id], porId[a], porId[b]), categoria: categoria ?? null };
  });
}

// "66 kg", "Peso combinado"… — rótulo definido na luta ou o maior peso dos dois atletas.
export function categoriaDaLuta(luta, A, B) {
  if (luta?.categoria) return luta.categoria;
  const pesos = [A?.peso, B?.peso].filter((p) => p != null);
  return pesos.length ? `${Math.round(Math.max(...pesos))} kg` : 'A definir';
}

export const iniciais =(nome) => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export function Avatar({ atleta, corner = 'red', size = 'size-11' }) {
  const ring = corner === 'red' ? 'from-fight to-fight-dark' : corner === 'blue' ? 'from-corner-blue to-blue-800' : 'from-gold to-amber-700';
  if (atleta.fotoUrl) {
    const borda = corner === 'red' ? 'ring-fight' : corner === 'blue' ? 'ring-corner-blue' : 'ring-gold';
    return <img src={atleta.fotoUrl} alt={nomeExibido(atleta)} className={`${size} shrink-0 rounded-full object-cover ring-2 ${borda}`} />;
  }
  return (
    <div className={`${size} shrink-0 rounded-full bg-gradient-to-br ${ring} grid place-items-center font-display text-lg tracking-wide text-white`}>
      {iniciais(nomeExibido(atleta))}
    </div>
  );
}

// Reduz a foto para no máximo 800 px e converte em JPEG antes de enviar.
export function reduzirFoto(arquivo, lado = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      const escala = Math.min(1, lado / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível ler a imagem'))), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Arquivo de imagem inválido')); };
    img.src = url;
  });
}

// Seletor de foto opcional (galeria ou câmera do celular). onChange recebe o Blob reduzido, ou null para remover.
export function FotoInput({ previa, onChange, carregando }) {
  const escolher = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      onChange(await reduzirFoto(f));
    } catch (err) {
      window.alert(`${err.message}. Use uma foto JPG ou PNG.`);
    }
  };
  return (
    <div className="flex items-center gap-3">
      {previa ? (
        <img src={previa} alt="Foto do atleta" className="size-16 rounded-full object-cover ring-2 ring-gold/60" />
      ) : (
        <div className="grid size-16 place-items-center rounded-full border border-dashed border-line text-zinc-500"><Icon name="camera" /></div>
      )}
      <div className="flex flex-wrap gap-2">
        <label className={`cursor-pointer rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm font-medium hover:bg-line ${carregando ? 'pointer-events-none opacity-50' : ''}`}>
          {carregando ? 'Enviando…' : previa ? 'Trocar foto' : 'Adicionar foto'}
          <input type="file" accept="image/*" className="hidden" onChange={escolher} />
        </label>
        {previa && !carregando && (
          <button type="button" onClick={() => onChange(null)} className="rounded-xl px-3 py-2 text-sm text-zinc-400 hover:text-fight">Remover</button>
        )}
      </div>
    </div>
  );
}

export const formatarTreino = (meses) => {
  if (meses == null) return '—';
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  return [a && `${a} ano${a > 1 ? 's' : ''}`, m && `${m} ${m > 1 ? 'meses' : 'mês'}`].filter(Boolean).join(' e ') || '0 meses';
};

export const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// QR "decorativo" determinístico a partir de um texto (não é um QR real).
export function FakeQR({ texto, className = 'size-40' }) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const n = 21;
  const cells = [];
  const finder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      h = Math.imul(h ^ (x * 31 + y), 2654435761) >>> 0;
      if (h % 2) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  const F = ({ x, y }) => (
    <g>
      <rect x={x} y={y} width="7" height="7" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className={`${className} rounded-lg bg-white`} shapeRendering="crispEdges" fill="#0b0b0f">
      {cells}
      <F x={0} y={0} /><F x={n - 7} y={0} /><F x={0} y={n - 7} />
    </svg>
  );
}
