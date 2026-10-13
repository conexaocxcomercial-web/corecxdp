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
- **A planilha modelo aceita ex-colaboradores dos últimos 12 meses**, com data, tipo e motivo do desligamento, para que o turnover já nasça com histórico.
- **A folha nasce do cadastro:** salário e benefícios de cada colaborador, mais as regras de encargos e provisões.
- **Todo cálculo é estimativa** para gestão e conferência, e aparece identificado como tal. O nome usado é **"custo estimado de pessoal"** ou **"folha gerencial"**, nunca apenas "folha".
- **Alíquotas e tabelas** (INSS, FGTS, IRRF etc.) ficam num único arquivo de configuração, fácil de atualizar. Nunca valores soltos no código, nunca valores inventados.
- **Os encargos dependem do regime tributário** de cada empresa (Simples Nacional, Lucro Presumido ou Lucro Real), cadastrado por empresa.
- **A plataforma guarda documentos** dos colaboradores (contrato, exames, atestados digitalizados), com validade quando houver.

### Dados obrigatórios no cadastro
- **Empresa:** CNPJs, filiais, departamentos e regime tributário (com as alíquotas de encargos).
- **Colaborador:** CNPJ, departamento, cargo, tipo de contrato (indeterminado, experiência, estágio, aprendiz, temporário), data de admissão, salário, jornada, data de nascimento, benefícios (valor e desconto) e documentos com validade.
- **Desligamento:** data, tipo e motivo.
- **Admissão:** custos admissionais lançados (exames, uniforme, outros).
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
- Encargos: FGTS, INSS patronal e demais, conforme o regime
- Custos admissionais e demissionais, incluindo estimativa de rescisão
- Documentos
- Indicadores e painéis

### Fora do escopo
- Controle de ponto
- eSocial
- Integração com sistemas de contabilidade
- Holerite
- Cálculo oficial de folha (a plataforma estima, a contabilidade calcula)

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
- Afastamento por atestado acima de 15 dias: encaminhamento ao INSS.
- 13º: 1ª parcela até 30/11 e 2ª até 20/12.
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
9. Desligamento (se houver): data, tipo, motivo e custo da rescisão

**Linha do tempo:** todos os eventos da pessoa em ordem de data, com quem registrou cada um.

**Números dele:** tempo de casa, dias de atestado no ano, faltas no ano, saldo de férias e custo de desligar hoje.

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
- Custo admissional total e médio
- Retenção na experiência (quantos passam dos 90 dias)

### Desligamentos
- Desligamentos por mês e por tipo
- **Turnover** mensal e anual: geral, voluntário e involuntário, por departamento
- Turnover precoce (menos de 90 dias e menos de 1 ano)
- Custo das rescisões: total, médio e por tipo
- Tempo médio de casa de quem saiu; motivos de saída
- **Custo de desligar hoje:** simulação de rescisão por colaborador e total (saldo, aviso prévio proporcional, férias com 1/3, 13º proporcional, multa de 40% do FGTS)

### Folha gerencial
- Folha bruta estimada
- Custo total de pessoal: folha + encargos + benefícios + provisões, e sua composição
- Custo médio por colaborador, departamento e CNPJ
- **Fator de custo:** quanto cada R$ 1 de salário custa para a empresa
- Evolução mensal e variação sobre o mês anterior

### Encargos
- FGTS do mês; INSS patronal conforme o regime
- Total de encargos e percentual sobre a folha
- Saldo estimado de FGTS por colaborador

### Férias
- Férias vencidas, com o custo estimado da dobra
- Férias vencendo em 30, 60 e 90 dias
- Programadas, aprovadas e em andamento; saldo por colaborador
- Provisão mensal e acumulada; custo das férias pagas
- Percentual do quadro com férias em dia

### 13º salário
- Provisão mensal e acumulada
- Estimativa da 1ª e da 2ª parcela; impacto no caixa

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
- Custo do turnover (desligar e repor)
- Previsão de custos dos próximos meses (férias programadas, 13º, rescisões previstas)
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

- **Gestão da empresa:** 1) o que precisa de ação (aprovações pendentes); 2) alertas com prazo; 3) como está o negócio (custo estimado de pessoal do mês comparado ao anterior, quadro, turnover e absenteísmo). Uso esperado: pontual, para aprovar, e mensal, para acompanhar.
- **Parceiro:** visão consolidada dos clientes, clientes com alertas críticos e acesso rápido a cada cliente.
- **Administração da plataforma:** parceiros, clientes, usuários e suporte.