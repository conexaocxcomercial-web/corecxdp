/** Esqueleto de Pendências enquanto os dados chegam. */
export default function CarregandoPendencias() {
  return (
    <div aria-busy="true" aria-label="Carregando as pendências">
      <header className="cab">
        <h1 className="cab-tit">Pendências</h1>
        <span className="esqueleto" style={{ height: 18, width: 260, marginTop: 12 }} />
      </header>
      <div className="wrap">
        <span className="esqueleto" style={{ height: 22, width: 180, marginBottom: 16 }} />
        <span className="esqueleto" style={{ height: 300 }} />
        <span className="esqueleto" style={{ height: 22, width: 120, margin: '40px 0 16px' }} />
        <span className="esqueleto" style={{ height: 420 }} />
      </div>
    </div>
  );
}
