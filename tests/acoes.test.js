// Testes das ações (acoes.js): o que as telas chamam para reservar, cancelar, pagar e excluir.
import { test } from "node:test";
import assert from "node:assert/strict";
import { criarDados } from "../public/js/dados.js";
import { criarAcoes } from "../public/js/acoes.js";
import { MENSAGENS, contagem, statusMensalidade } from "../public/js/regras.js";

const AGORA = new Date(2026, 10, 11, 10, 0); // quarta-feira, 11/11/2026, 10h
const HOJE = "2026-11-11";

function novo() {
  const arm = new Map();
  const armazenamento = {
    getItem: (k) => (arm.has(k) ? arm.get(k) : null),
    setItem: (k, v) => void arm.set(k, String(v)),
    removeItem: (k) => void arm.delete(k),
  };
  const d = criarDados({ armazenamento, agora: () => AGORA });
  return { d, a: criarAcoes(d, () => AGORA) };
}

test("entrar: aceita espaços e recusa matrícula inexistente", async () => {
  const { a } = novo();
  assert.equal((await a.entrar(" 1001 ")).id, "ana");
  assert.equal(await a.entrar("9999"), null);
});

test("reservar duas vezes seguidas cria uma reserva só", async () => {
  const { d, a } = novo();
  const p = { alunoId: "ana", tipo: "aula", aulaId: "funcional-sab-0900", data: "2026-11-14" };
  const [r1, r2] = await Promise.all([a.reservar(p), a.reservar(p)]);
  assert.deepEqual([r1.ok, r2.ok].sort(), [false, true]);
  assert.equal(
    d.ler().reservas.filter((r) => r.alunoId === "ana" && r.aulaId === "funcional-sab-0900" && r.situacao !== "cancelada").length,
    1,
  );
});

test("reservar individual grava profissional, serviço e horário", async () => {
  const { d, a } = novo();
  const r = await a.reservar({ alunoId: "ana", tipo: "individual", servicoId: "personal", profissionalId: "rafael", data: "2026-11-12", hora: "08:00" });
  assert.equal(r.ok, true);
  const gravada = d.ler().reservas.find((x) => x.tipo === "individual");
  assert.deepEqual([gravada.profissionalId, gravada.hora, gravada.situacao], ["rafael", "08:00", "confirmada"]);
});

test("reservar em atraso devolve o motivo e não grava", async () => {
  const { d, a } = novo();
  const antes = d.ler().reservas.length;
  const r = await a.reservar({ alunoId: "carla", tipo: "aula", aulaId: "funcional-sab-0900", data: "2026-11-14" });
  assert.equal(r.motivo, MENSAGENS.atraso);
  assert.equal(d.ler().reservas.length, antes);
});

test("cancelar confirmada da Dança promove quem estava na espera", async () => {
  const { d, a } = novo();
  const conf = d.ler().reservas.find((r) => r.aulaId === "danca-qui-1900" && r.data === "2026-11-12" && r.situacao === "confirmada");
  const r = await a.cancelar(conf.id, { admin: true });
  assert.equal(r.promovida.situacao, "confirmada");
  assert.deepEqual(contagem(d.ler().reservas, "danca-qui-1900", "2026-11-12"), { confirmadas: 8, espera: 0 });
});

test("cancelar fora do prazo é recusado para o aluno", async () => {
  const { d, a } = novo();
  // A reserva futura da Ana é o Spinning das 07:00 na sexta, 13/11/2026
  const ana = d.ler().reservas.find((r) => r.alunoId === "ana" && r.situacao === "confirmada" && r.data > HOJE);
  assert.deepEqual([ana.data, ana.hora], ["2026-11-13", "07:00"]);
  const umaHoraAntes = criarAcoes(d, () => new Date(2026, 10, 13, 6, 0));
  assert.equal((await umaHoraAntes.cancelar(ana.id)).motivo, MENSAGENS.prazoCancelar);
  assert.equal(d.ler().reservas.find((r) => r.id === ana.id).situacao, "confirmada");
  assert.equal((await umaHoraAntes.cancelar(ana.id, { admin: true })).ok, true);
});

test("registrarPagamento da Carla tira o atraso", async () => {
  const { d, a } = novo();
  const r = await a.registrarPagamento("carla");
  assert.equal(statusMensalidade(r.vencimento, HOJE), "em-dia");
  assert.equal(d.ler().pagamentos.filter((p) => p.alunoId === "carla").length, 2);
});

test("excluirAula cancela reservas futuras; excluirAluno mantém pagamentos", async () => {
  const { d, a } = novo();
  assert.equal((await a.excluirAula("danca-qui-1900")).canceladas, 9);
  assert.ok(!d.ler().aulas.some((x) => x.id === "danca-qui-1900"));
  await a.excluirAluno("ana");
  assert.ok(!d.ler().reservas.some((r) => r.alunoId === "ana"));
  assert.ok(d.ler().pagamentos.some((p) => p.alunoId === "ana"));
});

test("salvarAluno: matrícula automática e repetida recusada", async () => {
  const { d, a } = novo();
  const aluno = { nome: "Teste", whatsapp: "73900000099", planoId: "mensal", vencimento: HOJE };
  assert.equal((await a.salvarAluno(aluno)).ok, true);
  assert.ok(d.ler().alunos.some((x) => x.matricula === "1013"));
  assert.equal((await a.salvarAluno({ ...aluno, matricula: "1001" })).motivo, MENSAGENS.matriculaRepetida);
});

test("salvarAluno: editar um aluno da semente (WhatsApp com 55) funciona", async () => {
  const { d, a } = novo();
  const ana = d.ler().alunos.find((x) => x.id === "ana");
  assert.equal((await a.salvarAluno({ ...ana, nome: "Ana Paula" })).ok, true);
  assert.equal(d.ler().alunos.find((x) => x.id === "ana").nome, "Ana Paula");
});

test("salvarAula: não deixa baixar as vagas abaixo dos confirmados", async () => {
  const { d, a } = novo();
  const danca = d.ler().aulas.find((x) => x.id === "danca-qui-1900");
  const r = await a.salvarAula({ ...danca, vagas: 5 });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /8 alunos confirmados/);
  assert.equal((await a.salvarAula({ ...danca, vagas: 10 })).ok, true);
});
