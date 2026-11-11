# Volt Academia — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o site do aluno e o painel admin da Volt Academia (portfólio), com dados em localStorage e regras testadas.

**Architecture:** Arquivos estáticos em `public/`. React 18 + htm vindos do esm.sh, sem build. A lógica pura fica em `regras.js` (testada com `node --test`). O único acesso ao `localStorage` fica em `dados.js` (testado com armazenamento falso). As operações que juntam as duas coisas ficam em `acoes.js`. As telas só usam `acoes.js` e `dados.js`.

**Tech Stack:** HTML, CSS (custom properties, grid, `:focus-visible`, `prefers-reduced-motion`), React 18.3.1, react-dom 18.3.1, htm 3.1.1 (esm.sh), Node 22 (`node --test`), Python (`py -m http.server`) para servir localmente.

**Spec:** `docs/2026-11-11-volt-academia-design.md`. Leia junto com este plano: cores, textos, telas e regras numeradas (1–18) vêm de lá.

## Global Constraints

- Nome visível: **Volt Academia**. Nenhuma marca do autor aparece nos arquivos de `public/`.
- Sem build, sem npm de produção. Imports fixos: `https://esm.sh/react@18.3.1`, `https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1`, `https://esm.sh/htm@3.1.1`.
- Fontes: Google Fonts Barlow Condensed (600;700) + Barlow (400;500;600), `display=swap`.
- Cores só por tokens de `css/tokens.css` (valores na seção 3 da spec). Nenhum hex solto em outros CSS. Texto branco nunca sobre `#2f8fe6`.
- Datas sempre no **horário local**: `"AAAA-MM-DD"` para dias e `"HH:MM"` para horas. Use `dataISO`/`paraData` de `formato.js`, nunca `toISOString()`.
- Funções de `regras.js` recebem `agora: Date` ou `hojeISO` por parâmetro. Nada de `new Date()` dentro de `regras.js`.
- Ícones: SVG próprio em `js/icones.js` (traço 1.75, estilo Lucide). Sem emoji como ícone.
- Acessibilidade: alvos ≥ 44px, foco visível, rótulo visível em todo campo, avisos com `aria-live="polite"`, sem rolagem horizontal em 375px, animações desligadas com `prefers-reduced-motion: reduce`.
- Nomes e WhatsApp da semente são fictícios (WhatsApp no formato `55739000000NN`).
- Chaves do localStorage: `volt-academia:v1` (dados) e `volt-academia:aluno` (aluno logado).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Formato dos dados (`Estado`)

```js
{
  versao: 1,
  config: { aulasLigadas: true, individualLigado: true },
  planos:        [{ id, nome, valor, meses }],
  alunos:        [{ id, matricula, nome, whatsapp, planoId, vencimento }],      // matricula: string "1001"
  pagamentos:    [{ id, alunoId, nomeAluno, data, valor, planoId }],           // nomeAluno guardado para "Aluno removido"
  profissionais: [{ id, nome, especialidade }],
  aulas:         [{ id, nome, profissionalId, diaSemana, hora, duracao, vagas }], // diaSemana 0=dom..6=sáb
  servicos:      [{ id, nome, duracao }],
  disponibilidade: [{ id, profissionalId, servicoId, diaSemana, inicio, fim }],
  reservas: [{ id, alunoId, tipo: "aula"|"individual", aulaId?, servicoId?, profissionalId?,
               data, hora, situacao: "confirmada"|"espera"|"cancelada", criadaEm }]  // criadaEm: ISO completo
}
```

### Mensagens (texto exato)

| Chave | Texto |
|---|---|
| atraso | `Regularize sua mensalidade na recepção para reservar.` |
| passou | `Este horário já passou.` |
| longe | `Só dá para reservar até 7 dias à frente.` |
| repetida | `Você já reservou este horário.` |
| conflito | `` `Você já tem uma reserva às ${hora}.` `` |
| ocupado | `Este horário acabou de ser ocupado. Escolha outro.` |
| desligado | `Este tipo de agendamento está desligado.` |
| prazoCancelar | `Cancelamento só até 2 horas antes. Fale com a recepção.` |
| vagas | `` `Esta aula tem ${n} alunos confirmados no dia ${dataBR}. Use pelo menos ${n} vagas.` `` |
| matricula | `Matrícula não encontrada. Confira o número ou fale com a recepção.` |
| matriculaRepetida | `Já existe um aluno com esta matrícula.` |

Exporte-as como `export const MENSAGENS = {...}` em `regras.js`.

## Review Focus

1. **Vencimento no fim do mês:** 31/01 + 1 mês deve dar 28/02 (não 03/03). Teste na Task 2.
2. **Clique duplo em "Reservar":** só pode nascer 1 reserva. A segunda chamada devolve `repetida` (teste na Task 5) e o botão fica desativado enquanto a ação roda (Task 7).
3. **localStorage quebrado ou antigo** (JSON inválido, `versao` diferente, ou acesso bloqueado): o site carrega a semente e não mostra erro. Teste na Task 4.
4. **Reserva apontando para aula ou aluno excluído:** as regras e telas ignoram, sem quebrar. Teste na Task 3 (`duracaoDaReserva` usa 60 min) e na Task 5 (excluir aula ou aluno).
5. **Matrícula digitada com espaços** (`" 1001 "`): entra normalmente. Teste na Task 5.

---

### Task 1: Base do projeto

