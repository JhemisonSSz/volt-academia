// Testes das ações (acoes.js): o que as telas chamam para reservar, cancelar, pagar e excluir.
import { test } from "node:test";
import assert from "node:assert/strict";
import { criarDados } from "../public/js/dados.js";
import { criarAcoes } from "../public/js/acoes.js";
import { MENSAGENS, contagem, statusMensalidade } from "../public/js/regras.js";
import { criarNovoId } from "../public/js/id.js";

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

// ---- Cadastros do painel: planos, profissionais, serviços e disponibilidade ----

test("salvarPlano: valor e meses precisam fazer sentido", async () => {
  const { d, a } = novo();
  assert.equal((await a.salvarPlano({ nome: "", valor: 50, meses: 1 })).ok, false);
  assert.equal((await a.salvarPlano({ nome: "Anual", valor: 0, meses: 12 })).ok, false);
  assert.equal((await a.salvarPlano({ nome: "Anual", valor: 700, meses: 0 })).ok, false);
  assert.equal((await a.salvarPlano({ nome: "Anual", valor: 700, meses: 12 })).ok, true);
  assert.ok(d.ler().planos.some((p) => p.nome === "Anual" && p.valor === 700));
});

test("excluirPlano: recusa se algum aluno ainda usa", async () => {
  const { d, a } = novo();
  const r = await a.excluirPlano("mensal");
  assert.equal(r.ok, false);
  assert.match(r.motivo, /alunos usam este plano/);
  await a.salvarPlano({ id: "vazio", nome: "Vazio", valor: 10, meses: 1 });
  assert.equal((await a.excluirPlano("vazio")).ok, true);
  assert.ok(!d.ler().planos.some((p) => p.id === "vazio"));
});

test("excluirProfissional: recusa se dá aulas ou tem reservas futuras", async () => {
  const { d, a } = novo();
  assert.match((await a.excluirProfissional("julia")).motivo, /dá aulas/);
  await a.reservar({ alunoId: "ana", tipo: "individual", servicoId: "personal", profissionalId: "rafael", data: "2026-11-12", hora: "08:00" });
  assert.match((await a.excluirProfissional("rafael")).motivo, /reservas futuras/);
  assert.ok(d.ler().profissionais.some((p) => p.id === "rafael"));
});

test("excluirProfissional sem pendências leva a disponibilidade junto", async () => {
  const { d, a } = novo();
  assert.equal((await a.excluirProfissional("marina")).ok, true);
  assert.ok(!d.ler().profissionais.some((p) => p.id === "marina"));
  assert.ok(!d.ler().disponibilidade.some((x) => x.profissionalId === "marina"));
});

test("excluirServico: recusa com reservas futuras; sem elas leva a disponibilidade junto", async () => {
  const { d, a } = novo();
  await a.reservar({ alunoId: "ana", tipo: "individual", servicoId: "personal", profissionalId: "rafael", data: "2026-11-12", hora: "08:00" });
  assert.match((await a.excluirServico("personal")).motivo, /reservas futuras/);
  assert.equal((await a.excluirServico("avaliacao")).ok, true);
  assert.ok(!d.ler().disponibilidade.some((x) => x.servicoId === "avaliacao"));
});

test("salvarDisponibilidade: o fim precisa ser depois do início", async () => {
  const { d, a } = novo();
  const base = { profissionalId: "rafael", servicoId: "personal", diaSemana: 6, inicio: "08:00", fim: "08:00" };
  assert.equal((await a.salvarDisponibilidade(base)).motivo, "O fim precisa ser depois do início.");
  assert.equal((await a.salvarDisponibilidade({ ...base, fim: "12:00" })).ok, true);
  assert.ok(d.ler().disponibilidade.some((x) => x.diaSemana === 6 && x.profissionalId === "rafael"));
});

test("salvarProfissional e salvarServico: nome obrigatório e duração positiva", async () => {
  const { a } = novo();
  assert.equal((await a.salvarProfissional({ nome: " ", especialidade: "x" })).ok, false);
  assert.equal((await a.salvarProfissional({ nome: "Paulo", especialidade: "Pilates" })).ok, true);
  assert.equal((await a.salvarServico({ nome: "Pilates", duracao: 0 })).ok, false);
  assert.equal((await a.salvarServico({ nome: "Pilates", duracao: 50 })).ok, true);
});

