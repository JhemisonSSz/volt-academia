// regras.js — As regras de negócio da academia, em funções "puras":
// recebem dados e devolvem resultados. Não mexem na página nem no localStorage,
// e o "agora" sempre vem de fora. Por isso dá para testar tudo com "npm test".
import { dataISO, paraData, dataBR } from "./formato.js";

export const MENSAGENS = {
  atraso: "Regularize sua mensalidade na recepção para reservar.",
  passou: "Este horário já passou.",
  longe: "Só dá para reservar até 7 dias à frente.",
  repetida: "Você já reservou este horário.",
  conflito: (hora) => `Você já tem uma reserva às ${hora}.`,
  ocupado: "Este horário acabou de ser ocupado. Escolha outro.",
  desligado: "Este tipo de agendamento está desligado.",
  prazoCancelar: "Cancelamento só até 2 horas antes. Fale com a recepção.",
  vagas: (n, data) => `Esta aula tem ${n} alunos confirmados no dia ${dataBR(data)}. Use pelo menos ${n} vagas.`,
  matricula: "Matrícula não encontrada. Confira o número ou fale com a recepção.",
  matriculaRepetida: "Já existe um aluno com esta matrícula.",
};

const DIA_MS = 24 * 60 * 60 * 1000;

// ---- Datas ----

// "2026-11-12" + "19:00" -> Date local
export function inicio(data, hora) {
  const d = paraData(data);
  const [h, m] = String(hora).split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export function somarDias(data, n) {
  const d = paraData(data);
  d.setDate(d.getDate() + n);
  return dataISO(d);
}

// Se o dia não existe no mês de destino (31/02), usa o último dia do mês
export function somarMeses(data, n) {
  const d = paraData(data);
  const alvo = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(d.getDate(), ultimoDia));
  return dataISO(alvo);
}

// Diferença em dias inteiros entre duas datas "AAAA-MM-DD"
const diferencaDias = (de, ate) => Math.round((paraData(ate) - paraData(de)) / DIA_MS);

// Segunda-feira da semana da data
function segundaDaSemana(data) {
  const d = paraData(data);
  const recuo = (d.getDay() + 6) % 7; // segunda = 0 ... domingo = 6
  return somarDias(data, -recuo);
}

// ---- Mensalidade ----

export function diasParaVencer(vencimento, hoje) {
  return diferencaDias(hoje, vencimento);
}

export function statusMensalidade(vencimento, hoje) {
  const dias = diasParaVencer(vencimento, hoje);
  if (dias < 0) return "em-atraso";
  if (dias <= 5) return "vence-em-breve";
  return "em-dia";
}

// Pagou: conta a partir do vencimento (se ainda está em dia) ou de hoje (se atrasou)
export function novoVencimento(vencimento, meses, hoje) {
  const base = vencimento > hoje ? vencimento : hoje;
  return somarMeses(base, meses);
}

export function receitaDoMes(pagamentos, hoje) {
  const mes = hoje.slice(0, 7);
  return pagamentos
    .filter((p) => String(p.data).slice(0, 7) === mes)
    .reduce((soma, p) => soma + (Number(p.valor) || 0), 0);
}

// ---- Cartão de energia ----

// Treino = reserva confirmada do aluno que já começou (não há controle de presença)
export function resumoEnergia(reservas, alunoId, agora) {
  const treinos = reservas.filter(
    (r) => r.alunoId === alunoId && r.situacao === "confirmada" && inicio(r.data, r.hora) <= agora,
  );
  const hoje = dataISO(agora);
  const mes = hoje.slice(0, 7);
  const treinosNoMes = treinos.filter((r) => r.data.slice(0, 7) === mes).length;

  const semanasComTreino = new Set(treinos.map((r) => segundaDaSemana(r.data)));
  let semana = segundaDaSemana(hoje);
  if (!semanasComTreino.has(semana)) semana = somarDias(semana, -7);
  let semanasSeguidas = 0;
  while (semanasComTreino.has(semana)) {
    semanasSeguidas++;
    semana = somarDias(semana, -7);
  }
  return { treinosNoMes, semanasSeguidas };
}
