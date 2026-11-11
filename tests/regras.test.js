// Testes das regras de negócio (public/js/regras.js). Rode com: npm test
// "Hoje" fica fixo para os testes não mudarem de resultado com o passar dos dias.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  somarMeses, statusMensalidade, diasParaVencer, novoVencimento, resumoEnergia, receitaDoMes,
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
