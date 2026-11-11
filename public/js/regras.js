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

// ---- Grade de aulas ----

// Todas as aulas que acontecem de "de" até "de + dias - 1", em ordem de data e hora
export function ocorrencias(aulas, de, dias) {
  const lista = [];
  for (let i = 0; i < dias; i++) {
    const data = somarDias(de, i);
    const diaSemana = paraData(data).getDay();
    for (const aula of aulas) {
      if (aula.diaSemana === diaSemana) lista.push({ aulaId: aula.id, data, hora: aula.hora });
    }
  }
  return lista.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
}

const ativa = (r) => r.situacao !== "cancelada";

export function contagem(reservas, aulaId, data) {
  let confirmadas = 0, espera = 0;
  for (const r of reservas) {
    if (r.aulaId !== aulaId || r.data !== data) continue;
    if (r.situacao === "confirmada") confirmadas++;
    else if (r.situacao === "espera") espera++;
  }
  return { confirmadas, espera };
}

// Minutos que a reserva ocupa. Aula ou serviço que não existe mais: 60 minutos.
export function duracaoDaReserva(reserva, estado) {
  const fonte = reserva.tipo === "aula"
    ? (estado.aulas ?? []).find((a) => a.id === reserva.aulaId)
    : (estado.servicos ?? []).find((s) => s.id === reserva.servicoId);
  return Number(fonte?.duracao) || 60;
}

const MIN_MS = 60 * 1000;
const fimDe = (comeco, minutos) => new Date(comeco.getTime() + minutos * MIN_MS);
const sobrepoe = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;

// ---- Pedido de reserva ----

// pedido = { alunoId, tipo: "aula", aulaId, data }
//        | { alunoId, tipo: "individual", servicoId, profissionalId, data, hora }
export function avaliarPedido(estado, pedido, agora) {
  const recusa = (motivo) => ({ ok: false, motivo });
  const ehAula = pedido.tipo === "aula";
  const ligado = ehAula ? estado.config?.aulasLigadas : estado.config?.individualLigado;
  if (!ligado) return recusa(MENSAGENS.desligado);

  const aluno = (estado.alunos ?? []).find((a) => a.id === pedido.alunoId);
  if (!aluno) return recusa(MENSAGENS.matricula);
  const hoje = dataISO(agora);
  if (statusMensalidade(aluno.vencimento, hoje) === "em-atraso") return recusa(MENSAGENS.atraso);

  const aula = ehAula ? (estado.aulas ?? []).find((a) => a.id === pedido.aulaId) : null;
  if (ehAula && !aula) return recusa("Esta aula não existe mais.");
  const hora = ehAula ? aula.hora : pedido.hora;
  const comeco = inicio(pedido.data, hora);
  if (comeco <= agora) return recusa(MENSAGENS.passou);
  if (pedido.data > somarDias(hoje, 7)) return recusa(MENSAGENS.longe);

  const minhas = (estado.reservas ?? []).filter((r) => r.alunoId === pedido.alunoId && ativa(r));
  const repetida = minhas.some((r) => r.data === pedido.data && (ehAula
    ? r.tipo === "aula" && r.aulaId === pedido.aulaId
    : r.tipo === "individual" && r.profissionalId === pedido.profissionalId && r.hora === pedido.hora));
  if (repetida) return recusa(MENSAGENS.repetida);

  const duracao = ehAula ? aula.duracao : duracaoDaReserva(pedido, estado);
  const fim = fimDe(comeco, duracao);
  const choque = minhas.find((r) => {
    const c = inicio(r.data, r.hora);
    return sobrepoe(comeco, fim, c, fimDe(c, duracaoDaReserva(r, estado)));
  });
  if (choque) return recusa(MENSAGENS.conflito(choque.hora));

  if (!ehAula) {
    const livres = horariosLivres(estado, pedido, agora);
    if (!livres.includes(pedido.hora)) return recusa(MENSAGENS.ocupado);
    return { ok: true, situacao: "confirmada" };
  }
  const { confirmadas } = contagem(estado.reservas ?? [], aula.id, pedido.data);
  return { ok: true, situacao: confirmadas < aula.vagas ? "confirmada" : "espera" };
}

// Aluno: confirmada só até 2 horas antes; espera pode sair até a aula começar.
// Admin: sempre pode.
export function avaliarCancelamento(reserva, agora, { admin = false } = {}) {
  if (reserva.situacao === "cancelada") return { ok: false, motivo: "Esta reserva já foi cancelada." };
  if (admin) return { ok: true };
  const comeco = inicio(reserva.data, reserva.hora);
  if (reserva.situacao === "espera") return comeco > agora ? { ok: true } : { ok: false, motivo: MENSAGENS.passou };
  return comeco - agora >= 2 * 60 * MIN_MS ? { ok: true } : { ok: false, motivo: MENSAGENS.prazoCancelar };
}

// Quem está há mais tempo na lista de espera daquela aula e dia
export function quemSobe(reservas, aulaId, data) {
  const fila = reservas
    .filter((r) => r.aulaId === aulaId && r.data === data && r.situacao === "espera")
    .sort((a, b) => String(a.criadaEm).localeCompare(String(b.criadaEm)));
  return fila[0] ?? null;
}

// ---- Atendimento individual ----

const paraMinutos = (hora) => { const [h, m] = hora.split(":").map(Number); return h * 60 + m; };
const paraHora = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function horariosLivres(estado, { profissionalId, servicoId, data }, agora) {
  const hoje = dataISO(agora);
  if (data > somarDias(hoje, 7) || data < hoje) return [];
  const servico = (estado.servicos ?? []).find((s) => s.id === servicoId);
  if (!servico) return [];
  const diaSemana = paraData(data).getDay();
  const ocupados = (estado.reservas ?? [])
    .filter((r) => ativa(r) && r.profissionalId === profissionalId && r.data === data)
    .map((r) => { const c = inicio(r.data, r.hora); return [c, fimDe(c, duracaoDaReserva(r, estado))]; });

  const livres = [];
  const janelas = (estado.disponibilidade ?? []).filter((d) =>
    d.profissionalId === profissionalId && d.servicoId === servicoId && d.diaSemana === diaSemana);
  for (const janela of janelas) {
    const fimJanela = paraMinutos(janela.fim);
    for (let m = paraMinutos(janela.inicio); m + servico.duracao <= fimJanela; m += servico.duracao) {
      const hora = paraHora(m);
      const comeco = inicio(data, hora);
      const fim = fimDe(comeco, servico.duracao);
      if (comeco <= agora) continue;
      if (ocupados.some(([a, b]) => sobrepoe(comeco, fim, a, b))) continue;
      livres.push(hora);
    }
  }
  return [...new Set(livres)].sort();
}

// ---- Painel ----

// Não deixa salvar uma aula com menos vagas que os confirmados da próxima vez que ela acontece
export function avaliarVagas(estado, aulaId, novasVagas, agora) {
  const aula = (estado.aulas ?? []).find((a) => a.id === aulaId);
  if (!aula) return { ok: true };
  const proxima = ocorrencias([aula], dataISO(agora), 8).find((o) => inicio(o.data, o.hora) > agora);
  if (!proxima) return { ok: true };
  const { confirmadas } = contagem(estado.reservas ?? [], aulaId, proxima.data);
  return Number(novasVagas) >= confirmadas ? { ok: true } : { ok: false, motivo: MENSAGENS.vagas(confirmadas, proxima.data) };
}
