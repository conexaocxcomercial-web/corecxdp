'use client';

export default function ErroDoSistema({ error, reset }) {
  return (
    <div className="wrap">
      <div className="cartao">
        <div className="cartao-t">A ação não foi concluída</div>
        <div className="cartao-d">
          {error?.message ||
            'O registro não chegou até a planilha. Tente de novo; se persistir, confira o acesso da conta de serviço à planilha.'}
        </div>
        <button type="button" className="btn btn-acao" onClick={reset}>
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