**Files:**
- Create: `package.json`, `.gitignore`, `firebase.json`, `.claude/launch.json`
- Copy from the base template: `public/js/formato.js`, `tests/formato.test.js` (sem mudanças)
- Create: `public/css/tokens.css`, `public/css/base.css`, `public/js/react.js`, `public/index.html`, `public/admin.html`, `public/js/aluno/app.js`, `public/js/admin/app.js`

**Interfaces:**
- Produces: `react.js` exporta `html`, `React`, `createRoot`, `useState`, `useEffect`, `useMemo`, `useRef`, `useCallback`, `createContext`, `useContext`.

- [ ] **Step 1:** `package.json` = o do modelo com `"name": "volt-academia"`. `.gitignore` = o do modelo. `firebase.json` = só o bloco `hosting` do modelo (sem `firestore`).
- [ ] **Step 2:** Copiar `formato.js` e `formato.test.js`. Rodar `npm test`. Esperado: 7 testes passando.
- [ ] **Step 3:** `.claude/launch.json` com configuração `volt` → `runtimeExecutable: "py"`, `runtimeArgs: ["-m","http.server","5500","--directory","public"]`, `port: 5500`.
- [ ] **Step 4:** `react.js` exatamente assim:

```js
import React from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1";
import htm from "https://esm.sh/htm@3.1.1";
export const html = htm.bind(React.createElement);
export const { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } = React;
export { React, createRoot };
```

- [ ] **Step 5:** `tokens.css` com todos os tokens da spec §3, mais espaços (`--e1`…`--e8` = 4, 8, 12, 16, 24, 32, 48, 64 px), raios (`--raio`: 12px, `--raio-p`: 8px), sombras (`--brilho-sombra: 0 0 24px rgba(56,163,245,.35)`) e durações (`--rapido`: 150ms, `--medio`: 250ms). Os tokens `--ok`, `--aviso` e `--erro` devem passar 4,5:1 sobre `--superficie` (sugestão: `#4ade80`, `#facc15`, `#f87171`). `base.css`: reset leve, `body` com `--fundo`/`--texto`, Barlow 16px, line-height 1.5, títulos em Barlow Condensed, `:focus-visible` com contorno 2px `--destaque`, link "Pular para o conteúdo", `@media (prefers-reduced-motion: reduce)` zerando animações e transições.
- [ ] **Step 6:** `index.html` e `admin.html` com `lang="pt-BR"`, viewport, `<title>` (Volt Academia / Volt Academia — Painel), Google Fonts, os CSS, `<div id="app">` e `<script type="module" src="js/aluno/app.js">` (ou `admin/app.js`). Os `app.js` renderizam por enquanto só um `<h1>Volt Academia</h1>`.
- [ ] **Step 7:** Subir com preview `volt` e abrir `/` e `/admin.html`. Esperado: título branco em Barlow Condensed sobre fundo `#0a0f18`, console sem erros.
- [ ] **Step 8:** Commit `Base do projeto (estrutura do modelo-base, React + htm)`.

---

### Task 2: Regras de datas, mensalidade, energia e receita

**Files:**
- Create: `public/js/regras.js`, `tests/regras.test.js`

**Interfaces:**
- Consumes: `dataISO`, `paraData`, `dataBR` de `formato.js`.
- Produces:
  - `MENSAGENS` (tabela acima)
  - `inicio(dataISO: string, hora: string): Date`
  - `somarDias(dataISO, n): string`
  - `somarMeses(dataISO, n): string`: se o dia não existe no mês de destino, usa o último dia
  - `diasParaVencer(vencimentoISO, hojeISO): number` (negativo se passou)
  - `statusMensalidade(vencimentoISO, hojeISO): "em-dia"|"vence-em-breve"|"em-atraso"`
  - `novoVencimento(vencimentoISO, meses, hojeISO): string` = `somarMeses(max(vencimento, hoje), meses)`
  - `resumoEnergia(reservas, alunoId, agora: Date): { treinosNoMes: number, semanasSeguidas: number }` (spec regra 11; semana começa na segunda)
  - `receitaDoMes(pagamentos, hojeISO): number`

Referência dos testes: `const AGORA = new Date(2026, 10, 11, 10, 0)` (quarta-feira, 11/11/2026, 10h) e `const HOJE = "2026-11-11"`.

- [ ] **Step 1: Escrever os testes**

```js
test("somarMeses: fim de mês não pula para o mês seguinte", () => {
  assert.equal(somarMeses("2026-01-31", 1), "2026-02-28");
  assert.equal(somarMeses("2026-11-11", 3), "2027-02-11");
});
test("statusMensalidade: limites de 5 dias e atraso", () => {
  assert.equal(statusMensalidade("2026-12-01", HOJE), "em-dia");          // 20 dias
  assert.equal(statusMensalidade("2026-11-16", HOJE), "vence-em-breve");  // 5 dias
  assert.equal(statusMensalidade("2026-11-11", HOJE), "vence-em-breve");  // hoje
  assert.equal(statusMensalidade("2026-11-10", HOJE), "em-atraso");
  assert.equal(diasParaVencer("2026-11-04", HOJE), -7);
});
test("novoVencimento: soma a partir do maior entre vencimento e hoje", () => {
  assert.equal(novoVencimento("2026-11-04", 1, HOJE), "2026-12-11"); // atrasado: conta de hoje
  assert.equal(novoVencimento("2026-11-20", 3, HOJE), "2027-02-20"); // em dia: conta do vencimento
});
test("resumoEnergia: treinos passados do mês e semanas seguidas", () => {
  const r = (data, hora, situacao = "confirmada") => ({ alunoId: "a", tipo: "aula", data, hora, situacao });
  const reservas = [
    r("2026-11-11", "07:00"),               // hoje, já passou: conta
    r("2026-11-11", "19:00"),               // hoje, ainda não: não conta
    r("2026-11-09", "07:00"), r("2026-11-04", "07:00"), r("2026-11-02", "19:00"),
    r("2026-10-28", "07:00"),               // outubro: não entra no mês, entra na sequência
    r("2026-11-06", "07:00", "cancelada"),  // cancelada: ignora
    { ...r("2026-11-10", "07:00"), alunoId: "b" },
  ];
  assert.deepEqual(resumoEnergia(reservas, "a", AGORA), { treinosNoMes: 4, semanasSeguidas: 3 });
  assert.deepEqual(resumoEnergia([], "a", AGORA), { treinosNoMes: 0, semanasSeguidas: 0 });
});
test("resumoEnergia: semana atual vazia começa a contar da anterior", () => {
  const reservas = [{ alunoId: "a", tipo: "aula", data: "2026-11-06", hora: "07:00", situacao: "confirmada" }];
  assert.equal(resumoEnergia(reservas, "a", AGORA).semanasSeguidas, 1);
});
test("receitaDoMes: soma só pagamentos do mês atual", () => {
  const p = [{ data: "2026-11-01", valor: 80 }, { data: "2026-11-11", valor: 220 }, { data: "2026-10-31", valor: 80 }];
  assert.equal(receitaDoMes(p, HOJE), 300);
});
```

