# Tabelas de 2026: conferência

Fase 7 do [redesenho](redesenho.md). Os valores usados nos cálculos estão em [lib/tabelas.js](../lib/tabelas.js), que é a fonte da verdade; este documento serve para conferir. Levantamento de 13/10/2026, **conferido pelo usuário em 13/10/2026** (decisões no fim).

> **Antes do uso com clientes reais, as tabelas e os cálculos serão revisados pela contabilidade parceira.** Até lá, o sistema só os usa nos dados de demonstração.

Tudo aqui serve a **estimativas gerenciais** (custo estimado de pessoal, folha gerencial, rescisão estimada). O cálculo oficial é o da contabilidade.

**Confiança:**
- **Oficial:** lei, decreto, portaria, IN ou página do órgão.
- **Calculado:** conta feita sobre valores oficiais.
- **Jurisprudência:** entendimento de tribunal, que pode mudar.
- **Secundária:** só achada em fonte secundária.

## Valores

| Item | Valor 2026 | Fonte | Confiança |
|---|---|---|---|
| Salário mínimo | R$ 1.621,00 (dia R$ 54,04; hora R$ 7,37) | [Decreto 12.797/2025](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/D12797.htm), art. 1º | Oficial |
| INSS do empregado | 7,5% até 1.621,00; 9% até 2.902,84; 12% até 4.354,27; 14% até 8.475,55 (teto) | [Portaria Interministerial MPS/MF 13/2026](https://www.in.gov.br/web/dou/-/portaria-interministerial-mps/mf-n-13-de-9-de-janeiro-de-2026-680382603), art. 7º e Anexo II | Oficial |
| INSS máximo | R$ 988,09 | soma das faixas | Calculado |
| IRRF, tabela mensal | isento até 2.428,80; 7,5% (−182,16) até 2.826,65; 15% (−394,16) até 3.751,05; 22,5% (−675,49) até 4.664,68; 27,5% (−908,73) acima | Lei 11.482/2007, art. 1º, XII (red. Lei 15.191/2025) | Oficial |
| IRRF, dependente | R$ 189,59 | Lei 9.250/1995, art. 4º, III, "i" | Oficial |
| IRRF, desconto simplificado | R$ 607,20 por mês | Lei 9.250/1995, art. 4º, § 2º | Oficial |
| IRRF, redução de 2026 | até R$ 5.000,00 de rendimento bruto, o imposto zera (redução de até R$ 312,89); de 5.000,01 a 7.350,00, redução de 978,62 − 0,133145 × rendimento; acima, nada | [Lei 15.270/2025](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15270.htm) (Lei 9.250, art. 3º-A); [exemplos da Receita](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/exemplos-de-aplicacao-da-lei-15-270-2025) | Oficial |
| Salário-família | cota de R$ 67,54 por filho, para remuneração até R$ 1.980,38 | Portaria MPS/MF 13/2026, art. 4º | Oficial |
| FGTS | 8% (aprendiz 2%) | Lei 8.036/1990, art. 15 e § 7º | Oficial |
| Multa do FGTS | 40% na dispensa sem justa causa e no término antecipado da experiência; 20% no acordo; nada no pedido de demissão, na justa causa e no fim normal da experiência. Os 10% da LC 110 estão extintos desde 2020 | Lei 8.036, art. 18; CLT, art. 484-A; Decreto 99.684/1990, art. 14; Lei 13.932/2019, art. 12 | Oficial |
| INSS patronal (Presumido e Real) | 20% + RAT (1%, 2% ou 3%) × FAP (0,5 a 2,0; sem o FAP da empresa, 1,0) | Lei 8.212/1991, art. 22; Decreto 3.048/1999, arts. 202 e 202-A | Oficial |
| Terceiros por FPAS | 507 e 515: 5,8%; 566 e 574 (escolas): 4,5%; 612 (transporte rodoviário): 5,8%; 540 e 558: 5,2%; 736 (financeiras, cota de 22,5%): 2,7%; 639 (beneficente): isento | IN RFB 2.110/2022, Anexo III, atualizado pela IN RFB 2.321/2026 | Oficial |
| Simples Nacional | Anexos I, II, III e V: patronal dentro do DAS (fora do custo da folha). Anexo IV: 20% + RAT × FAP à parte. Nenhum anexo paga terceiros. FGTS normal | LC 123/2006, arts. 13 e 18, § 5º-C; IN RFB 2.110, arts. 164 e 171 | Oficial |
| Desoneração (só registro) | 2026: 10% sobre a folha (+ 60% da CPRB), sem incidir no 13º; 2027: 15%; 2028: volta a 20% | Lei 12.546/2011, art. 9º-A | Oficial |
| Terço de férias | 1/3 a mais | CF, art. 7º, XVII | Oficial |
| Férias em dobro | depois do período concessivo | CLT, arts. 134 e 137 | Oficial |
| 13º e férias proporcionais | mês com 15 dias ou mais de trabalho conta como mês | Lei 4.090/1962, art. 1º, § 2º; CLT, art. 146 | Oficial |
| Aviso prévio | 30 dias + 3 por ano completo, até 90; o indenizado conta como tempo de serviço (projeta avos) | Lei 12.506/2011; CLT, art. 487, § 1º | Oficial (a contagem "por ano completo" é da Nota Técnica 184/2012/MTE: Secundária) |
| Art. 479 | metade do que receberia até o fim da experiência encerrada antes, sem justa causa | CLT, arts. 479 a 481 | Oficial |
| Vale-transporte | a empresa paga o que passa de 6% do salário básico | Lei 7.418/1985, art. 4º; Decreto 10.854/2021 | Oficial |

## O que entra na base de cada encargo

| Verba | INSS (empregado e patronal) | FGTS | IRRF | Fonte | Confiança |
|---|---|---|---|---|---|
| Salário e saldo de salário | sim | sim | sim | Lei 8.212, art. 28; Lei 8.036, art. 15 | Oficial |
| 13º | sim | sim | sim | STF, Súmula 688 | Oficial |
| Férias gozadas com o terço | sim | sim | sim | STF, Tema 985 | Jurisprudência |
| Férias indenizadas com o terço (rescisão) | não | não | não | Lei 8.212, art. 28, § 9º, "d"; Lei 8.036, art. 15, § 6º; STJ, Súmula 386 | Oficial |
| Aviso prévio indenizado | não | sim | não | STJ, Tema 478; TST, Súmula 305 | Jurisprudência |
| 13º sobre o aviso indenizado | sim | sim | sim | STJ, Tema 1.170 (o STF ainda vai julgar no Tema 1.445) | Jurisprudência |
| Indenização do art. 479 e multa do FGTS | não | não | não | Lei 8.212, art. 28, § 9º, "e" | Oficial |

A multa do FGTS não incide sobre o FGTS do aviso indenizado (TST, OJ 42, II, da SDI-1).

## Verbas da rescisão por tipo

| Tipo | Saldo | Aviso indenizado | 13º proporcional | Férias vencidas | Férias proporcionais | Art. 479 | Multa do FGTS |
|---|---|---|---|---|---|---|---|
| Dispensa sem justa causa | sim | inteiro | sim | sim | sim | não | 40% |
| Término antecipado da experiência | sim | não | sim | sim | sim | sim | 40% |
| Pedido de demissão | sim | não | sim | sim | sim | não | não |
| Acordo entre as partes | sim | metade | sim | sim | sim | não | 20% |
| Dispensa com justa causa | sim | não | não | sim | não | não | não |
| Término normal da experiência | sim | não | sim | sim | sim | não | não |

Fontes: CLT, arts. 146, 147, 477, 479, 484-A e 487; Lei 4.090/1962, art. 3º; TST, Súmulas 157, 171 e 261.

## Escolhas da estimativa

1. **Arredondamento:** centavos, meio para cima, no total. O INSS de quem ganha o mínimo dá R$ 121,58; há sistemas que truncam e dão R$ 121,57.
2. **Sexta-feira da Paixão** entra como feriado nos prazos de pagamento. Pela Lei 9.093/1995, ela é feriado religioso municipal, mas o calendário federal a trata como nacional. Carnaval e Corpus Christi não entram, porque são ponto facultativo.
3. **FAP:** sem o valor da empresa, a estimativa usa 1,0.
4. **Saldo do FGTS para a multa:** o saldo real, quando informado na ficha, substitui a estimativa. Sem ele, a estimativa usa 8% do salário atual em cada mês do contrato, com o 13º e o terço proporcionais, sem juros, atualização nem saques.
5. **Acordo:** paga metade do aviso (arredondada para cima em dias) e projeta só essa metade nos avos.
6. **Adiantamentos:** a rescisão estimada desconta a 1ª parcela do 13º quando ela já foi paga: pelo valor informado ou, sem ele, a partir do prazo legal (30/11, no dia útil anterior), como metade do salário, limitada ao 13º do ano. O INSS do 13º continua sobre o total; o FGTS da parcela já foi depositado quando ela foi paga. Os outros adiantamentos (férias já pagas, vales) não são descontados.
7. **Custo do mês:** salário + provisões de férias (com o terço) e de 13º + encargos sobre os três + a parte da empresa nos benefícios. No Simples (Anexos I, II, III e V), só o FGTS entra nos encargos, porque o resto está no DAS, que incide sobre a receita.

## Casos conferidos nos testes

Os casos estão em [testes/calculos.test.js](../testes/calculos.test.js).
- **INSS:** 1.621,00 dá 121,58; 3.036,00 dá 252,92; 4.000,00 dá 368,60; 5.000,00 dá 501,51; 6.000,00 dá 641,51; no teto, 988,09.
- **IRRF:** os cinco exemplos oficiais da Receita.
  - 3.036,00, 4.000,00 e 5.000,00: imposto zero.
  - 6.000,00, com o INSS de 649,60 do exemplo: imposto de 382,88.
  - 7.607,20: imposto de 1.016,27.
- **Custo mensal**, salário de 3.000,00 no Lucro Presumido, FPAS 515, RAT 2%, com VT e VR: R$ 5.500,17.
- **Rescisão por dispensa sem justa causa**, salário de 3.000,00 com 3 anos de casa:
  - verbas: saldo de 13 dias, 1.300,00; aviso de 39 dias, 3.900,00; 13º de 11/12, 2.750,00; férias vencidas simples, 4.000,00; férias proporcionais de 9/12, 3.000,00;
  - total das verbas: 14.950,00;
  - encargos sobre a base de INSS de 4.050,00: 1.125,90;
  - FGTS do mês, sobre 7.950,00: 636,00;
  - multa de 40% sobre o saldo estimado.
- **Término antecipado da experiência:** inclui o art. 479 (47 dias restantes, 1.566,67).
- **Justa causa com férias em dobro.**
- **Pedido de demissão e acordo.**

## Decisões da conferência (13/10/2026)

1. Arredondamento meio para cima: aprovado.
2. As três incidências que vêm de jurisprudência (aviso indenizado sem INSS e com FGTS, 13º sobre o aviso com INSS, terço de férias gozadas com INSS patronal): aprovadas.
3. Sexta-feira da Paixão como feriado: aprovada. Melhoria futura: cadastrar a cidade de cada CNPJ para considerar os feriados municipais e estaduais.
4. FAP 1,0 quando a empresa não informa: aprovado.
5. Saldo do FGTS estimado: aprovado, com o saldo real informado na ficha substituindo a estimativa quando existir.
6. Acordo com metade do aviso: aprovado.
7. Rescisão estimada: desconta a 1ª parcela do 13º quando ela já foi paga; os outros adiantamentos continuam sem desconto.

Próximo passo obrigatório: **revisão pela contabilidade parceira** antes do uso com clientes reais.

