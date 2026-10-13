# core.cx — Conceito e funcionamento da plataforma

Documento de produto. Define o que a plataforma é, para quem, como funciona e o que ela precisa entregar.
É a base para o PRODUCT.md e para o redesenho completo do sistema.

---

## 1. Visão

Plataforma de departamento pessoal para pequenas e médias empresas: **todas as informações de DP num lugar só, fáceis de encontrar e de entender**, com foco em custos, indicadores e alertas de prazo.

Nome provisório: **core.cx**. A marca final será definida depois da apresentação à contabilidade parceira.

---

## 2. Modelo de negócio

### Canais de venda
A plataforma é uma só, vendida por **parceiros**. Cada parceiro vende para os próprios clientes e usa a plataforma com eles, sempre do mesmo jeito:

- **Conexão CX:** vende para os clientes do RH Estratégico (consultoria de RH mensal).
- **Contabilidade parceira:** vende para os clientes da contabilidade, em modelo white-label.
- **Futuro:** outras contabilidades. Cada nova contabilidade é mais um parceiro.

Um parceiro nunca vê os clientes de outro parceiro.

### White-label
Cada parceiro pode ter a própria identidade na plataforma (no mínimo, logo e cores). A estrutura deve permitir isso desde já, mesmo que o primeiro lançamento use a marca core.cx.

### Cliente final
- Pequenas e médias empresas, de qualquer segmento
- Com ou sem RH interno
- Um cliente pode ter **vários CNPJs** (matriz, filiais, grupo econômico), todos ligados ao mesmo cadastro. Os dados podem ser vistos por CNPJ ou consolidados.

### Escala esperada
A estrutura deve suportar de dezenas a cerca de 500 clientes em 12 meses.

### Suporte
O suporte aos clientes finais é feito pela Conexão CX.

---

## 3. Perfis e permissões

| Perfil | O que vê | O que faz |
|---|---|---|
| **Administração da plataforma** (Conexão CX) | Tudo, de todos os parceiros | Só administração e suporte: cria parceiros, empresas e usuários, e resolve problemas |
| **Parceiro** (contabilidade ou Conexão CX como consultoria) | Tudo dos clientes dele, cliente a cliente ou consolidado | Consulta, acompanha indicadores e exporta relatórios. Não lança dados nem aprova. |
| **Gestão da empresa** (dono e RH interno, com o mesmo acesso) | Tudo das empresas e CNPJs do cliente | Cadastra, lança, aprova e gerencia os usuários da empresa |
| **Colaborador** (fase 2) | Só os próprios dados | Envia atestado, pede férias e consulta os próprios dados cadastrais |

Regras:
- Dentro da Gestão da empresa, qualquer usuário pode aprovar.
- Toda ação relevante fica registrada com autor e data ("férias aprovadas por Maria em 12/10").
- O colaborador **não** terá acesso a holerite.
- No futuro, pode surgir um perfil de gestor de área (vê só a própria equipe), sem redesenho.

### Uso por dispositivo
Todos os perfis usam pelo celular, exceto o Parceiro, que usa principalmente no computador. A plataforma é **mobile-first**.

---

## 4. Como os dados funcionam

- **A plataforma é autossuficiente.** Todos os dados são cadastrados nela. Não há integração nem troca de dados com sistemas de contabilidade.
- **Quem cadastra é a Gestão da empresa**, de duas formas:
  - um a um, pelos formulários;
  - por **upload de planilha**: baixa o modelo, preenche e sobe.
- **A planilha modelo aceita ex-colaboradores dos últimos 12 meses**, com data, tipo e motivo do desligamento, para que o turnover já nasça com histórico. O que mais ela traz e como funciona a implantação de uma empresa que já existe está na seção 11.
- **A plataforma mostra a ordem de grandeza dos custos para a gestão; cálculos trabalhistas são da contabilidade.** Não há INSS nem IRRF do colaborador, rescisão calculada, saldo ou multa do FGTS, nem encargos detalhados (decisão de 13/10/2026).
- **A folha gerencial nasce do cadastro**, com estimativas simples:
  - **salários:** soma dos salários cadastrados;
  - **provisão de férias:** salário ÷ 12, mais 1/3;
  - **provisão de 13º:** salário ÷ 12;
  - **encargos:** um percentual único por regime tributário, configurável por empresa (padrão de cerca de 8% no Simples, só o FGTS, e cerca de 36% no Lucro Presumido, no Lucro Real e no Anexo IV do Simples);
  - **benefícios:** soma dos valores cadastrados;
  - **total e fator de custo** (quanto cada R$ 1 de salário custa).