- [ ] **Step 2:** `npm test`. Esperado: FAIL (funções não existem).
- [ ] **Step 3:** Implementar as funções acima em `regras.js`.
- [ ] **Step 4:** `npm test`. Esperado: todos passam.
- [ ] **Step 5:** Commit `Regras: datas, mensalidade, energia e receita`.

---

### Task 3: Regras de grade, reservas, espera e horários livres

**Files:**
- Modify: `public/js/regras.js`, `tests/regras.test.js`

**Interfaces:**
- Produces:
  - `ocorrencias(aulas, deISO, dias): Array<{ aulaId, data, hora }>`: ordenado por data e depois hora, `dias` incluindo o dia inicial
  - `contagem(reservas, aulaId, data): { confirmadas, espera }`
  - `duracaoDaReserva(reserva, estado): number`: minutos da aula ou serviço, ou **60** se não existir mais
  - `avaliarPedido(estado, pedido, agora): { ok: true, situacao: "confirmada"|"espera" } | { ok: false, motivo }`
    - `pedido = { alunoId, tipo: "aula", aulaId, data } | { alunoId, tipo: "individual", servicoId, profissionalId, data, hora }`. Para `aula`, a hora vem da aula.
    - Ordem das checagens: desligado → atraso (`statusMensalidade` com `dataISO(agora)`) → passou (início ≤ agora) → longe (data > hoje+7) → repetida (mesma aula e data, ou mesmo profissional, data e hora, não cancelada) → conflito (sobreposição de horários com outra reserva não cancelada do aluno, usando `duracaoDaReserva`) → individual: `hora` ∉ `horariosLivres` → `ocupado` → aula: `confirmadas < vagas` ? `confirmada` : `espera`.
  - `avaliarCancelamento(reserva, agora, { admin = false } = {}): { ok, motivo? }`: `espera` sempre pode antes do início; `confirmada` só com início − agora ≥ 2 h, exceto admin (sempre pode).
  - `quemSobe(reservas, aulaId, data): reserva | null`: primeira `espera` por `criadaEm`
  - `horariosLivres(estado, { profissionalId, servicoId, data }, agora): string[]`: janelas de `disponibilidade` do dia da semana, em passos de `servico.duracao` que cabem até `fim`, sem os que já passaram, sem os que se sobrepõem a reserva não cancelada do profissional, e `[]` se a data estiver além de hoje+7
  - `avaliarVagas(estado, aulaId, novasVagas, agora): { ok, motivo? }`: compara com as `confirmadas` da **próxima** ocorrência da aula

Monte no arquivo de teste um `estadoTeste()` com: config tudo ligado; aluno `a` (vencimento `"2026-12-01"`), aluno `c` (vencimento `"2026-11-04"`); aula `danca` (qui=4, `"19:00"`, 60 min, vagas 2); aula `spin` (qui=4, `"19:30"`, 45 min, vagas 15); serviço `personal` (60 min); disponibilidade de `rafael` qui 06:00–10:00 para `personal`; reservas vazias.

- [ ] **Step 1: Escrever os testes**

