/**
 * Pílulas de estado no padrão do core.cx: verde resolve, âmbar espera,
 * vermelho recusa, roxo em curso, neutro encerrado.
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

const PONTOS = {
  ok: 'var(--ok)',
  at: 'var(--atencao)',
  cr: 'var(--critico)',
  ac: 'var(--acao)',
  az: 'var(--azul)',
  '': 'var(--tinta-3)',
};

export function Status({ children }) {
  const tom = TONS[children] ?? '';

  return (
    <span className={`pil ${tom}`}>
      <span className="pil-pt" style={{ background: PONTOS[tom] }} />
      {children}
    </span>
  );
}
