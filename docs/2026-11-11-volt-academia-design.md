# Volt Academia — Especificação de design

Data: 2026-11-11
Status: implementada (decisões do grilling incluídas)

## 1. Objetivo

Projeto de **portfólio** da JhemisonTech: site de agendamento (área do aluno) e painel admin para uma academia **fictícia** chamada **Volt Academia**. Deve funcionar sozinho para qualquer visitante, sem servidor e sem senha. Se um cliente real fechar, a camada de dados é trocada por Firebase (ver seção 4).

O site usa só o nome **Volt Academia**: nenhuma marca do autor aparece nas telas.

**Sucesso =** um visitante do portfólio, pelo celular ou computador, consegue em poucos cliques:
- entrar como aluno de demonstração, reservar e cancelar aula coletiva e atendimento individual;
- ver o bloqueio de um aluno em atraso;
- entrar no painel, registrar o pagamento desse aluno e ver o bloqueio sumir.

## 2. Decisões tomadas

| Tema | Decisão |
|---|---|
| Dados | `localStorage`, isolado em **um único arquivo** (`dados.js`) |
| Agendamento | **Os dois**: aulas coletivas com vagas + atendimento individual (Personal, Avaliação física). Cada tipo pode ser ligado/desligado no painel |
| Identificação do aluno | **Matrícula** (sem senha) + botões de demonstração |
| Mensalidade | Controlada: plano, vencimento, status, bloqueio de reserva em atraso, registro de pagamento |
| Pilha | HTML + CSS + **React 18 + htm** via módulos ES do CDN (esm.sh), **sem build**, versões fixas |
| Base | Estrutura de um modelo-base próprio (package.json, `npm test`, `formato.js` + testes, docs COMO-COMECAR / COMO-FUNCIONA, firebase.json só com Hosting) |
| Pasta | `Projetos/portfolio/volt-academia` (git local, sem remoto por enquanto) |
| Hospedagem | Firebase Hosting (só arquivos estáticos), quando o usuário decidir publicar |

## 3. Identidade visual

**Estilo:** escuro com blocos fortes ("Vibrant & Block-based + Dark Mode", recomendação do ui-ux-pro-max para academias), com o azul suave da JhemisonTech no lugar do laranja.

**Tokens de cor (`css/tokens.css`):**

| Token | Valor | Uso |
|---|---|---|
| `--fundo` | `#0a0f18` | fundo da página (não usar preto puro) |
| `--superficie` | `#121a28` | cartões, menus, modais |
| `--superficie-2` | `#1a2436` | hover, campos |
| `--borda` | `rgba(207,228,248,.12)` | divisórias |
| `--texto` | `#f5f9ff` | texto principal |
| `--texto-suave` | `#9fb4cc` | texto secundário |
| `--destaque` | `#38a3f5` | links, ícones, barra de vagas, foco |
| `--botao` | `#0b5cad` | fundo do botão principal (texto branco, contraste 6,7:1) |
| `--brilho` | `#38a3f5` | brilho (box-shadow) do botão e do logo |
| `--ok` / `--aviso` / `--erro` | verde / amarelo / vermelho | status, **sempre com ícone + texto** |

Regra: texto branco **não** vai sobre `#2f8fe6` (contraste 3,4:1, reprovado).

**Fontes (Google Fonts):** Barlow Condensed (títulos, 600–700) e Barlow (texto, 400–600), `font-display: swap`. Números com `font-variant-numeric: tabular-nums` em tabelas, preços e horários.

**Ícones:** SVG de traço fino no estilo Lucide, escritos como componentes próprios (sem biblioteca extra). Sem emoji como ícone. Ícone sozinho em botão tem `aria-label`.

**Movimento:** barra de vagas enchendo, brilho no hover do botão, "check" ao confirmar, modais com fade. Tudo desligado/reduzido com `prefers-reduced-motion`.

**Acessibilidade mínima:** contraste 4,5:1, foco visível, navegação por teclado, rótulos visíveis nos campos, erro perto do campo, alvos de toque ≥ 44px, sem rolagem horizontal em 375px.

## 4. Estrutura de arquivos

```
volt-academia/
  package.json            (npm test)
  firebase.json           (só Hosting, pasta public)
  README.md, COMO-FUNCIONA.md
  docs/                   (esta especificação e o plano)
  tests/                  (formato.test.js, regras.test.js)
  public/
    index.html            área do aluno
    admin.html            painel admin
    css/  tokens.css · base.css · componentes.css · aluno.css · admin.css
    js/
      react.js            importa React, ReactDOM e htm (versões fixas) e exporta `html`
      dados.js            ÚNICA camada de dados (localStorage)
      semente.js          dados de demonstração (datas relativas a hoje)
      regras.js           lógica pura, sem DOM e sem localStorage
      formato.js          datas, moeda, telefone (herdado do modelo)
      icones.js           componentes SVG
      componentes/        Botao, Cartao, Modal, Aviso (toast), BarraVagas, Status, Campo...
      aluno/app.js        telas do aluno
      admin/app.js        telas do painel
```