```js
test("ocorrencias: próximos 7 dias em ordem", () => {
  const e = estadoTeste();
  assert.deepEqual(ocorrencias(e.aulas, HOJE, 7).map(o => `${o.data} ${o.hora}`),
    ["2026-11-12 19:00", "2026-11-12 19:30"]);
});
test("avaliarPedido: confirma até lotar, depois espera", () => {
  const e = estadoTeste();
  e.reservas.push(res("x", "danca", "2026-11-12", "confirmada"), res("y", "danca", "2026-11-12", "confirmada"));
  assert.deepEqual(avaliarPedido(e, { alunoId: "a", tipo: "aula", aulaId: "danca", data: "2026-11-12" }, AGORA),
    { ok: true, situacao: "espera" });
});
test("avaliarPedido: bloqueios na ordem certa", () => {
  const e = estadoTeste();
  const p = { alunoId: "a", tipo: "aula", aulaId: "danca", data: "2026-11-12" };
  assert.equal(avaliarPedido(e, { ...p, alunoId: "c" }, AGORA).motivo, MENSAGENS.atraso);
  assert.equal(avaliarPedido(e, { ...p, data: "2026-11-19" }, AGORA).motivo, MENSAGENS.longe);
  assert.equal(avaliarPedido(e, p, new Date(2026, 10, 12, 19, 0)).motivo, MENSAGENS.passou);
  e.reservas.push(res("a", "danca", "2026-11-12", "confirmada"));
  assert.equal(avaliarPedido(e, p, AGORA).motivo, MENSAGENS.repetida);
  assert.equal(avaliarPedido(e, { ...p, aulaId: "spin" }, AGORA).motivo, "Você já tem uma reserva às 19:00.");
  e.config.aulasLigadas = false;
  assert.equal(avaliarPedido(e, { ...p, aulaId: "spin" }, AGORA).motivo, MENSAGENS.desligado);
});
test("avaliarCancelamento: 2 horas para confirmada, livre para espera e admin", () => {
  const r = res("a", "danca", "2026-11-12", "confirmada");
  assert.equal(avaliarCancelamento(r, new Date(2026, 10, 12, 17, 0)).ok, true);   // 2h antes
  assert.equal(avaliarCancelamento(r, new Date(2026, 10, 12, 17, 1)).motivo, MENSAGENS.prazoCancelar);
  assert.equal(avaliarCancelamento(r, new Date(2026, 10, 12, 18, 30), { admin: true }).ok, true);
  assert.equal(avaliarCancelamento({ ...r, situacao: "espera" }, new Date(2026, 10, 12, 18, 30)).ok, true);
});
test("quemSobe: primeira da espera por ordem de chegada", () => {
  const rs = [{ ...res("y", "danca", "2026-11-12", "espera"), id: "2", criadaEm: "2026-11-10T09:00:00" },
              { ...res("x", "danca", "2026-11-12", "espera"), id: "1", criadaEm: "2026-11-10T08:00:00" }];
  assert.equal(quemSobe(rs, "danca", "2026-11-12").id, "1");
  assert.equal(quemSobe([], "danca", "2026-11-12"), null);
});
test("horariosLivres: passos da duração, sem ocupados", () => {
  const e = estadoTeste();
  const q = { profissionalId: "rafael", servicoId: "personal", data: "2026-11-12" };
  assert.deepEqual(horariosLivres(e, q, AGORA), ["06:00", "07:00", "08:00", "09:00"]);
  e.reservas.push({ alunoId: "x", tipo: "individual", profissionalId: "rafael", servicoId: "personal",
                    data: "2026-11-12", hora: "07:00", situacao: "confirmada" });
  assert.deepEqual(horariosLivres(e, q, AGORA), ["06:00", "08:00", "09:00"]);
  assert.deepEqual(horariosLivres(e, { ...q, data: "2026-11-19" }, AGORA), []);
});
test("avaliarVagas: não deixa ficar abaixo dos confirmados", () => {
  const e = estadoTeste();
  e.reservas.push(res("x", "danca", "2026-11-12", "confirmada"), res("y", "danca", "2026-11-12", "confirmada"));
  assert.equal(avaliarVagas(e, "danca", 1, AGORA).motivo,
    "Esta aula tem 2 alunos confirmados no dia 12/11/2026. Use pelo menos 2 vagas.");
  assert.equal(avaliarVagas(e, "danca", 2, AGORA).ok, true);
});
test("duracaoDaReserva: aula excluída usa 60 minutos", () => {
  assert.equal(duracaoDaReserva(res("a", "sumiu", "2026-11-12", "confirmada"), estadoTeste()), 60);
});
```

(`res(alunoId, aulaId, data, situacao)` é um ajudante do teste que cria uma reserva de aula com `hora` vinda de `estadoTeste()`, ou `"19:00"` se a aula não existir.)

- [ ] **Step 2:** `npm test`. Esperado: FAIL.
- [ ] **Step 3:** Implementar as funções acima.
- [ ] **Step 4:** `npm test`. Esperado: todos passam.
- [ ] **Step 5:** Commit `Regras: grade, reservas, espera e horários livres`.

---

### Task 4: Semente e camada de dados

**Files:**
- Create: `public/js/semente.js`, `public/js/dados.js`, `tests/dados.test.js`

**Interfaces:**
- Consumes: `dataISO`, `somarDias` (regras), `paraData`.
- Produces:
  - `criarSemente(agora: Date): Estado`: todos os dados das seções 5 e 7b da spec. IDs fixos e legíveis:
    - planos `mensal`, `trimestral`, `semestral`
    - profissionais `diego`, `julia`, `rafael`, `marina`
    - serviços `personal`, `avaliacao`
    - alunos `ana`, `bruno`, `carla`, `aluno-1004` … `aluno-1012`
    - aulas = **um registro por dia e hora**, com id `${slug}-${dia}-${hhmm}` e dia em `dom seg ter qua qui sex sab` (ex.: `spinning-seg-0700`, `danca-qui-1900`, `funcional-sab-0900`)

    Ana 1001 (vence hoje+20, plano mensal, treinos confirmados nas aulas de Spinning 07:00 dos últimos 21 dias, incluindo hoje se já passou, + 1 reserva futura no Spinning 07:00 da próxima sexta), Bruno 1002 (hoje+3), Carla 1003 (hoje−7), 9 extras 1004–1012 (um deles em atraso). A **próxima** ocorrência da Dança vem com 8 confirmadas dos extras e 1 extra em espera. Cada aluno tem 1 pagamento (data = vencimento − meses do plano).
  - `armazenamentoSeguro(): Storage-like`: `localStorage` se ler e escrever funcionar, senão um objeto em memória com `getItem`, `setItem` e `removeItem`.
  - `criarDados({ armazenamento, agora = () => new Date(), janela = globalThis.window })` devolve:
    - `ler(): Estado`
    - `ouvir(fn): () => void`: chama `fn(estado)` na hora e a cada mudança, inclusive mudanças vindas de outra aba (`janela.addEventListener("storage")`, se houver `janela`)
    - `aplicar(mudancas): Promise<void>`: `mudancas` é uma lista de `{ colecao, salvar: registro }` ou `{ colecao, remover: id }`. Aplica tudo, grava uma vez e avisa os ouvintes uma vez.
    - `salvar(colecao, registro): Promise<registro>`: cria `id` (`crypto.randomUUID()`) se faltar
    - `remover(colecao, id): Promise<void>`
    - `salvarConfig(config): Promise<void>`
    - `restaurarDemo(): Promise<void>`
  - `export const dados = criarDados({ armazenamento: armazenamentoSeguro() })` (instância usada pelas telas)

