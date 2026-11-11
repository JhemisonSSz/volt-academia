// Testes das regras de negócio (public/js/regras.js). Rode com: npm test
// "Hoje" fica fixo para os testes não mudarem de resultado com o passar dos dias.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MENSAGENS, somarMeses, statusMensalidade, diasParaVencer, novoVencimento, resumoEnergia, receitaDoMes,
  ocorrencias, avaliarPedido, avaliarCancelamento, quemSobe, horariosLivres, avaliarVagas, duracaoDaReserva, segundaDaSemana,
} from "../public/js/regras.js";

const AGORA = new Date(2026, 10, 11, 10, 0); // quarta-feira, 11/11/2026, 10h
const HOJE = "2026-11-11";

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

// ---- Grade, reservas, espera e horários livres ----

// Estado pequeno: Dança (qui 19:00, 2 vagas) e Spinning (qui 19:30) + Personal com Rafael
function estadoTeste() {
  return {
    config: { aulasLigadas: true, individualLigado: true },
    alunos: [
      { id: "a", matricula: "1", nome: "A", vencimento: "2026-12-01" },
      { id: "c", matricula: "3", nome: "C", vencimento: "2026-11-04" },
    ],
    aulas: [
      { id: "danca", nome: "Dança", diaSemana: 4, hora: "19:00", duracao: 60, vagas: 2 },
      { id: "spin", nome: "Spinning", diaSemana: 4, hora: "19:30", duracao: 45, vagas: 15 },
    ],
    servicos: [{ id: "personal", nome: "Personal", duracao: 60 }],
    disponibilidade: [{ id: "d1", profissionalId: "rafael", servicoId: "personal", diaSemana: 4, inicio: "06:00", fim: "10:00" }],
    reservas: [],
  };
}

const HORAS = { danca: "19:00", spin: "19:30" };
const res = (alunoId, aulaId, data, situacao) =>
  ({ alunoId, tipo: "aula", aulaId, data, hora: HORAS[aulaId] ?? "19:00", situacao, criadaEm: "2026-11-10T08:00:00" });

test("ocorrencias: próximos 7 dias em ordem", () => {
  const e = estadoTeste();
  assert.deepEqual(ocorrencias(e.aulas, HOJE, 7).map((o) => `${o.data} ${o.hora}`),
    ["2026-11-12 19:00", "2026-11-12 19:30"]);
});

test("avaliarPedido: confirma até lotar, depois espera", () => {
  const e = estadoTeste();
  const p = { alunoId: "a", tipo: "aula", aulaId: "danca", data: "2026-11-12" };
  assert.deepEqual(avaliarPedido(e, p, AGORA), { ok: true, situacao: "confirmada" });
  e.reservas.push(res("x", "danca", "2026-11-12", "confirmada"), res("y", "danca", "2026-11-12", "confirmada"));
  assert.deepEqual(avaliarPedido(e, p, AGORA), { ok: true, situacao: "espera" });
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

test("avaliarPedido: individual só em horário livre", () => {
  const e = estadoTeste();
  const p = { alunoId: "a", tipo: "individual", servicoId: "personal", profissionalId: "rafael", data: "2026-11-12", hora: "07:00" };
  assert.deepEqual(avaliarPedido(e, p, AGORA), { ok: true, situacao: "confirmada" });
  assert.equal(avaliarPedido(e, { ...p, hora: "07:30" }, AGORA).motivo, MENSAGENS.ocupado);
  e.reservas.push({ ...p, alunoId: "x", situacao: "confirmada" });
  assert.equal(avaliarPedido(e, p, AGORA).motivo, MENSAGENS.ocupado);
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
  assert.deepEqual(horariosLivres(e, q, new Date(2026, 10, 12, 7, 30)), ["08:00", "09:00"]);
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

test("segundaDaSemana: domingo volta para a segunda anterior", () => {
  assert.equal(segundaDaSemana("2026-11-11"), "2026-11-09"); // quarta
  assert.equal(segundaDaSemana("2026-11-09"), "2026-11-09"); // a própria segunda
  assert.equal(segundaDaSemana("2026-11-15"), "2026-11-09"); // domingo
});
