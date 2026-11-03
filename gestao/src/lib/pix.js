// Validação e normalização de chaves Pix.

export const TIPOS_CHAVE = [
  { id: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
  { id: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
  { id: 'email', label: 'E-mail', placeholder: 'financeiro@seuevento.com.br' },
  { id: 'telefone', label: 'Telefone', placeholder: '(47) 99999-0000' },
  { id: 'aleatoria', label: 'Chave aleatória', placeholder: '123e4567-e89b-12d3-a456-426614174000' },
];

const digitos = (v) => String(v).replace(/\D/g, '');

function digitoVerificador(base, pesos) {
  const soma = [...base].reduce((s, d, i) => s + Number(d) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cpfValido(v) {
  const d = digitos(v);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const d1 = digitoVerificador(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[9]) && d2 === Number(d[10]);
}

export function cnpjValido(v) {
  const d = digitos(v);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const d1 = digitoVerificador(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

// Retorna { ok, valor (normalizado), erro }
export function validarChave(tipo, bruto) {
  const v = String(bruto ?? '').trim();
  if (!v) return { ok: false, erro: 'Informe a chave Pix' };
  switch (tipo) {
    case 'cpf':
      return cpfValido(v)
        ? { ok: true, valor: digitos(v).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') }
        : { ok: false, erro: 'CPF inválido' };
    case 'cnpj':
      return cnpjValido(v)
        ? { ok: true, valor: digitos(v).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') }
        : { ok: false, erro: 'CNPJ inválido' };
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
        ? { ok: true, valor: v.toLowerCase() }
        : { ok: false, erro: 'E-mail inválido' };
    case 'telefone': {
      let d = digitos(v);
      if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
      return d.length === 10 || d.length === 11
        ? { ok: true, valor: `+55${d}` }
        : { ok: false, erro: 'Telefone com DDD: 10 ou 11 dígitos' };
    }
    case 'aleatoria':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
        ? { ok: true, valor: v.toLowerCase() }
        : { ok: false, erro: 'Chave aleatória deve ter o formato 8-4-4-4-12' };
    default:
      return { ok: false, erro: 'Escolha o tipo de chave' };
  }
}