- [ ] **Step 1: Escrever os testes** (armazenamento falso = `Map` com `getItem`, `setItem` e `removeItem`)

```js
test("sem nada salvo: carrega a semente", () => {
  const d = criarDados({ armazenamento: falso(), agora: () => AGORA });
  assert.equal(d.ler().alunos.find(a => a.matricula === "1001").nome, "Ana");
});
test("JSON quebrado ou versão antiga: volta para a semente sem erro", () => {
  for (const lixo of ["{quebrado", JSON.stringify({ versao: 0 })]) {
    const arm = falso({ "volt-academia:v1": lixo });
    assert.equal(criarDados({ armazenamento: arm, agora: () => AGORA }).ler().versao, 1);
  }
});
test("aplicar grava uma vez e avisa os ouvintes", async () => {
  const arm = falso(); const d = criarDados({ armazenamento: arm, agora: () => AGORA });
  let chamadas = 0; d.ouvir(() => chamadas++);
  await d.aplicar([{ colecao: "planos", salvar: { id: "x", nome: "X", valor: 1, meses: 1 } },
                   { colecao: "planos", remover: "mensal" }]);
  assert.equal(chamadas, 2); // 1 na hora + 1 da mudança
  const salvo = JSON.parse(arm.getItem("volt-academia:v1"));
  assert.ok(salvo.planos.some(p => p.id === "x"));
  assert.ok(!salvo.planos.some(p => p.id === "mensal"));
});
test("semente: Dança lotada, Ana com treinos, status dos demos", () => {
  const e = criarSemente(AGORA);
  const prox = ocorrencias(e.aulas, HOJE, 7).find(o => o.aulaId.startsWith("danca-"));
  assert.equal(prox.aulaId, "danca-qui-1900");
  assert.deepEqual(contagem(e.reservas, prox.aulaId, prox.data), { confirmadas: 8, espera: 1 });
  assert.ok(resumoEnergia(e.reservas, "ana", AGORA).treinosNoMes > 0);
  const st = (m) => statusMensalidade(e.alunos.find(a => a.matricula === m).vencimento, HOJE);
  assert.deepEqual(["1001", "1002", "1003"].map(st), ["em-dia", "vence-em-breve", "em-atraso"]);
  assert.deepEqual(e.planos.map(p => p.valor), [80, 220, 420]);
});
test("restaurarDemo apaga mudanças", async () => {
  const d = criarDados({ armazenamento: falso(), agora: () => AGORA });
  await d.remover("alunos", "ana"); await d.restaurarDemo();
  assert.ok(d.ler().alunos.some(a => a.id === "ana"));
});
```

- [ ] **Step 2:** `npm test`. Esperado: FAIL.
- [ ] **Step 3:** Implementar `semente.js` e `dados.js`.
- [ ] **Step 4:** `npm test`. Esperado: todos passam.
- [ ] **Step 5:** Commit `Dados em localStorage e semente de demonstração`.

---

### Task 5: Ações (o que as telas chamam)

**Files:**
- Create: `public/js/acoes.js`, `tests/acoes.test.js`

**Interfaces:**
- Consumes: `criarDados` (Task 4), funções de `regras.js` (Tasks 2–3), `telefoneValido` (formato).
- Produces: `criarAcoes(dados, agora = () => new Date())` devolve (todas `async`, todas retornam `{ ok, motivo? , ... }`):
  - `entrar(matricula): aluno | null`: remove espaços e compara como texto
  - `reservar(pedido): { ok, situacao? , motivo? }`: `avaliarPedido` e depois `salvar` com `situacao` e `criadaEm`
  - `cancelar(reservaId, { admin = false } = {}): { ok, motivo?, promovida?: reserva }`: cancela e, se era `confirmada` de aula, promove `quemSobe` na mesma `aplicar`
  - `registrarPagamento(alunoId): { ok, vencimento }`: novo pagamento (valor do plano, `nomeAluno`) + `novoVencimento`
  - `salvarAluno(aluno): { ok, motivo? }`: matrícula vazia vira a próxima livre (maior + 1). Recusa matrícula repetida (`matriculaRepetida`) e WhatsApp inválido.
  - `salvarAula(aula): { ok, motivo? }`: usa `avaliarVagas` quando a aula já existe
  - `reservasFuturasDaAula(aulaId): number`
  - `excluirAula(aulaId): { ok, canceladas }`: cancela as reservas futuras não canceladas e remove a aula
  - `excluirAluno(alunoId): { ok }`: remove as reservas dele e o aluno; os pagamentos ficam

