// descricao.js — Transforma reservas e datas em texto para as telas (aluno e painel usam os mesmos).
import { paraData } from "./formato.js";
import { inicio } from "./regras.js";

const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const NOMES_DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const dois = (n) => String(n).padStart(2, "0");

// "2026-11-12" -> "Qui 12/11"
export function rotuloDia(iso) {
  const d = paraData(iso);
  return `${DIAS_CURTOS[d.getDay()]} ${dois(d.getDate())}/${dois(d.getMonth() + 1)}`;
}

// "2026-11-12" -> "Qui" e "12"
export function partesDia(iso) {
  const d = paraData(iso);
  return { semana: DIAS_CURTOS[d.getDay()], numero: dois(d.getDate()) };
}

export const primeiroNome = (nome) => String(nome ?? "").trim().split(/\s+/)[0] ?? "";

// { titulo, detalhe } de uma reserva, mesmo que a aula ou o profissional já tenham sido removidos
export function descreverReserva(reserva, estado) {
  if (reserva.tipo === "aula") {
    const aula = estado.aulas.find((a) => a.id === reserva.aulaId);
    const prof = estado.profissionais.find((p) => p.id === aula?.profissionalId);
    return { titulo: aula?.nome ?? "Aula removida", detalhe: prof?.nome ?? "" };
  }
  const servico = estado.servicos.find((s) => s.id === reserva.servicoId);
  const prof = estado.profissionais.find((p) => p.id === reserva.profissionalId);
  return { titulo: servico?.nome ?? "Atendimento", detalhe: prof?.nome ?? "" };
}

export const ROTULO_SITUACAO = { confirmada: "Confirmada", espera: "Na lista de espera", cancelada: "Cancelada" };

// Reservas ativas do aluno que ainda vão acontecer, da mais próxima para a mais distante
export function proximasReservas(estado, alunoId, agora) {
  return estado.reservas
    .filter((r) => r.alunoId === alunoId && r.situacao !== "cancelada" && inicio(r.data, r.hora) > agora)
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
}
