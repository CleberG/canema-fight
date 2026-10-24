// Edite este arquivo para alterar o evento e o card de lutas.
// A ordem da lista é a ordem das lutas.
// vencedor: 'vermelho', 'azul', 'empate' ou null (a definir)
// foto: foto da lutadora (pasta img/lutadoras/) ou omita para mostrar as iniciais

export const EVENTO = {
  nome: 'Canema Fight',
  subtitulo: 'Card de Lutas',
  logo: 'img/logo.jpg',
};

const f = (luta, cor) => `img/lutadoras/luta-${luta}-${cor}.jpg`;

export const LUTAS = [
  {
    peso: 'Peso combinado', modalidade: null, vencedor: null,
    vermelho: { nome: 'Analu', equipe: 'Canema Fight School', foto: f('01', 'vermelho') },
    azul: { nome: 'Mariana', equipe: 'Montelli Boxe', foto: f('01', 'azul') },
  },
  {
    peso: '67 kg', modalidade: null, vencedor: null,
    vermelho: { nome: 'Amanda Machado', equipe: 'Thai Gaspar (Gilmar)', foto: f('02', 'vermelho') },
    azul: { nome: 'Letícia de Assis', equipe: 'Thai Gaspar (Carol)', foto: f('02', 'azul') },
  },
  {
    peso: '60 kg', modalidade: null, vencedor: null,
    vermelho: { nome: 'Geovana Alves', equipe: 'Lord Team', foto: f('03', 'vermelho') },
    azul: { nome: 'Letícia de Oliveira', equipe: 'Feijó CT', foto: f('03', 'azul') },
  },
  {
    peso: '75 kg', modalidade: null, vencedor: null,
    vermelho: { nome: 'Ana Rodrigues', equipe: 'Thai Gaspar (Gilmar)', foto: f('04', 'vermelho') },
    azul: { nome: 'Laura Cota', equipe: 'Thai Champions', foto: f('04', 'azul') },
  },
  {
    peso: '68 kg', modalidade: null, vencedor: null,
    vermelho: { nome: 'Thaís', equipe: 'Canema Fight School' },
    azul: { nome: 'Gabriela', equipe: 'CHJ' },
  },
  {
    peso: '50 kg', modalidade: null, vencedor: null,
    vermelho: { nome: 'Bárbara Butzke', equipe: 'VO2', foto: f('06', 'vermelho') },
    azul: { nome: 'Emanueli Bier', equipe: 'Thai Gaspar (Carol)', foto: f('06', 'azul') },
  },
  {
    peso: 'Peso combinado', modalidade: null, vencedor: null,
    vermelho: { nome: 'Kelly de Melo', equipe: 'TMC' },
    azul: { nome: 'Cauanny Lima', equipe: 'Canema Fight School' },
  },
  {
    peso: '65 kg', modalidade: null, vencedor: null,
    vermelho: { nome: 'Letícia Soares', equipe: 'Canema Fight School', foto: f('08', 'vermelho') },
    azul: { nome: 'Rebeca Araújo', equipe: 'Lord Team', foto: f('08', 'azul') },
  },
  {
    peso: '75 kg', modalidade: null, vencedor: null,
    vermelho: { nome: 'Analu', equipe: 'Canema Fight School', foto: f('09', 'vermelho') },
    azul: { nome: 'Aline', equipe: 'CHJ', foto: f('09', 'azul') },
  },
  {
    peso: '85 kg', modalidade: null, vencedor: null,
    vermelho: { nome: 'Bruna', equipe: 'Bravo Fight Team', foto: f('10', 'vermelho') },
    azul: { nome: 'Jéssica', equipe: 'Thai Gaspar (Gilmar)', foto: f('10', 'azul') },
  },
  {
    peso: null, modalidade: 'Jiu-Jitsu', vencedor: null,
    vermelho: { nome: 'Paula', equipe: 'Canema Fight School', foto: f('11', 'vermelho') },
    azul: { nome: 'Thaís', equipe: 'Canema Fight School', foto: f('11', 'azul') },
  },
  {
    peso: '65 kg', modalidade: null, vencedor: null,
    vermelho: { nome: 'Daniela Ribeiro', equipe: 'Thai Gaspar (Gilmar)', foto: f('12', 'vermelho') },
    azul: { nome: 'Nathaly Kitabayashi', equipe: 'Canema Fight School', foto: f('12', 'azul') },
  },
];