**Fronteiras:**
- `regras.js` recebe dados e devolve resultados (funções puras). É o que os testes cobrem.
- `dados.js` é o único arquivo que toca o `localStorage`. Expõe funções assíncronas (`listar`, `salvar`, `remover`, `restaurarDemo`...) para que a troca por Firebase não mude as telas.
- As telas só falam com `dados.js` e `regras.js`.

## 5. Modelo de dados

- **planos**: id, nome, valor, meses (ex.: Mensal 1, Trimestral 3, Semestral 6).
- **alunos**: id, matrícula, nome, whatsapp (fictício), planoId, vencimento (data).
- **pagamentos**: id, alunoId, data, valor, planoId.
- **profissionais**: id, nome, especialidade.
- **aulas** (coletivas, recorrentes): id, nome, profissionalId, diaSemana (0–6), hora, duração (min), vagas.
- **servicos** (individuais): id, nome (Personal, Avaliação física), duração.
- **disponibilidade**: profissionalId, diaSemana, início, fim, servicoIds.
- **reservas**: id, alunoId, tipo (`aula` | `individual`), aulaId ou servicoId+profissionalId, data, hora, situação (`confirmada` | `espera` | `cancelada`), criadaEm.
- **config**: aulasLigadas, individualLigado.

**Semente:** as datas são calculadas a partir de "hoje" toda vez que a demonstração é restaurada, para os três alunos de demonstração continuarem coerentes:
- Ana (matrícula 1001): em dia, vence daqui a 20 dias.
- Bruno (1002): vence em 3 dias.
- Carla (1003): em atraso há 7 dias.

A Ana tem treinos passados nas últimas semanas, para o cartão de energia aparecer cheio. A semente também inclui 9 alunos extras (o suficiente para lotar a Dança), os 4 profissionais e a grade da seção 7b, com reservas já feitas, para as barras de vagas e o painel não ficarem vazios. Todos os nomes e números de WhatsApp são fictícios.

## 6. Telas

### Área do aluno (`index.html`), pensada primeiro para celular
1. **Entrada:** logo Volt com brilho, título **"Carregue sua energia."**, subtítulo *"Entre com sua matrícula e reserve sua aula."*, campo Matrícula + Entrar e botões demo Ana (em dia), Bruno (vence em 3 dias) e Carla (em atraso). O navegador lembra o último aluno.
2. **Início:** saudação, cartão da mensalidade (status, plano, vencimento), **cartão de energia** (ícone de raio em SVG + "9 treinos este mês · 3 semanas seguidas treinando", regra 11), próxima reserva e atalho Reservar.
3. **Aulas:** seletor dos 7 dias e cartões (hora, nome, professor, BarraVagas "12 de 20"). Botões Reservar, Cancelar ou Entrar na lista de espera.
4. **Individual:** serviço, profissional, dia e horários livres em botões.
5. **Minhas reservas:** próximas e passadas, com Cancelar.
6. **Mensalidade:** plano, valor, vencimento e histórico de pagamentos.

**Navegação:** barra inferior (Início, Aulas, Individual, Reservas) no celular e menu no topo no computador. A Mensalidade fica acessível pelo cartão do Início e pelo menu do usuário. Uma aba desligada no painel some da navegação.

### Painel admin (`admin.html`)
- Entrada: botão "Entrar como admin (demo)".
- **Resumo:** reservas de hoje, ocupação da semana, alunos em atraso, receita do mês.
- **Alunos:** busca, filtro por status, ficha (plano, vencimento, Registrar pagamento, histórico), criar e editar.
- **Agenda:** grade da semana (aulas + individuais) e lista de quem reservou.
- **Aulas:** criar, editar e excluir.
- **Individual:** profissionais, serviços e disponibilidade.
- **Planos:** criar e editar.
- **Configurações:** ligar e desligar aulas e individual, Restaurar dados de demonstração.

**Navegação:** menu lateral no computador e menu recolhível no celular.

## 7. Regras de negócio (`regras.js`, com testes)