- [ ] **Step 1: Escrever os testes** (cada teste cria `dados` com armazenamento falso e `agora = () => AGORA`)

```js
test("entrar: aceita espaços e recusa matrícula inexistente", async () => {
  assert.equal((await a.entrar(" 1001 ")).id, "ana");
  assert.equal(await a.entrar("9999"), null);
});
test("reservar duas vezes seguidas cria uma reserva só", async () => {
  const p = { alunoId: "ana", tipo: "aula", aulaId: "funcional-sab-0900", data: "2026-11-14" };
  const [r1, r2] = await Promise.all([a.reservar(p), a.reservar(p)]);
  assert.deepEqual([r1.ok, r2.ok].sort(), [false, true]);
  assert.equal(d.ler().reservas.filter(r => r.alunoId === "ana" && r.aulaId === "funcional-sab-0900" && r.situacao !== "cancelada").length, 1);
});
test("cancelar confirmada da Dança promove quem estava na espera", async () => {
  const conf = d.ler().reservas.find(r => r.aulaId === "danca-qui-1900" && r.data === "2026-11-12" && r.situacao === "confirmada");
  const r = await a.cancelar(conf.id, { admin: true });
  assert.equal(r.promovida.situacao, "confirmada");
  assert.deepEqual(contagem(d.ler().reservas, "danca-qui-1900", "2026-11-12"), { confirmadas: 8, espera: 0 });
});
test("registrarPagamento da Carla tira o atraso", async () => {
  const r = await a.registrarPagamento("carla");
  assert.equal(statusMensalidade(r.vencimento, HOJE), "em-dia");
  assert.equal(d.ler().pagamentos.filter(p => p.alunoId === "carla").length, 2);
});
test("excluirAula cancela reservas futuras; excluirAluno mantém pagamentos", async () => {
  assert.equal((await a.excluirAula("danca-qui-1900")).canceladas, 9);
  assert.ok(!d.ler().aulas.some(x => x.id === "danca-qui-1900"));
  await a.excluirAluno("ana");
  assert.ok(!d.ler().reservas.some(r => r.alunoId === "ana"));
  assert.ok(d.ler().pagamentos.some(p => p.alunoId === "ana"));
});
test("salvarAluno: matrícula automática e repetida recusada", async () => {
  const novo = { nome: "Teste", whatsapp: "73900000099", planoId: "mensal", vencimento: HOJE };
  assert.equal((await a.salvarAluno(novo)).ok, true);
  assert.ok(d.ler().alunos.some(x => x.matricula === "1013"));
  assert.equal((await a.salvarAluno({ ...novo, matricula: "1001" })).motivo, MENSAGENS.matriculaRepetida);
});
```

(Com `AGORA` = quarta 11/11/2026, a próxima Dança é quinta 12/11 e o próximo Funcional de sábado é 14/11.)

- [ ] **Step 2:** `npm test`. Esperado: FAIL.
- [ ] **Step 3:** Implementar `acoes.js`. Para o teste do clique duplo, cada ação roda numa fila: guarde `let fila = Promise.resolve()` e encadeie cada operação nela, para a segunda `reservar` ver a primeira já gravada.
- [ ] **Step 4:** `npm test`. Esperado: todos passam.
- [ ] **Step 5:** Commit `Ações: reservar, cancelar, pagamento, excluir`.

---

### Task 6: Componentes e área do aluno (entrada, início, mensalidade)

**Files:**
- Create: `public/js/icones.js`, `public/js/componentes/basicos.js`, `public/js/componentes/avisos.js`, `public/js/componentes/modal.js`, `public/js/componentes/usarEstado.js`, `public/css/componentes.css`, `public/css/aluno.css`, `public/js/aluno/Entrada.js`, `public/js/aluno/Inicio.js`, `public/js/aluno/Mensalidade.js`
- Modify: `public/js/aluno/app.js`, `public/index.html`

**Interfaces:**
- Consumes: `dados` (Task 4), `criarAcoes` (Task 5), regras.
- Produces (usados nas Tasks 7–9):
  - `icones.js`: componentes `Raio`, `Calendario`, `Relogio`, `Usuario`, `Usuarios`, `Haltere`, `Inicio`, `Lista`, `Cartao`, `Check`, `X`, `Alerta`, `Sair`, `Menu`, `Mais`, `Lixeira`, `Lapis`, `Engrenagem`, `Grafico`, `Busca`. Cada um recebe `{ tamanho = 20, rotulo }` e usa `aria-hidden` se não tiver `rotulo`.
  - `basicos.js`: `Botao({ variante: "principal"|"secundario"|"perigo"|"fantasma", carregando, ...props })`, `Campo({ rotulo, erro, ajuda, ...input })` (liga o erro por `aria-describedby`), `Cartao`, `Status({ status })` (ícone + texto: "Em dia", "Vence em breve", "Em atraso"), `BarraVagas({ ocupadas, total })` (texto "12 de 20" + barra animada por `transform: scaleX`).
  - `avisos.js`: `AvisosProvider` + `usarAvisos()` → `avisar(texto, tipo = "ok"|"erro")`. Região `aria-live="polite"` e some em 4 s.
  - `modal.js`: `Modal({ titulo, aberto, aoFechar, children })` com `<dialog>`, Esc e botão fechar. `confirmar({ titulo, texto, botao })` → `Promise<boolean>`.
  - `usarEstado.js`: `usarEstado(): Estado` (assina `dados.ouvir`) e `acoes = criarAcoes(dados)`.
  - Rotas do aluno por hash: `#/inicio`, `#/aulas`, `#/individual`, `#/reservas`, `#/mensalidade`.