- **Toda conta é estimativa** e aparece identificada como tal. O nome usado é **"custo estimado de pessoal"** ou **"folha gerencial"**, nunca apenas "folha".
- **Os percentuais e as frações** ficam num único arquivo de configuração ([lib/tabelas.js](../lib/tabelas.js), explicado em [docs/tabelas.md](tabelas.md)). Nunca valores soltos no código.
- **Dado faltando não esconde a estimativa:** sem o anexo do Simples ou sem o regime, vale 8%, com o aviso "anexo a conferir" ou "regime a conferir" no cadastro da empresa e no selo de estimativa.
- **A plataforma guarda documentos** dos colaboradores (contrato, exames, atestados digitalizados), com validade quando houver.

### Dados obrigatórios no cadastro
- **Empresa:** CNPJs, filiais, departamentos, regime tributário, percentual de encargos (opcional; sem ele, vale o padrão do regime) e data de implantação. No Simples Nacional, também o anexo, porque no Anexo IV a contribuição patronal é paga à parte.
- **Colaborador:** CNPJ, departamento, cargo, tipo de contrato (indeterminado, experiência, estágio, aprendiz, temporário), data de admissão, salário, jornada, data de nascimento, benefícios (valor e desconto) e documentos com validade.
- **Desligamento:** data, tipo, motivo e custos demissionais informados pela empresa (rescisão paga, multa e outros, como a contabilidade apurar).
- **Admissão:** custos admissionais informados pela empresa (exames, uniforme, outros).
- **Atestado:** período, dias e CID (com a opção "não informado").

---

## 5. Escopo

### Módulos
- Colaboradores (cadastro e ficha completa)
- Admissões e desligamentos
- Ocorrências (faltas, advertências, suspensões)
- Atestados
- Movimentações (reajustes, promoções, mudanças de cargo, transferências)
- Folha gerencial: salários, proventos, descontos e custo estimado
- Férias: programação, pagamento e provisão
- 13º salário: pagamento e provisão
- Benefícios: VA, VR, VT, plano de saúde e outros
- Encargos: percentual único estimado, conforme o regime
- Custos admissionais e demissionais, informados pela empresa
- Documentos
- Indicadores e painéis

### Fora do escopo
- Controle de ponto
- eSocial
- Integração com sistemas de contabilidade
- Holerite
- Cálculo oficial de folha (a plataforma estima, a contabilidade calcula)
- Cálculos trabalhistas: INSS e IRRF do colaborador, rescisão item por item, saldo e multa do FGTS, incidências de jurisprudência, FAP e RAT detalhados e "custo de desligar hoje"

---

## 6. Aprovações e alertas

### Fluxos
| Ação | Quem inicia | Aprovação |
|---|---|---|
| Atestado | Gestão da empresa (e colaborador, na fase 2) | Gestão valida |
| Férias | Gestão da empresa (e colaborador, na fase 2) | Gestão aprova |
| Admissão | Gestão da empresa | Não precisa |
| Desligamento | Gestão da empresa | Confirmação antes de concluir |
| Mudança de salário ou cargo | Gestão da empresa | Não precisa (fica no histórico) |
| Ocorrências | Gestão da empresa | Não precisa (fica no histórico) |

As aprovações acontecem só dentro da empresa. A contabilidade não recebe avisos nem solicitações.

### Alertas automáticos de prazo (para a Gestão da empresa)
- Contrato de experiência vencendo (45 e 90 dias). Se passar do prazo, o contrato vira indeterminado.
- Férias vencendo e férias vencidas (férias não concedidas no prazo são pagas em dobro).
- Férias: aviso ao colaborador com 30 dias de antecedência e pagamento até 2 dias antes do início.
- Rescisão: pagamento em até 10 dias após o desligamento.
- Admissão: registro antes do primeiro dia de trabalho.
- Afastamento por atestado acima de 15 dias: encaminhamento ao INSS. Afastamentos pela mesma doença (mesmo CID) com intervalo de até 60 dias somam os dias para contar os 15 dias da empresa e o encaminhamento.
- 13º: 1ª parcela até 30/11 e 2ª até 20/12.
- Prazos de pagamento (férias, rescisão e 13º) que caem em fim de semana ou feriado antecipam para o dia útil anterior. Ex.: em 2026, 20/12 é domingo, e a 2ª parcela do 13º vence em 18/12.
- Documentos vencendo (por exemplo, exame periódico).
- Atestados aguardando validação.

