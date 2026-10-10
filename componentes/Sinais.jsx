/**
 * Pílulas de estado só com as cores da marca: lima resolve, escura
 * espera, rosa recusa, violeta em curso, lilás férias, neutro
 * encerrado. As cores ficam em `.pil` no globals.css.
 */
const TONS = {
  Ativo: 'ok',
  Aprovado: 'ok',
  Concluído: 'ok',
  Sim: 'ok',
  Pendente: 'at',
  'Em andamento': 'ac',
  Afastado: 'ac',
  Férias: 'az',
  Rejeitado: 'cr',
  Não: 'cr',
  Inativo: '',
};

export function Status({ children }) {
  const tom = TONS[children] ?? '';

  return (
    <span className={`pil ${tom}`}>
      <span className="pil-pt" />
      {children}
    </span>
  );
}
