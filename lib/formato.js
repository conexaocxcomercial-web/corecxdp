const BASE_SERIAL = Date.UTC(1899, 11, 30);
const DIA = 86400000;

/** Aceita número de série do Sheets, dd/mm/aaaa ou aaaa-mm-dd. */
export function paraData(valor) {
  if (valor === null || valor === undefined || valor === '') return null;

  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return new Date(BASE_SERIAL + Math.round(valor) * DIA);
  }

  const texto = String(valor).trim();

  const brasileiro = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brasileiro) {
    return new Date(Date.UTC(+brasileiro[3], +brasileiro[2] - 1, +brasileiro[1]));
  }

  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  }

  const numero = Number(texto.replace(',', '.'));
  if (!Number.isNaN(numero) && numero > 0) {
    return new Date(BASE_SERIAL + Math.round(numero) * DIA);
  }

  return null;
}

export function formatarData(valor) {
  const data = paraData(valor);
  if (!data || Number.isNaN(data.getTime())) return '—';

  const dia = String(data.getUTCDate()).padStart(2, '0');
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getUTCFullYear()}`;
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function dataPorExtenso(valor) {
  const data = paraData(valor);
  if (!data) return '—';
  return `${data.getUTCDate()} de ${MESES[data.getUTCMonth()]} de ${data.getUTCFullYear()}`;
}

export function hojeISO() {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

/** O Sheets reconhece ISO em qualquer idioma; é o formato mais seguro para gravar. */
export function paraISO(valor) {
  const data = paraData(valor);
  if (!data) return '';
  const dia = String(data.getUTCDate()).padStart(2, '0');
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  return `${data.getUTCFullYear()}-${mes}-${dia}`;
}

export function diasAtras(valor) {
  const data = paraData(valor);
  if (!data) return Infinity;
  const hoje = new Date();
  const referencia = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((referencia - data.getTime()) / DIA);
}

export function tempoDeCasa(admissao) {
  const dias = diasAtras(admissao);
  if (!Number.isFinite(dias)) return '—';
  const anos = Math.floor(dias / 365);
  const meses = Math.floor((dias % 365) / 30);
  if (anos === 0 && meses === 0) return `${Math.max(dias, 0)} dias`;
  if (anos === 0) return meses === 1 ? '1 mês' : `${meses} meses`;
  const parteAno = anos === 1 ? '1 ano' : `${anos} anos`;
  if (meses === 0) return parteAno;
  return `${parteAno} e ${meses === 1 ? '1 mês' : `${meses} meses`}`;
}

export function apenasDigitos(texto) {
  return String(texto || '').replace(/\D/g, '');
}

export function mascararCPF(texto) {
  const digitos = apenasDigitos(texto).slice(0, 11);
  if (digitos.length !== 11) return String(texto || '').trim();
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

export function cpfValido(texto) {
  const cpf = apenasDigitos(texto);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (tamanho) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i += 1) {
      soma += Number(cpf[i]) * (tamanho + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

export function primeiroNome(nome) {
  return String(nome || '').trim().split(/\s+/)[0] || '';
}

export function iniciais(nome) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '—';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function plural(quantidade, singular, pluralPalavra) {
  return quantidade === 1 ? singular : pluralPalavra;
}