---

## 7. Ficha do colaborador

Tela central do dia a dia: tudo sobre uma pessoa num lugar só.

**Topo (resumo em 5 segundos):** nome, cargo, departamento, CNPJ, situação, tempo de casa, alertas dele e ações rápidas (lançar atestado, programar férias, registrar ocorrência, registrar movimentação, desligar).

**Seções:**
1. Dados pessoais: documentos, contato, endereço e dependentes
2. Contrato: tipo, admissão, jornada e situação da experiência
3. Remuneração: salário atual, histórico de reajustes, benefícios e custo total estimado para a empresa
4. Férias: períodos aquisitivos com saldo, férias tiradas (de quando a quando), programadas e pendentes com prazo limite
5. Atestados: período, dias e CID (restrito), e total de dias nos últimos 12 meses
6. Ocorrências
7. Movimentações
8. Documentos, com validade
9. Desligamento (se houver): data, tipo, motivo e custos demissionais informados

**Linha do tempo:** todos os eventos da pessoa em ordem de data, com quem registrou cada um.

**Números dele:** tempo de casa, dias de atestado no ano, faltas no ano, saldo de férias e custo estimado do mês.

**No celular:** resumo e alertas primeiro; seções em blocos que abrem e fecham ou abas deslizantes.

---

## 8. Indicadores

Princípio: **todo dado coletado vira indicador**. Prioridade para o que envolve **custo financeiro**.

### Organização em camadas
1. **Tela inicial:** o essencial (pendências, alertas e os 4 ou 5 números principais).
2. **Painel por tema:** Custos, Quadro, Absenteísmo e Saúde, Férias e 13º, Benefícios, Movimentações.
3. **Detalhe:** ao clicar num número, chega-se à lista e ao colaborador.

Todos os indicadores podem ser vistos por CNPJ, filial e departamento, com evolução mês a mês.

### Quadro de pessoal
- Ativos por CNPJ, filial, departamento, cargo e tipo de contrato; evolução mensal
- Tempo médio de casa e distribuição por faixa
- Faixa etária (e gênero, se coletado)
- Salário médio por cargo e departamento; diferença entre maior e menor salário do mesmo cargo
- Contratos de experiência ativos e vencendo
- Afastados

### Admissões
- Admissões por mês, departamento e cargo
- Custo admissional informado: total e médio
- Retenção na experiência (quantos passam dos 90 dias)

### Desligamentos
- Desligamentos por mês e por tipo
- **Turnover** mensal e anual: geral, voluntário e involuntário, por departamento
- Turnover precoce (menos de 90 dias e menos de 1 ano)
- Custos demissionais informados: total, médio e por tipo
- Tempo médio de casa de quem saiu; motivos de saída

### Folha gerencial
- Salários (soma dos cadastrados)
- Custo estimado de pessoal: salários + provisões + encargos + benefícios, e sua composição
- Custo médio por colaborador, departamento e CNPJ
- **Fator de custo:** quanto cada R$ 1 de salário custa para a empresa
- Evolução mensal e variação sobre o mês anterior

### Encargos
- Encargos estimados pelo percentual do regime (ou o da empresa), com o percentual usado à mostra

### Férias
- Férias vencidas
- Férias vencendo em 30, 60 e 90 dias
- Programadas, aprovadas e em andamento; saldo por colaborador
- Provisão mensal estimada (salário ÷ 12, mais 1/3)
- Percentual do quadro com férias em dia

### 13º salário
- Provisão mensal estimada (salário ÷ 12)
- Estimativa da 1ª e da 2ª parcela (metade do salário cada); impacto no caixa

### Benefícios
- Custo por tipo, médio por colaborador e peso no custo total
- Parte paga pela empresa e parte descontada do colaborador
- Colaboradores sem determinado benefício