1. `statusMensalidade(vencimento, hoje)` → `em-dia` (mais de 5 dias), `vence-em-breve` (0 a 5 dias), `em-atraso` (vencimento anterior a hoje).
2. Aluno `em-atraso` não reserva, mas pode cancelar.
3. `registrarPagamento(aluno, plano, hoje)` → novo vencimento = (o maior entre o vencimento atual e hoje) + `plano.meses`.
4. Aula: confirmadas ≤ vagas. Com a aula lotada, a nova reserva entra como `espera`, por ordem de chegada.
5. Ao cancelar uma confirmada, a primeira da `espera` vira `confirmada`.
6. Um aluno não pode ter duas reservas ativas que se sobreponham no tempo (aula ou individual).
7. Não reserva o que já começou. Cancelamento só até **2 horas antes** do início.
8. Individual: horários livres = janelas da disponibilidade divididas pela duração do serviço, menos as reservas ativas daquele profissional. Cada horário tem 1 vaga.
9. Admin: não salva uma aula com `vagas` menor que o número de confirmados na próxima ocorrência. Mostra o motivo.
10. O aluno reserva até **7 dias à frente**, tanto aulas coletivas quanto atendimento individual.
11. `resumoEnergia(reservas, hoje)` → `treinosNoMes` = reservas `confirmada` do aluno com início já passado dentro do mês atual (sem controle de presença, conta como treino feito). `semanasSeguidas` = quantas semanas consecutivas (de segunda a domingo), contando para trás a partir da semana atual, têm ao menos 1 treino. Se a semana atual ainda não tem treino, a contagem começa na semana anterior. Com zero treinos, o cartão mostra "Sua primeira carga de energia começa hoje" e o atalho Reservar.

12. Mensalidade em atraso bloqueia só **novas** reservas. As reservas já feitas continuam valendo e podem ser canceladas.
13. A lista de espera sobe automaticamente mesmo faltando menos de 2 horas. Quem está só na `espera` pode sair a qualquer momento antes do início (o limite de 2 h vale só para `confirmada`).
14. O admin cancela qualquer reserva, sem limite de horário (a promoção da espera da regra 5 vale igual). O admin **não** cria reservas em nome do aluno.
15. Excluir uma aula cancela as reservas futuras dela. Antes, o painel avisa: "Esta aula tem N reservas futuras. Elas serão canceladas."
16. Excluir um aluno apaga as reservas dele e **mantém os pagamentos**, que aparecem no histórico e na receita como "Aluno removido".
17. Duas abas abertas (aluno e painel) se atualizam sozinhas pelo evento `storage` do navegador.
18. A receita do mês é a soma dos pagamentos com `data` no mês atual.

## 7b. Dados de demonstração (decididos no grilling)

**Planos:** Mensal R$ 80,00 (1 mês) · Trimestral R$ 220,00 (3 meses) · Semestral R$ 420,00 (6 meses).

**Grade de aulas coletivas:**

| Aula | Dias | Hora | Duração | Vagas | Professor(a) |
|---|---|---|---|---|---|
| Spinning | seg, qua, sex | 07:00 e 19:00 | 45 min | 15 | Diego Rocha |
| Funcional | ter, qui | 18:00 | 50 min | 20 | Júlia Santos |
| Funcional | sáb | 09:00 | 50 min | 20 | Júlia Santos |
| Dança (ritmos) | ter, qui | 19:00 | 60 min | 8 (a próxima ocorrência vem **lotada**, com 1 pessoa na espera) | Júlia Santos |
| Muay Thai | seg, qua | 20:00 | 60 min | 16 | Diego Rocha |

**Individual:** Personal (60 min) com Rafael Lima, seg a sex, 06:00–10:00 · Avaliação física (40 min) com Marina Alves, ter e qui, 14:00–18:00.

## 8. Erros e mensagens

- Matrícula inexistente: "Matrícula não encontrada. Confira o número ou fale com a recepção." (abaixo do campo, com `aria-live`).
- Cada ação mostra um aviso curto (toast `aria-live="polite"`, some em 4 s) com sucesso ou motivo do erro, por exemplo "Você já tem uma reserva às 18h".
- Excluir aluno, aula ou plano pede confirmação em modal.
- `localStorage` vazio, corrompido (JSON inválido) ou indisponível: carrega a semente em memória e o site funciona, sem tela quebrada.
- Botões desativados mostram o motivo, por exemplo "Regularize sua mensalidade na recepção".

## 9. Testes

- `npm test` (node --test): `formato.test.js` (herdado) + `regras.test.js` cobrindo cada regra da seção 7, com "hoje" fixo nos testes.
- Teste de navegador (script no scratchpad, como no portfólio): Ana reserva e cancela; aula lotada vai para espera e sobe ao cancelar; Carla bloqueada; admin registra o pagamento da Carla e ela passa a reservar; individual mostra só horários livres; restaurar demo; larguras 375px e 1280px sem rolagem horizontal.

## 10. Fora do escopo (por enquanto)

- Firebase (Auth/Firestore), login real, senhas.
- Pagamento online / Pix real, envio de WhatsApp automático.
- Notificações, app instalável (PWA), vários idiomas.
- Repositório no GitHub e publicação (o usuário decide depois).