- [ ] **Step 1:** Componentes, ícones e `componentes.css` (botão principal: fundo `--botao`, texto branco, `box-shadow: var(--brilho-sombra)` no hover e no foco, `transform: scale(.97)` ao pressionar; estado desativado com opacidade .45 e `cursor: not-allowed`).
- [ ] **Step 2:** `Entrada.js`: logo "VOLT" com raio e brilho, título **"Carregue sua energia."**, subtítulo *"Entre com sua matrícula e reserve sua aula."*, `Campo` Matrícula (`inputmode="numeric"`, `autocomplete="off"`), botão Entrar, erro `MENSAGENS.matricula` no campo e 3 botões demo: "Ana · em dia", "Bruno · vence em 3 dias", "Carla · em atraso". Ao entrar, grava `volt-academia:aluno`.
- [ ] **Step 3:** `app.js` do aluno: se não há aluno salvo (ou o id não existe mais no estado), mostra Entrada. Senão, mostra um layout com cabeçalho (nome, botão Sair), conteúdo da rota e navegação (barra inferior fixa em < 768px; no topo em ≥ 768px). O item ativo usa `aria-current="page"`. Abas desligadas na config somem. Ao trocar de rota, o foco vai para o `<main>`.
- [ ] **Step 4:** `Inicio.js`: "Olá, {primeiro nome}", cartão da mensalidade (`Status`, plano, "Vence em dd/mm/aaaa", link para `#/mensalidade`), cartão de energia (`Raio` + "{n} treinos este mês · {s} semanas seguidas treinando", ou "Sua primeira carga de energia começa hoje" com 0 treinos), próxima reserva (ou "Nenhuma reserva marcada") e botão principal Reservar → `#/aulas`. Para aluno em atraso, faixa de aviso com `MENSAGENS.atraso`.
- [ ] **Step 5:** `Mensalidade.js`: plano, valor (`moeda`), vencimento, `Status` e tabela do histórico (data, plano, valor), com números `tabular-nums`.
- [ ] **Step 6:** Verificar no preview (375px e 1280px): entrar pelos 3 botões demo; Ana mostra "Em dia" e o cartão de energia com números > 0; Carla mostra "Em atraso" e a faixa de aviso; matrícula "9999" mostra o erro abaixo do campo; Sair volta à Entrada; recarregar a página mantém o aluno logado; sem rolagem horizontal; console sem erros.
- [ ] **Step 7:** Commit `Área do aluno: entrada, início e mensalidade`.

---

### Task 7: Área do aluno (aulas, individual, minhas reservas)

**Files:**
- Create: `public/js/aluno/Aulas.js`, `public/js/aluno/Individual.js`, `public/js/aluno/Reservas.js`
- Modify: `public/js/aluno/app.js`, `public/css/aluno.css`

**Interfaces:**
- Consumes: componentes da Task 6, `acoes.reservar`/`cancelar`, `ocorrencias`, `contagem`, `horariosLivres`, `avaliarPedido`, `avaliarCancelamento`.

- [ ] **Step 1:** `Aulas.js`: faixa com os próximos 7 dias (botões "Qua 11", com `aria-pressed`) e lista das ocorrências do dia: hora, nome, professor, `BarraVagas`. O botão muda conforme o caso: "Reservar" (se `avaliarPedido` dá `confirmada`), "Entrar na lista de espera" (se dá `espera`), "Cancelar" ou "Sair da espera" (se o aluno já está nela), ou desativado com o motivo em texto pequeno embaixo (atraso, passou). O botão fica `carregando` e desativado durante a ação. O resultado vai para `avisar`.
- [ ] **Step 2:** `Individual.js`: escolher serviço (cartões Personal e Avaliação física), depois profissional (os que têm disponibilidade para o serviço), depois dia (7 dias) e mostrar `horariosLivres` em botões de horário. Ao tocar num horário, abre `Modal` de confirmação ("Personal com Rafael Lima, qui 12/11 às 07:00") e reserva. Sem horários: "Nenhum horário livre neste dia."
- [ ] **Step 3:** `Reservas.js`: abas "Próximas" e "Anteriores". Cada item mostra tipo, nome, data, hora e situação ("Confirmada" ou "Na espera"), com Cancelar (usa `confirmar` e depois `acoes.cancelar`; se `avaliarCancelamento` recusar, mostra o motivo no lugar do botão). Lista vazia: mensagem + botão "Ver aulas".
- [ ] **Step 4:** Verificar no preview: Ana reserva Funcional de sábado (a barra sobe 1 e aparece em Próximas); clicar duas vezes rápido em Reservar cria só 1 reserva; na Dança lotada aparece "Entrar na lista de espera", e ao entrar fica "Na espera"; Carla vê os botões desativados com o motivo; Personal mostra horários e, depois de reservar, o horário some da lista; cancelar devolve a vaga; abrir uma segunda aba e reservar faz a primeira aba atualizar sozinha. Testar em 375px e 1280px, com console sem erros.
- [ ] **Step 5:** Commit `Área do aluno: aulas, individual e reservas`.

---

### Task 8: Painel admin (estrutura, resumo, alunos, agenda)

**Files:**
- Create: `public/css/admin.css`, `public/js/admin/Resumo.js`, `public/js/admin/Alunos.js`, `public/js/admin/Agenda.js`
- Modify: `public/js/admin/app.js`

