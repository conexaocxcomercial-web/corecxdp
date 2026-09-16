/** Material Symbols Rounded, o mesmo conjunto das outras telas do core.cx. */
export function Icone({ nome, tamanho, className = '', ...props }) {
  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={tamanho ? { fontSize: `${tamanho}px` } : undefined}
      aria-hidden="true"
      {...props}
    >
      {nome}
    </span>
  );
}
