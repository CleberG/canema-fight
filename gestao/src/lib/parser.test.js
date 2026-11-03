import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FICHA_EXEMPLO, lerFicha, normalizarChave, tempoEmMeses, alturaEmMetros, extrairNumero } from './parser.js';
import { bloqueios, pontuar } from './matching.js';

test('ficha de exemplo', () => {
  const { dados, reconhecidos } = lerFicha(FICHA_EXEMPLO);
  assert.deepEqual(dados, {
    nome: 'Ana Beatriz Moreira',
    idade: 16,
    sexo: 'Feminino',
    peso: 52.4,
    altura: 1.62,
    academia: 'CT Sangue Thai',
    professor: 'Kru Rafael',
    lutas: 3,
    luvoes: 5,
    tempoTreino: 18,
    instagram: '@anabia.thai',
    telefone: '(47) 99999-1234',
  });
  assert.ok(!reconhecidos.has('cidade'));
  assert.ok(!reconhecidos.has('responsavel'));
});

test('normaliza chaves', () => {
  assert.equal(normalizarChave('*Nº de Lutas*'), 'n de lutas');
  assert.equal(normalizarChave('N⁰ LUVÕES'), 'n luvoes');
  assert.equal(normalizarChave('_Tempo de Treino_'), 'tempo de treino');
});

test('separa só no primeiro ":" e aceita sinônimos', () => {
  const { dados } = lerFicha('Nome: João: o Trator\nN° lutas: 2\nluvão: nenhum\nIG: instagram.com/joao_thai/\nPeso: 70.5kg\nData de nascimento: 10/02/2000');
  assert.equal(dados.nome, 'João: o Trator');
  assert.equal(dados.lutas, 2);
  assert.equal(dados.luvoes, 0);
  assert.equal(dados.instagram, '@joao_thai');
  assert.equal(dados.peso, 70.5);
  assert.equal(typeof dados.idade, 'number');
});

test('conversões', () => {
  assert.equal(extrairNumero('52,4 kg'), 52.4);
  assert.equal(tempoEmMeses('2 anos'), 24);
  assert.equal(tempoEmMeses('8 meses'), 8);
  assert.equal(tempoEmMeses('1,5 ano'), 18);
  assert.equal(tempoEmMeses('3'), 36);
  assert.equal(alturaEmMetros('1,70'), 1.7);
  assert.equal(alturaEmMetros('175cm'), 1.75);
});

const base = { sexo: 'Feminino', peso: 52, idade: 16, academia: 'A', lutas: 2, luvoes: 3, tempoTreino: 12 };

test('regras de match', () => {
  assert.deepEqual(bloqueios(base, { ...base, academia: 'B' }), []);
  assert.ok(bloqueios(base, { ...base, academia: 'B', sexo: 'Masculino' }).includes('Sexos diferentes'));
  assert.ok(bloqueios(base, { ...base, academia: 'B', peso: 54.5 }).length);
  assert.ok(bloqueios(base, { ...base, academia: 'B', idade: 18 }).includes('Menor contra adulto'));
  assert.ok(bloqueios(base, { ...base, academia: 'B', idade: 13 }).length);
  assert.ok(bloqueios(base, { ...base, academia: ' a ' }).includes('Mesma academia'));
  assert.equal(pontuar(base, { ...base }).pontuacao, 100);
});
