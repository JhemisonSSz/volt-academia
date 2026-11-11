// cancelamento.js — "Tem certeza?" + cancelar. Usado nas telas Aulas e Reservas.
import { confirmar } from "../componentes/modal.js";
import { acoes } from "../componentes/usarEstado.js";
import { descreverReserva, rotuloDia } from "../descricao.js";

export async function cancelarComConfirmacao(reserva, estado, avisar) {
  const espera = reserva.situacao === "espera";
  const { titulo } = descreverReserva(reserva, estado);
  const quer = await confirmar({
    titulo: espera ? "Sair da lista de espera?" : "Cancelar esta reserva?",
    texto: `${titulo} · ${rotuloDia(reserva.data)} às ${reserva.hora}`,
    botao: espera ? "Sair da espera" : "Cancelar reserva",
  });
  if (!quer) return;
  let resultado;
  try {
    resultado = await acoes.cancelar(reserva.id);
  } catch {
    resultado = { ok: false, motivo: "Algo deu errado. Tente de novo." };
  }
  avisar(resultado.ok ? (espera ? "Você saiu da lista de espera." : "Reserva cancelada.") : resultado.motivo, resultado.ok ? "ok" : "erro");
}
