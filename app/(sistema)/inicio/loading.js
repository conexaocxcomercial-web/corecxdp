/** Esqueleto do Início enquanto os dados chegam: a faixa violeta e os quadros. */
export default function CarregandoInicio() {
  return (
    <div className="ini" aria-busy="true" aria-label="Carregando o Início">
      <section className="ini-faixa">
        <div className="ini-faixa-in">
          <div>
            <span className="esqueleto" style={{ height: 52, width: '72%' }} />
            <span className="esqueleto" style={{ height: 26, width: '56%', marginTop: 18 }} />
            <span className="esqueleto" style={{ height: 16, width: '40%', marginTop: 16 }} />
          </div>
        </div>
      </section>
      <div className="ini-folha">
        <div className="ini-folha-in">
          <div className="ini-grade">
            {Array.from({ length: 6 }, (_, indice) => (
              <span key={indice} className="esqueleto" style={{ height: 268 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
