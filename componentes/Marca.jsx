/**
 * Marca em texto puro: core em preto, .cx no violeta da casa.
 * No tema escuro o "core" acompanha a cor do texto.
 */
export function Marca({ tamanho = 'normal' }) {
  const corpo = tamanho === 'pequeno' ? 'text-[16px]' : 'text-[18px]';
  const modulo = tamanho === 'pequeno' ? 'text-[11.5px]' : 'text-[12.5px]';

  return (
    <span className="marcante inline-flex items-baseline gap-1.5">
      <span className={`font-bold text-texto ${corpo}`}>
        core<span className="text-marca">.cx</span>
      </span>
      <span className={`font-medium text-texto-3 ${modulo}`}>módulo dp</span>
    </span>
  );
}