### Ocorrências e absenteísmo
- Faltas por mês, departamento e colaborador
- Taxa de absenteísmo e dias perdidos
- Custo do absenteísmo
- Advertências e suspensões; reincidência

### Atestados e saúde
- Atestados e dias de afastamento por mês e departamento
- Atestados aguardando validação e tempo médio de validação
- Por grupo de doença (capítulos do CID-10): frequência e dias perdidos
- CIDs e grupos mais frequentes
- **Recorrência:** mesmo grupo de CID repetido por colaborador e por departamento
- **Fatores de risco:** concentração de um grupo de doença num departamento ou cargo
- Sazonalidade por grupo
- Afastamentos acima de 15 dias por grupo

### Movimentações
- Reajustes: quantidade, percentual médio e impacto na folha
- Promoções, mudanças de cargo e transferências
- Colaboradores há mais de 12 meses sem reajuste

### Documentos
- Pendências por colaborador e percentual de cadastros completos
- Documentos vencendo

### Indicadores que cruzam módulos
- Custo do turnover (custos demissionais e admissionais informados)
- Previsão de custos dos próximos meses (férias programadas e 13º)
- Custo total por departamento

### Visão do parceiro
- Indicadores consolidados de todos os clientes
- Clientes com mais turnover, maior custo ou alertas críticos
- Comparação entre clientes

---

## 9. Regras de privacidade (LGPD)

- **CID:** registrado em todo atestado, com a opção "não informado" (o médico só informa o CID com autorização do paciente).
- O CID individual é visível só para a Gestão da empresa e para a administração da plataforma.
- Indicadores de saúde aparecem **sempre agregados**, sem nome.
- **Grupos pequenos ficam ocultos:** indicadores de saúde por departamento só aparecem quando o grupo tem pelo menos 3 pessoas.
- Salário, CPF e dados bancários aparecem mascarados nas listas e são revelados por ação explícita.

---

## 10. Tela inicial por perfil

- **Gestão da empresa:** organizada por assunto. No topo, uma faixa de urgência fina, só quando há algo vencido ou vencendo em até 2 dias, levando a Pendências; depois, o quadro e como está o negócio (custo estimado de pessoal do mês comparado ao anterior, turnover e absenteísmo); e um quadro por assunto (pessoas e contratos, férias e 13º, saúde e afastamentos, ocorrências, documentos, desligamentos), cada um com o que espera ação. As aprovações e os prazos ficam numa fila única, Pendências. Uso esperado: pontual, para aprovar, e mensal, para acompanhar.
- **Parceiro:** visão consolidada dos clientes, clientes com alertas críticos e acesso rápido a cada cliente.
- **Administração da plataforma:** parceiros, clientes, usuários e suporte.

---

## 11. Implantação em empresas que já existem

A maior parte dos clientes chega com anos de história. A implantação traz o essencial dessa história sem gerar alertas falsos no primeiro dia.

- **Planilha modelo**, com abas para:
  - **empresa:** CNPJs, filiais, departamentos, regime tributário e, no Simples Nacional, o anexo;
  - **colaboradores ativos**;
  - **ex-colaboradores dos últimos 12 meses**, com data, tipo e motivo do desligamento;
  - **férias:** períodos aquisitivos e férias já tiradas, desde o período aberto mais antigo;
  - **atestados dos últimos 12 meses**, com dias e CID;
  - **reajustes e mudanças de cargo** (opcional);
  - **benefícios atuais**.
- **A importação mostra os erros por linha**, para corrigir no Excel e subir de novo.
- **Cada empresa tem uma data de implantação.** Prazos vencidos antes dessa data aparecem como **"a conferir na implantação"**, e não como vencidos.
- **Revisão antes dos alertas:** depois da importação, a Gestão passa por uma revisão do que parece inconsistente (férias aparentemente vencidas, experiências abertas, documentos sem validade). Os alertas de prazo começam quando a revisão termina.
- **Regime tributário:** no Simples Nacional, o cadastro pede também o anexo, porque no Anexo IV a contribuição patronal é paga à parte e o percentual padrão de encargos muda (de cerca de 8% para cerca de 36%). Sem o anexo ou sem o regime, a estimativa usa 8% com o aviso "anexo a conferir" ou "regime a conferir".
