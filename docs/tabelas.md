# Estimativas de custo: parâmetros

Os valores usados nas estimativas estão em [lib/tabelas.js](../lib/tabelas.js), que é a fonte da verdade, e o cálculo está em [lib/calculos/custo.js](../lib/calculos/custo.js). Este documento explica o modelo.

> **Regra do produto (13/10/2026): a plataforma mostra a ordem de grandeza dos custos para a gestão; cálculos trabalhistas são da contabilidade.**

Tudo aqui é **estimativa gerencial** ("custo estimado de pessoal", "folha gerencial") e aparece identificado como tal. A ideia é o cliente entender os números, sem refazer a folha.

## O modelo

| Parte | Como se estima |
|---|---|
| Salários | soma dos salários cadastrados, já com as movimentações em vigor |
| Provisão de férias | salário ÷ 12, mais 1/3 |
| Provisão de 13º | salário ÷ 12 |
| Encargos | um percentual único do regime tributário sobre salários e provisões, configurável por empresa |
| Benefícios | soma dos valores cadastrados |
| Total | a soma de tudo |
| Fator de custo | total ÷ salários: quanto cada R$ 1 de salário custa |

Os valores são arredondados em centavos, meio para cima.

## Percentual de encargos

| Regime | Padrão | O que representa |
|---|---|---|
| Simples Nacional (Anexos I, II, III e V) | cerca de 8% | só o FGTS; a contribuição patronal já está no DAS |
| Simples Nacional, Anexo IV | cerca de 36% | FGTS e contribuição patronal, que no Anexo IV é paga à parte |
| Lucro Presumido | cerca de 36% | FGTS, contribuição patronal e demais encargos sobre a folha |
| Lucro Real | cerca de 36% | FGTS, contribuição patronal e demais encargos sobre a folha |

- **Percentual da empresa:** quando a empresa tem o percentual configurado, ele substitui o padrão. Fica entre 0% e 80%, para barrar erro de digitação.
- **Dado faltando:** se faltar o anexo do Simples, vale 8% com o aviso **"anexo a conferir"**. Se faltar o regime tributário, vale 8% com o aviso **"regime a conferir"**. A estimativa nunca deixa de aparecer, e o aviso aparece no cadastro da empresa e no selo de estimativa.

## 13º estimado

Na folha gerencial (aba Provisões e 13º): salário de hoje × avos ÷ 12, em que os avos são os meses do ano com 15 dias ou mais de trabalho. Metade vai na 1ª parcela (até 30/11) e o resto na 2ª (até 20/12), com o vencimento no dia útil anterior. Não tira INSS nem IRRF: esses ficam com a contabilidade.

## Custos admissionais e demissionais

São **valores informados pela empresa**, sem cálculo:
- ao registrar a admissão: exames, uniforme e outros;
- ao registrar o desligamento: rescisão paga, multa e outros, conforme o que a contabilidade apurar.

## Fora do escopo

Ficam com a contabilidade, e a plataforma não estima:
- INSS e IRRF do colaborador;
- rescisão item por item;
- saldo e multa do FGTS;
- incidências que dependem de jurisprudência;
- FAP, RAT e terceiros detalhados;
- "custo de desligar hoje".

A versão anterior, com esses cálculos e a conferência das tabelas de 2026 (fase 7), está no histórico do git, no commit `e59e674`.

## Prazos

Os prazos (pagamento de férias, rescisão e 13º no dia útil anterior, INSS a partir do 16º dia) continuam: são datas, não cálculos. Estão em [lib/regrasDePrazo.js](../lib/regrasDePrazo.js) e [lib/calendario.js](../lib/calendario.js).
- A **Sexta-feira da Paixão** entra como feriado.
- Carnaval e Corpus Christi não entram, porque são ponto facultativo.
- Melhoria futura: cadastrar a cidade de cada CNPJ, para considerar os feriados municipais e estaduais.

Antes do uso com clientes reais, a contabilidade parceira confere os percentuais padrão.
