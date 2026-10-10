'use client';

// A mensagem do erro não vai para a tela: pode ser detalhe técnico da
// fonte de dados. Ela fica no log do servidor.
export default function ErroDoSistema({ reset }) {
  return (
    <div className="wrap">
      <div className="cartao">
        <div className="cartao-t">A ação não foi concluída</div>
        <div className="cartao-d">
          O registro não foi concluído. Tente de novo em alguns segundos; se o problema continuar,
          fale com quem administra a plataforma.
        </div>
        <button type="button" className="btn btn-acao" onClick={reset}>
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
