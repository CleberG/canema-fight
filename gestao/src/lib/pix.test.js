import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarChave } from './pix.js';
import { textoData } from './data.js';

test('chaves Pix', () => {
  assert.deepEqual(validarChave('cpf', '529.982.247-25'), { ok: true, valor: '529.982.247-25' });
  assert.equal(validarChave('cpf', '111.111.111-11').ok, false);
  assert.equal(validarChave('cpf', '529.982.247-24').ok, false);
  assert.deepEqual(validarChave('cnpj', '11222333000181'), { ok: true, valor: '11.222.333/0001-81' });
  assert.equal(validarChave('cnpj', '11.222.333/0001-80').ok, false);
  assert.deepEqual(validarChave('email', ' Pix@Evento.com.br '), { ok: true, valor: 'pix@evento.com.br' });
  assert.equal(validarChave('email', 'pix@evento').ok, false);
  assert.deepEqual(validarChave('telefone', '(47) 99999-1234'), { ok: true, valor: '+5547999991234' });
  assert.deepEqual(validarChave('telefone', '+55 47 3333-1234'), { ok: true, valor: '+554733331234' });
  assert.equal(validarChave('telefone', '99999-1234').ok, false);
  assert.equal(validarChave('aleatoria', '123e4567-e89b-12d3-a456-426614174000').ok, true);
  assert.equal(validarChave('aleatoria', 'abc').ok, false);
  assert.equal(validarChave('email', '').erro, 'Informe a chave Pix');
});

test('texto da data do evento', () => {
  assert.equal(textoData('2026-12-12T18:00'), 'Sábado, 12 de dezembro · 18h');
  assert.equal(textoData('2026-12-12T19:30'), 'Sábado, 12 de dezembro · 19h30');
});
