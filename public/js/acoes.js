// acoes.js — Tudo que as telas "fazem": reservar, cancelar, registrar pagamento, excluir...
// Junta as regras (regras.js) com a gravação (dados.js). As telas só chamam daqui.
// Cada ação entra numa fila, então dois cliques seguidos nunca se atropelam.
import { dataISO, criarSlug, telefoneValido } from "./formato.js";
import {
  MENSAGENS, avaliarPedido, avaliarCancelamento, avaliarVagas, quemSobe, novoVencimento, inicio,
} from "./regras.js";

const ativa = (r) => r.situacao !== "cancelada";
const hhmm = (hora) => String(hora).replace(":", "");
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

// Aceita DDD + número, com ou sem o 55 na frente (a semente usa o 55)
function whatsappValido(texto) {
  let d = String(texto ?? "").replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return telefoneValido(d);
}

export function criarAcoes(dados, agora = () => new Date()) {
  let fila = Promise.resolve();
  // Roda a ação depois das anteriores, mesmo que alguma tenha dado erro
  const enfileirar = (fn) => {
    const resultado = fila.then(fn);
    fila = resultado.catch(() => {});
    return resultado;
  };

  return {
    // Devolve o aluno ou null
    async entrar(matricula) {
      const procurada = String(matricula ?? "").trim();
      if (!procurada) return null;
      return dados.ler().alunos.find((a) => String(a.matricula) === procurada) ?? null;
    },

    reservar: (pedido) => enfileirar(async () => {
      const estado = dados.ler();
      const avaliacao = avaliarPedido(estado, pedido, agora());
      if (!avaliacao.ok) return avaliacao;
      const aula = pedido.tipo === "aula" ? estado.aulas.find((a) => a.id === pedido.aulaId) : null;
      const reserva = {
        alunoId: pedido.alunoId, tipo: pedido.tipo, data: pedido.data,
        hora: aula ? aula.hora : pedido.hora, situacao: avaliacao.situacao, criadaEm: agora().toISOString(),
        ...(aula ? { aulaId: aula.id } : { servicoId: pedido.servicoId, profissionalId: pedido.profissionalId }),
      };
      const salva = await dados.salvar("reservas", reserva);
      return { ok: true, situacao: avaliacao.situacao, reserva: salva };
    }),

    // Cancela e, se liberou uma vaga de aula, sobe o primeiro da lista de espera
    cancelar: (reservaId, { admin = false } = {}) => enfileirar(async () => {
      const estado = dados.ler();
      const reserva = estado.reservas.find((r) => r.id === reservaId);
      if (!reserva) return { ok: false, motivo: "Reserva não encontrada." };
      const avaliacao = avaliarCancelamento(reserva, agora(), { admin });
      if (!avaliacao.ok) return avaliacao;
      const mudancas = [{ colecao: "reservas", salvar: { ...reserva, situacao: "cancelada" } }];
      let promovida = null;
      if (reserva.tipo === "aula" && reserva.situacao === "confirmada") {
        const proxima = quemSobe(estado.reservas, reserva.aulaId, reserva.data);
        if (proxima) {
          promovida = { ...proxima, situacao: "confirmada" };
          mudancas.push({ colecao: "reservas", salvar: promovida });
        }
      }
      await dados.aplicar(mudancas);
      return { ok: true, promovida };
    }),

    registrarPagamento: (alunoId) => enfileirar(async () => {
      const estado = dados.ler();
      const aluno = estado.alunos.find((a) => a.id === alunoId);
      const plano = estado.planos.find((p) => p.id === aluno?.planoId);
      if (!aluno || !plano) return { ok: false, motivo: "Aluno ou plano não encontrado." };
      const hoje = dataISO(agora());
      const vencimento = novoVencimento(aluno.vencimento, plano.meses, hoje);
      await dados.aplicar([
        { colecao: "pagamentos", salvar: { id: globalThis.crypto.randomUUID(), alunoId, nomeAluno: aluno.nome, data: hoje, valor: plano.valor, planoId: plano.id } },
        { colecao: "alunos", salvar: { ...aluno, vencimento } },
      ]);
      return { ok: true, vencimento };
    }),

    salvarAluno: (aluno) => enfileirar(async () => {
      const estado = dados.ler();
      if (!String(aluno.nome ?? "").trim()) return { ok: false, motivo: "Digite o nome do aluno." };
      if (!whatsappValido(aluno.whatsapp)) return { ok: false, motivo: "WhatsApp inválido. Use DDD + número." };
      let matricula = String(aluno.matricula ?? "").trim();
      if (!matricula) matricula = String(Math.max(1000, ...estado.alunos.map((a) => Number(a.matricula) || 0)) + 1);
      if (estado.alunos.some((a) => String(a.matricula) === matricula && a.id !== aluno.id)) {
        return { ok: false, motivo: MENSAGENS.matriculaRepetida };
      }
      const salvo = await dados.salvar("alunos", { ...aluno, nome: aluno.nome.trim(), matricula });
      return { ok: true, aluno: salvo };
    }),

    salvarAula: (aula) => enfileirar(async () => {
      const estado = dados.ler();
      if (!String(aula.nome ?? "").trim()) return { ok: false, motivo: "Digite o nome da aula." };
      if (!(Number(aula.vagas) >= 1) || !(Number(aula.duracao) >= 1)) return { ok: false, motivo: "Vagas e duração precisam ser pelo menos 1." };
      const completa = {
        ...aula, nome: aula.nome.trim(), diaSemana: Number(aula.diaSemana),
        vagas: Number(aula.vagas), duracao: Number(aula.duracao),
      };
      if (aula.id) {
        const avaliacao = avaliarVagas(estado, aula.id, completa.vagas, agora());
        if (!avaliacao.ok) return avaliacao;
      } else {
        completa.id = `${criarSlug(completa.nome)}-${DIAS[completa.diaSemana]}-${hhmm(completa.hora)}`;
        if (estado.aulas.some((a) => a.id === completa.id)) return { ok: false, motivo: "Já existe esta aula neste dia e horário." };
      }
      await dados.salvar("aulas", completa);
      return { ok: true };
    }),

    salvarPlano: (plano) => enfileirar(async () => {
      const valor = Number(plano.valor);
      const meses = Math.trunc(Number(plano.meses));
      if (!String(plano.nome ?? "").trim()) return { ok: false, motivo: "Digite o nome do plano." };
      if (!(valor > 0)) return { ok: false, motivo: "O valor precisa ser maior que zero." };
      if (!(meses >= 1)) return { ok: false, motivo: "A duração precisa ser de pelo menos 1 mês." };
      await dados.salvar("planos", { ...plano, nome: plano.nome.trim(), valor, meses });
      return { ok: true };
    }),

    excluirPlano: (planoId) => enfileirar(async () => {
      const usam = dados.ler().alunos.filter((a) => a.planoId === planoId).length;
      if (usam > 0) return { ok: false, motivo: `${usam} ${usam === 1 ? "aluno usa" : "alunos usam"} este plano. Troque o plano deles antes.` };
      await dados.remover("planos", planoId);
      return { ok: true };
    }),

    salvarProfissional: (profissional) => enfileirar(async () => {
      if (!String(profissional.nome ?? "").trim()) return { ok: false, motivo: "Digite o nome do profissional." };
      await dados.salvar("profissionais", { ...profissional, nome: profissional.nome.trim(), especialidade: String(profissional.especialidade ?? "").trim() });
      return { ok: true };
    }),

    // Não apaga quem ainda dá aula ou tem atendimento marcado; a disponibilidade vai junto
    excluirProfissional: (profissionalId) => enfileirar(async () => {
      const estado = dados.ler();
      if (estado.aulas.some((a) => a.profissionalId === profissionalId)) {
        return { ok: false, motivo: "Este profissional dá aulas coletivas. Troque o professor dessas aulas antes." };
      }
      if (estado.reservas.some((r) => r.profissionalId === profissionalId && ativa(r) && inicio(r.data, r.hora) > agora())) {
        return { ok: false, motivo: "Há reservas futuras com este profissional. Cancele-as antes." };
      }
      await dados.aplicar([
        ...estado.disponibilidade.filter((d) => d.profissionalId === profissionalId).map((d) => ({ colecao: "disponibilidade", remover: d.id })),
        { colecao: "profissionais", remover: profissionalId },
      ]);
      return { ok: true };
    }),

    salvarServico: (servico) => enfileirar(async () => {
      const duracao = Math.trunc(Number(servico.duracao));
      if (!String(servico.nome ?? "").trim()) return { ok: false, motivo: "Digite o nome do serviço." };
      if (!(duracao >= 1)) return { ok: false, motivo: "A duração precisa ser de pelo menos 1 minuto." };
      await dados.salvar("servicos", { ...servico, nome: servico.nome.trim(), duracao });
      return { ok: true };
    }),

    excluirServico: (servicoId) => enfileirar(async () => {
      const estado = dados.ler();
      if (estado.reservas.some((r) => r.servicoId === servicoId && ativa(r) && inicio(r.data, r.hora) > agora())) {
        return { ok: false, motivo: "Há reservas futuras deste serviço. Cancele-as antes." };
      }
      await dados.aplicar([
        ...estado.disponibilidade.filter((d) => d.servicoId === servicoId).map((d) => ({ colecao: "disponibilidade", remover: d.id })),
        { colecao: "servicos", remover: servicoId },
      ]);
      return { ok: true };
    }),

    salvarDisponibilidade: (disp) => enfileirar(async () => {
      if (!disp.profissionalId || !disp.servicoId) return { ok: false, motivo: "Escolha o profissional e o serviço." };
      if (!disp.inicio || !disp.fim || disp.fim <= disp.inicio) return { ok: false, motivo: "O fim precisa ser depois do início." };
      await dados.salvar("disponibilidade", { ...disp, diaSemana: Number(disp.diaSemana) });
      return { ok: true };
    }),

    excluirDisponibilidade: (id) => enfileirar(async () => {
      await dados.remover("disponibilidade", id);
      return { ok: true };
    }),

    reservasFuturasDaAula(aulaId) {
      return dados.ler().reservas.filter((r) => r.aulaId === aulaId && ativa(r) && inicio(r.data, r.hora) > agora()).length;
    },

    // Cancela as reservas futuras da aula e apaga a aula. As passadas ficam (histórico e cartão de energia).
    excluirAula: (aulaId) => enfileirar(async () => {
      const futuras = dados.ler().reservas.filter((r) => r.aulaId === aulaId && ativa(r) && inicio(r.data, r.hora) > agora());
      await dados.aplicar([
        ...futuras.map((r) => ({ colecao: "reservas", salvar: { ...r, situacao: "cancelada" } })),
        { colecao: "aulas", remover: aulaId },
      ]);
      return { ok: true, canceladas: futuras.length };
    }),

    // Apaga o aluno e as reservas dele. Os pagamentos ficam (a receita do mês não muda).
    excluirAluno: (alunoId) => enfileirar(async () => {
      const reservas = dados.ler().reservas.filter((r) => r.alunoId === alunoId);
      await dados.aplicar([
        ...reservas.map((r) => ({ colecao: "reservas", remover: r.id })),
        { colecao: "alunos", remover: alunoId },
      ]);
      return { ok: true };
    }),
  };
}