**Interfaces:**
- Consumes: componentes (Task 6), `acoes` (Task 5), `statusMensalidade`, `receitaDoMes`, `ocorrencias`, `contagem`.
- Produces: rotas `#/resumo`, `#/alunos`, `#/agenda`, `#/aulas`, `#/individual`, `#/planos`, `#/config`. Sessão admin em `sessionStorage` `volt-academia:admin` (com try/catch).

- [ ] **Step 1:** `app.js`: tela de entrada com o título "Painel Volt" e o botão principal "Entrar como admin (demo)", mais o texto "Demonstração: os dados ficam só neste navegador." Depois de entrar: menu lateral fixo em ≥ 1024px e botão `Menu` que abre o menu em < 1024px. Itens com ícone + texto e `aria-current`. Botão "Sair" separado no fim do menu. Link "Ver site do aluno" abre `index.html` em nova aba.
- [ ] **Step 2:** `Resumo.js`: 4 cartões (Reservas hoje, Ocupação da semana em %, Alunos em atraso, Receita do mês em `moeda`) e a lista "Próximas aulas de hoje" com `BarraVagas`.
- [ ] **Step 3:** `Alunos.js`: busca por nome ou matrícula, filtro (Todos, Em dia, Vence em breve, Em atraso) e tabela (vira cartões em < 768px) com matrícula, nome, plano, vencimento e `Status`. A ficha do aluno abre em `Modal`, com os dados editáveis (`acoes.salvarAluno`), o botão principal "Registrar pagamento" (confirma o valor do plano e mostra o novo vencimento num aviso), o histórico de pagamentos e "Excluir aluno" (perigo + `confirmar`). Há também o botão "Novo aluno".
- [ ] **Step 4:** `Agenda.js`: semana atual (seg–dom) em grade de 7 colunas no desktop e lista por dia no celular. Cada item (aula ou individual) mostra hora, nome e ocupação; ao clicar, abre um `Modal` com a lista de nomes (confirmados e depois a espera), cada um com "Cancelar" (admin, sem limite).
- [ ] **Step 5:** Verificar no preview: o Resumo mostra Carla entre os em atraso; Registrar pagamento da Carla muda o status para "Em dia" e, numa aba do aluno aberta com a Carla, os botões de reservar voltam a funcionar; a busca "1003" acha a Carla; cancelar um confirmado da Dança na Agenda sobe o aluno da espera. Testar em 375px e 1280px, com console sem erros.
- [ ] **Step 6:** Commit `Painel: resumo, alunos e agenda`.

---

### Task 9: Painel admin (aulas, individual, planos, configurações)

**Files:**
- Create: `public/js/admin/Aulas.js`, `public/js/admin/Individual.js`, `public/js/admin/Planos.js`, `public/js/admin/Config.js`
- Modify: `public/js/admin/app.js`

- [ ] **Step 1:** `Aulas.js`: lista agrupada por dia da semana e formulário em `Modal` (nome, professor `select`, dia `select`, hora `type="time"`, duração, vagas). Salvar usa `acoes.salvarAula`, que mostra o motivo de `avaliarVagas` abaixo do campo Vagas. Excluir mostra no `confirmar` o texto "Esta aula tem N reservas futuras. Elas serão canceladas." (com N vindo de `reservasFuturasDaAula`; se for 0, o texto é só "Excluir esta aula?").
- [ ] **Step 2:** `Individual.js`: três blocos (Profissionais, Serviços, Disponibilidade) com criar, editar e excluir via `dados.salvar`/`dados.remover`. Disponibilidade: profissional, serviço, dia, início e fim; recusa `fim ≤ inicio` com erro no campo.
- [ ] **Step 3:** `Planos.js`: tabela e formulário (nome, valor com `lerDinheiro`, meses ≥ 1).
- [ ] **Step 4:** `Config.js`: dois interruptores (`role="switch"`, `aria-checked`) para "Aulas coletivas" e "Atendimento individual", e o botão "Restaurar dados de demonstração" (perigo + `confirmar` → `dados.restaurarDemo()` + aviso).
- [ ] **Step 5:** Verificar no preview: baixar as vagas da Dança para 5 mostra o erro; excluir uma aula mostra o número certo; desligar "Atendimento individual" tira a aba Individual da área do aluno (em outra aba); restaurar demo devolve tudo. Testar em 375px e 1280px, com console sem erros.
- [ ] **Step 6:** Commit `Painel: aulas, individual, planos e configurações`.

---

### Task 10: Verificação final e documentação

**Files:**
- Create: `README.md`, `COMO-FUNCIONA.md`
- Modify: `docs/2026-11-11-volt-academia-design.md` (Status: implementado)

- [ ] **Step 1:** `npm test`. Esperado: todos passam (formato + regras + dados + ações).
- [ ] **Step 2:** Roteiro de sucesso da spec (§1) inteiro no preview, em 375px e 1280px: Ana reserva e cancela aula e individual; Carla bloqueada; admin registra o pagamento da Carla; Carla reserva. Conferir também: `grep -ri jhemison public/` sem resultados, e foco visível em todos os botões navegando só com Tab.
- [ ] **Step 3:** `README.md`: o que é (projeto de portfólio, academia fictícia), como rodar (`py -m http.server 5500 --directory public`), `npm test`, matrículas demo e como publicar (`firebase deploy --project <id> --only hosting`). `COMO-FUNCIONA.md`: um parágrafo por arquivo de `public/js/` e a seção "Como trocar por Firebase" (reescrever só `dados.js` mantendo `ler`, `ouvir`, `aplicar`, `salvar`, `remover`, `salvarConfig` e `restaurarDemo`; usar um `db.js` com Firebase como ponto de partida).
- [ ] **Step 4:** Commit `Documentação e verificação final`.
