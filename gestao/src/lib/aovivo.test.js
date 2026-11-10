import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VAZIO, corrigirVencedor, desfazer, encerrar, iniciar, proxima, situacao, tempoDecorrido } from './aovivo.js';

// Card público: principal primeiro (luta 3 é a principal, luta 1 abre a noite)
const CARD = [{ id: 'c' }, { id: 'b' }, { id: 'a' }];

test('a próxima luta segue a ordem da noite', () => {
  assert.equal(proxima(CARD, VAZIO).id, 'a');
  let v = iniciar(VAZIO, 'a', 't1');
  assert.equal(situacao(v, 'a'), 'ao_vivo');
  assert.equal(proxima(CARD, v).id, 'b');
  v = encerrar(v, 'azul', 't2');
  assert.equal(situacao(v, 'a'), 'encerrada');
  assert.deepEqual(v.resultados.a, { vencedor: 'azul', inicio: 't1', fim: 't2' });
  assert.equal(v.atual, null, 'a próxima fica aguardando o play');
  assert.equal(proxima(CARD, v).id, 'b');
});

test('só uma luta ao vivo por vez', () => {
  const v = iniciar(VAZIO, 'a');
  assert.equal(iniciar(v, 'b').atual, 'a');
});

test('desfazer volta a última encerrada para ao vivo', () => {
  let v = encerrar(iniciar(VAZIO, 'a', 't1'), 'vermelho', 't2');
  v = desfazer(v);
  assert.equal(v.atual, 'a');
  assert.equal(v.inicio, 't1');
  assert.equal(v.resultados.a, undefined);
  assert.equal(desfazer(v).atual, 'a', 'com luta ao vivo, desfazer não muda nada');
});

test('corrigir o vencedor de uma luta encerrada', () => {
  let v = encerrar(iniciar(VAZIO, 'a'), null);
  v = corrigirVencedor(v, 'a', 'empate');
  assert.equal(v.resultados.a.vencedor, 'empate');
  assert.equal(corrigirVencedor(v, 'x', 'azul').resultados.x, undefined);
});

test('reiniciar uma luta encerrada apaga o resultado', () => {
  const v = iniciar(encerrar(iniciar(VAZIO, 'a'), 'azul'), 'a');
  assert.equal(v.atual, 'a');
  assert.equal(v.resultados.a, undefined);
});

test('estado vindo do banco vazio ou nulo', () => {
  assert.equal(proxima(CARD, null).id, 'a');
  assert.equal(situacao({}, 'a'), 'aguardando');
});

test('tempo decorrido', () => {
  assert.equal(tempoDecorrido('2026-12-12T21:00:00Z', Date.parse('2026-12-12T21:04:07Z')), '04:07');
  assert.equal(tempoDecorrido(null), '00:00');
});
