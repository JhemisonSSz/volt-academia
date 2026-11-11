// Testes da camada de dados (dados.js) e da semente de demonstração (semente.js).
// O localStorage é trocado por um armazenamento falso, que vive só na memória do teste.
import { test } from "node:test";
import assert from "node:assert/strict";
import { criarDados } from "../public/js/dados.js";
import { criarSemente } from "../public/js/semente.js";
import { ocorrencias, contagem, resumoEnergia, statusMensalidade } from "../public/js/regras.js";

const AGORA = new Date(2026, 10, 11, 10, 0); // quarta-feira, 11/11/2026, 10h
const HOJE = "2026-11-11";

function falso(inicial = {}) {
  const mapa = new Map(Object.entries(inicial));
  return {
    getItem: (k) => (mapa.has(k) ? mapa.get(k) : null),
    setItem: (k, v) => void mapa.set(k, String(v)),
    removeItem: (k) => void mapa.delete(k),
  };
}

test("sem nada salvo: carrega a semente", () => {
  const d = criarDados({ armazenamento: falso(), agora: () => AGORA });
  assert.equal(d.ler().alunos.find((a) => a.matricula === "1001").nome, "Ana");
});

test("JSON quebrado ou versão antiga: volta para a semente sem erro", () => {
  for (const lixo of ["{quebrado", JSON.stringify({ versao: 0 })]) {
    const arm = falso({ "volt-academia:v1": lixo });
    assert.equal(criarDados({ armazenamento: arm, agora: () => AGORA }).ler().versao, 1);
  }
});

test("armazenamento que lança erro não derruba o site", async () => {
  const quebrado = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); }, removeItem() {} };
  const d = criarDados({ armazenamento: quebrado, agora: () => AGORA });
  await d.salvar("planos", { id: "x", nome: "X", valor: 1, meses: 1 });
  assert.ok(d.ler().planos.some((p) => p.id === "x"));
});

test("aplicar grava uma vez e avisa os ouvintes", async () => {
  const arm = falso();
  const d = criarDados({ armazenamento: arm, agora: () => AGORA });
  let chamadas = 0;
  d.ouvir(() => chamadas++);
  await d.aplicar([
    { colecao: "planos", salvar: { id: "x", nome: "X", valor: 1, meses: 1 } },
    { colecao: "planos", remover: "mensal" },
  ]);
  assert.equal(chamadas, 2); // 1 na hora + 1 da mudança
  const salvo = JSON.parse(arm.getItem("volt-academia:v1"));
  assert.ok(salvo.planos.some((p) => p.id === "x"));
  assert.ok(!salvo.planos.some((p) => p.id === "mensal"));
});

test("aba de fora: evento storage recarrega os dados e avisa", async () => {
  const arm = falso();
  const ouvintes = {};
  const janela = { addEventListener: (nome, fn) => (ouvintes[nome] = fn) };
  const d = criarDados({ armazenamento: arm, agora: () => AGORA, janela });
  let ultimo = null;
  d.ouvir((e) => (ultimo = e));
  const outraAba = criarDados({ armazenamento: arm, agora: () => AGORA });
  await outraAba.remover("alunos", "ana");
  ouvintes.storage({ key: "volt-academia:v1" });
  assert.ok(!ultimo.alunos.some((a) => a.id === "ana"));
});

test("semente: Dança lotada, Ana com treinos, status dos demos", () => {
  const e = criarSemente(AGORA);
  const prox = ocorrencias(e.aulas, HOJE, 7).find((o) => o.aulaId.startsWith("danca-"));
  assert.equal(prox.aulaId, "danca-qui-1900");
  assert.deepEqual(contagem(e.reservas, prox.aulaId, prox.data), { confirmadas: 8, espera: 1 });
  assert.ok(resumoEnergia(e.reservas, "ana", AGORA).treinosNoMes > 0);
  const st = (m) => statusMensalidade(e.alunos.find((a) => a.matricula === m).vencimento, HOJE);
  assert.deepEqual(["1001", "1002", "1003"].map(st), ["em-dia", "vence-em-breve", "em-atraso"]);
  assert.deepEqual(e.planos.map((p) => p.valor), [80, 220, 420]);
  assert.equal(e.alunos.length, 12);
});

test("restaurarDemo apaga mudanças", async () => {
  const d = criarDados({ armazenamento: falso(), agora: () => AGORA });
  await d.remover("alunos", "ana");
  await d.restaurarDemo();
  assert.ok(d.ler().alunos.some((a) => a.id === "ana"));
});

test("dados de demonstração de outro dia são renovados; do mesmo dia são mantidos", async () => {
  const arm = falso();
  const d1 = criarDados({ armazenamento: arm, agora: () => AGORA });
  await d1.remover("alunos", "ana");
  const mesmoDia = criarDados({ armazenamento: arm, agora: () => new Date(2026, 10, 11, 18, 0) });
  assert.ok(!mesmoDia.ler().alunos.some((a) => a.id === "ana"));
  const diaSeguinte = criarDados({ armazenamento: arm, agora: () => new Date(2026, 10, 12, 9, 0) });
  assert.ok(diaSeguinte.ler().alunos.some((a) => a.id === "ana"));
  assert.equal(diaSeguinte.ler().alunos.find((a) => a.id === "carla").vencimento, "2026-11-05"); // hoje-7 de novo
});

test("semente: nenhum pagamento tem data no futuro", () => {
  const e = criarSemente(AGORA);
  assert.ok(e.pagamentos.every((p) => p.data <= HOJE), e.pagamentos.filter((p) => p.data > HOJE).map((p) => p.nomeAluno).join(", "));
});