test("excluirDisponibilidade remove só aquele horário de atendimento", async () => {
  const { d, a } = novo();
  const antes = d.ler().disponibilidade.length;
  assert.equal((await a.excluirDisponibilidade("disp-rafael-1")).ok, true);
  assert.equal(d.ler().disponibilidade.length, antes - 1);
});

// ---- Achados da revisão final ----

test("excluir um aluno confirmado promove quem estava na espera", async () => {
  const { d, a } = novo();
  await a.excluirAluno("aluno-1004"); // confirmado na Dança lotada
  const espera = d.ler().reservas.find((r) => r.alunoId === "aluno-1012" && r.aulaId === "danca-qui-1900");
  assert.equal(espera.situacao, "confirmada");
});

test("aumentar as vagas de uma aula promove a lista de espera", async () => {
  const { d, a } = novo();
  const danca = d.ler().aulas.find((x) => x.id === "danca-qui-1900");
  assert.equal((await a.salvarAula({ ...danca, vagas: 10 })).ok, true);
  assert.equal(d.ler().reservas.find((r) => r.alunoId === "aluno-1012" && r.aulaId === "danca-qui-1900").situacao, "confirmada");
});

test("quem entra na espera depois fica atrás de quem já estava, mesmo de madrugada", async () => {
  const cedo = new Date(2026, 10, 11, 5, 0);
  const arm = new Map();
  const armazenamento = { getItem: (k) => arm.get(k) ?? null, setItem: (k, v) => void arm.set(k, String(v)), removeItem: (k) => void arm.delete(k) };
  const d = criarDados({ armazenamento, agora: () => cedo });
  const a = criarAcoes(d, () => cedo);
  const entrou = await a.reservar({ alunoId: "ana", tipo: "aula", aulaId: "danca-qui-1900", data: "2026-11-12" });
  assert.equal(entrou.situacao, "espera");
  const conf = d.ler().reservas.find((r) => r.aulaId === "danca-qui-1900" && r.situacao === "confirmada");
  const r = await a.cancelar(conf.id, { admin: true });
  assert.equal(r.promovida.alunoId, "aluno-1012"); // o da semente estava na frente da Ana
});

test("salvarAula: mudar dia ou horário com reservas futuras é recusado", async () => {
  const { d, a } = novo();
  const danca = d.ler().aulas.find((x) => x.id === "danca-qui-1900");
  const r = await a.salvarAula({ ...danca, hora: "20:00" });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /reservas futuras/);
  assert.equal(d.ler().aulas.find((x) => x.id === "danca-qui-1900").hora, "19:00");
});

test("salvarAula: editar para o mesmo nome, dia e horário de outra aula é recusado", async () => {
  const { a } = novo();
  const base = { nome: "Yoga", profissionalId: "diego", diaSemana: 0, duracao: 50, vagas: 10 };
  assert.equal((await a.salvarAula({ ...base, hora: "08:00" })).ok, true);
  assert.equal((await a.salvarAula({ ...base, hora: "09:00" })).ok, true);
  const segunda = await a.salvarAula({ ...base, id: "yoga-dom-0900", hora: "08:00" }); // edita a das 09:00 para 08:00
  assert.match(segunda.motivo, /Já existe/);
});

test("salvarAula: horário em branco ou professor inexistente é recusado", async () => {
  const { a } = novo();
  const base = { nome: "Yoga", profissionalId: "diego", diaSemana: 0, hora: "08:00", duracao: 50, vagas: 10 };
  assert.equal((await a.salvarAula({ ...base, hora: "" })).ok, false);
  assert.equal((await a.salvarAula({ ...base, hora: "25:99" })).ok, false);
  assert.equal((await a.salvarAula({ ...base, profissionalId: "ninguem" })).ok, false);
});

test("salvarAluno: vencimento em branco ou plano inexistente é recusado", async () => {
  const { a } = novo();
  const base = { nome: "Teste", whatsapp: "73900000098", planoId: "mensal", vencimento: HOJE };
  assert.equal((await a.salvarAluno({ ...base, vencimento: "" })).ok, false);
  assert.equal((await a.salvarAluno({ ...base, vencimento: "2026-02-31" })).ok, false);
  assert.equal((await a.salvarAluno({ ...base, planoId: "nao-existe" })).ok, false);
});

test("criarNovoId funciona mesmo sem crypto.randomUUID (endereço http de rede local)", () => {
  const semUuid = criarNovoId({ getRandomValues: (v) => v.fill(7) });
  const semCrypto = criarNovoId(undefined);
  assert.ok(semUuid().length >= 8);
  assert.notEqual(semCrypto(), semCrypto());
});
