const BASE_SERIAL = Date.UTC(1899, 11, 30);
const DIA = 86400000;

/** Aceita número de série do Sheets, dd/mm/aaaa ou aaaa-mm-dd. */
export function paraData(valor) {
  if (valor === null || valor === undefined || valor === '') return null;

  // Um Date do JavaScript entra em hora local; aqui tudo trabalha em UTC.
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    return new Date(Date.UTC(valor.getFullYear(), valor.getMonth(), valor.getDate()));
  }

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

export function nomeDoMes(indice) {
  return MESES[indice] || '';
}

/** "15/10": para datas deste ano, onde o ano só pesa a leitura. */
export function dataCurta(valor) {
  const data = paraData(valor);
  if (!data) return '—';
  return `${String(data.getUTCDate()).padStart(2, '0')}/${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
}

const DIAS_DA_SEMANA = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado',
];

export function diaDaSemana(valor) {
  const data = paraData(valor);
  return data ? DIAS_DA_SEMANA[data.getUTCDay()] : '';
}

/**
 * Dias até (positivo) ou desde (negativo) uma data: "hoje", "amanhã",
 * "em 4 dias", "há 3 dias"; o que passou há muito vira meses ou anos.
 */
export function diasPorExtenso(dias) {
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  if (dias === -1) return 'ontem';
  if (dias > 0) return `em ${dias} dias`;
  const passados = -dias;
  if (passados <= 60) return `há ${passados} dias`;
  if (passados < 365) return `há ${Math.floor(passados / 30)} meses`;
  const anos = Math.floor(passados / 365);
  return anos === 1 ? 'há 1 ano' : `há ${anos} anos`;
}

const REAIS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function emReais(valor) {
  return REAIS.format(valor || 0);
}

const REAIS_COM_CENTAVOS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Com centavos: para valores informados item a item (custos), que a tela repete como foram digitados. */
export function emReaisExato(valor) {
  return REAIS_COM_CENTAVOS.format(valor || 0);
}

/**
 * Reais curtos, para leitura rápida e para os gráficos: "R$ 950",
 * "R$ 4,4 mil", "R$ 241 mil", "R$ 1,2 mi". Uma casa só abaixo de 10.
 */
export function emReaisCurto(valor) {
  const numero = Number(valor) || 0;
  const absoluto = Math.abs(numero);
  const sinal = numero < 0 ? '−' : '';
  const curto = (n) => (n < 10 ? n.toFixed(1) : String(Math.round(n))).replace('.', ',').replace(/,0$/, '');
  if (absoluto < 1000) return `${sinal}R$ ${Math.round(absoluto)}`;
  if (absoluto < 999500) return `${sinal}R$ ${curto(absoluto / 1000)} mil`;
  return `${sinal}R$ ${curto(absoluto / 1000000)} mi`;
}

/**
 * Um valor no formato do que ele mede, sempre legível: reais curtos,
 * percentual com uma casa, fator com duas, dias e quantidades inteiras.
 * formato: 'reais' | 'percentual' | 'fator' | 'anos' | 'dias' | 'numero'.
 */
export function formatarCurto(valor, formato = 'numero') {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '—';
  const numero = Number(valor);
  if (formato === 'reais') return emReaisCurto(numero);
  if (formato === 'percentual') return `${(Math.round(numero * 10) / 10).toFixed(1).replace('.', ',')}%`;
  if (formato === 'fator') return (Math.round(numero * 100) / 100).toFixed(2).replace('.', ',');
  if (formato === 'anos') return `${(Math.round(numero * 10) / 10).toFixed(1).replace('.', ',')} anos`;
  const inteiro = Math.round(numero);
  if (formato === 'dias') return `${inteiro.toLocaleString('pt-BR')} ${Math.abs(inteiro) === 1 ? 'dia' : 'dias'}`;
  return inteiro.toLocaleString('pt-BR');
}

/** A diferença entre dois valores no mesmo formato: "+R$ 2,4 mil", "−0,3 p.p.", "+3". Null se não mudou. */
export function variacaoCurta(atual, anterior, formato = 'numero') {
  if (atual === null || atual === undefined || anterior === null || anterior === undefined) return null;
  const diferenca = Number(atual) - Number(anterior);
  const sinal = diferenca > 0 ? '+' : '−';
  const absoluto = Math.abs(diferenca);
  if (formato === 'percentual') {
    const pp = Math.round(absoluto * 10) / 10;
    return pp === 0 ? null : `${sinal}${pp.toFixed(1).replace('.', ',')} p.p.`;
  }
  const texto = formatarCurto(absoluto, formato);
  const zero = formatarCurto(0, formato);
  return texto === zero ? null : `${sinal}${texto}`;
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

/** Para comparar em buscas: minúsculas e sem acento ("João" acha "joao"). */
export function paraBusca(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
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
