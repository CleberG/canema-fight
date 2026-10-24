import { EVENTO, LUTAS } from './lutas.js';

const lista = document.getElementById('lutas');

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

const [primeira, ...resto] = EVENTO.nome.split(' ');
document.getElementById('titulo').innerHTML = EVENTO.logo
  ? `<img class="logo" src="${esc(EVENTO.logo)}" alt="${esc(EVENTO.nome)}">`
  : `<span class="r">${esc(primeira)}</span> <span class="b">${esc(resto.join(' '))}</span>`;
document.getElementById('subtitulo').textContent = EVENTO.subtitulo;

function lado(cor, lutador, vencedor) {
  const classe = vencedor === cor ? 'vencedor' : (vencedor && vencedor !== 'empate' ? 'perdedor' : '');
  return `
    <div class="lado ${cor} ${classe}">
      <div class="nome">${esc(lutador.nome)}</div>
      <div class="equipe">${esc(lutador.equipe)}</div>
    </div>`;
}

lista.innerHTML = LUTAS.map((l, i) => `
  <article class="luta">
    ${lado('vermelho', l.vermelho, l.vencedor)}
    <div class="meio">
      <span class="num">Luta ${i + 1}</span>
      <span class="vs">VS</span>
      ${l.peso ? `<span class="peso">${esc(l.peso)}</span>` : ''}
      ${l.modalidade ? `<span class="mod">${esc(l.modalidade)}</span>` : ''}
      ${l.vencedor === 'empate' ? '<span class="tag-empate">Empate</span>' : ''}
    </div>
    ${lado('azul', l.azul, l.vencedor)}
  </article>`).join('') || '<p style="color:var(--muted)">Nenhuma luta cadastrada ainda.</p>';
