// semente.js — Dados de demonstração (tudo fictício).
// As datas são calculadas a partir de "hoje", então a Ana está sempre em dia,
// o Bruno sempre a 3 dias do vencimento e a Carla sempre em atraso.
import { dataISO } from "./formato.js";
import { inicio, somarDias, somarMeses, ocorrencias } from "./regras.js";

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const hhmm = (hora) => hora.replace(":", "");

// Uma aula por dia da semana e horário (o id mostra qual é: "danca-qui-1900")
function montarAulas() {
  const grade = [
    { slug: "spinning", nome: "Spinning", prof: "diego", dias: [1, 3, 5], horas: ["07:00", "19:00"], duracao: 45, vagas: 15 },
    { slug: "funcional", nome: "Funcional", prof: "julia", dias: [2, 4], horas: ["18:00"], duracao: 50, vagas: 20 },
    { slug: "funcional", nome: "Funcional", prof: "julia", dias: [6], horas: ["09:00"], duracao: 50, vagas: 20 },
    { slug: "danca", nome: "Dança (ritmos)", prof: "julia", dias: [2, 4], horas: ["19:00"], duracao: 60, vagas: 8 },
    { slug: "muay-thai", nome: "Muay Thai", prof: "diego", dias: [1, 3], horas: ["20:00"], duracao: 60, vagas: 16 },
  ];
  const aulas = [];
  for (const g of grade) {
    for (const dia of g.dias) {
      for (const hora of g.horas) {
        aulas.push({
          id: `${g.slug}-${DIAS[dia]}-${hhmm(hora)}`, nome: g.nome, profissionalId: g.prof,
          diaSemana: dia, hora, duracao: g.duracao, vagas: g.vagas,
        });
      }
    }
  }
  return aulas;
}

export function criarSemente(agora) {
  const hoje = dataISO(agora);
  const planos = [
    { id: "mensal", nome: "Mensal", valor: 80, meses: 1 },
    { id: "trimestral", nome: "Trimestral", valor: 220, meses: 3 },
    { id: "semestral", nome: "Semestral", valor: 420, meses: 6 },
  ];
  const profissionais = [
    { id: "diego", nome: "Diego Rocha", especialidade: "Spinning e Muay Thai" },
    { id: "julia", nome: "Júlia Santos", especialidade: "Funcional e Dança" },
    { id: "rafael", nome: "Rafael Lima", especialidade: "Personal trainer" },
    { id: "marina", nome: "Marina Alves", especialidade: "Avaliação física" },
  ];
  const servicos = [
    { id: "personal", nome: "Personal", duracao: 60 },
    { id: "avaliacao", nome: "Avaliação física", duracao: 40 },
  ];
  const disponibilidade = [];
  for (const dia of [1, 2, 3, 4, 5]) {
    disponibilidade.push({ id: `disp-rafael-${dia}`, profissionalId: "rafael", servicoId: "personal", diaSemana: dia, inicio: "06:00", fim: "10:00" });
  }
  for (const dia of [2, 4]) {
    disponibilidade.push({ id: `disp-marina-${dia}`, profissionalId: "marina", servicoId: "avaliacao", diaSemana: dia, inicio: "14:00", fim: "18:00" });
  }

  const nomes = ["Diego Martins", "Elisa Prado", "Fábio Neves", "Giovana Reis", "Heitor Campos", "Isabela Cunha", "João Pedro Dias", "Larissa Melo", "Mateus Ferraz"];
  const alunos = [
    { id: "ana", matricula: "1001", nome: "Ana", whatsapp: "5573900000001", planoId: "mensal", vencimento: somarDias(hoje, 20) },
    { id: "bruno", matricula: "1002", nome: "Bruno", whatsapp: "5573900000002", planoId: "mensal", vencimento: somarDias(hoje, 3) },
    { id: "carla", matricula: "1003", nome: "Carla", whatsapp: "5573900000003", planoId: "mensal", vencimento: somarDias(hoje, -7) },
    ...nomes.map((nome, i) => ({
      id: `aluno-${1004 + i}`, matricula: String(1004 + i), nome, whatsapp: `55739000000${String(10 + i)}`,
      planoId: ["mensal", "trimestral", "semestral"][i % 3],
      vencimento: i === 5 ? somarDias(hoje, -3) : somarDias(hoje, 8 + i * 4), // a Isabela (1009) está em atraso
    })),
  ];
  const pagamentos = alunos.map((a, i) => {
    const plano = planos.find((p) => p.id === a.planoId);
    return { id: `pag-${i + 1}`, alunoId: a.id, nomeAluno: a.nome, data: somarMeses(a.vencimento, -plano.meses), valor: plano.valor, planoId: plano.id };
  });

  const aulas = montarAulas();
  const reservas = [];
  const reservar = (alunoId, aula, data, situacao, criada) => reservas.push({
    id: `res-${reservas.length + 1}`, alunoId, tipo: "aula", aulaId: aula.id, data, hora: aula.hora,
    situacao, criadaEm: `${hoje}T${criada}`,
  });

  // Ana: Spinning das 07:00 nos últimos 21 dias (os treinos do cartão de energia) + 1 reserva futura
  const spinning7 = aulas.filter((a) => a.id.startsWith("spinning-") && a.hora === "07:00");
  for (let i = -21; i <= 0; i++) {
    const data = somarDias(hoje, i);
    const dia = new Date(Number(data.slice(0, 4)), Number(data.slice(5, 7)) - 1, Number(data.slice(8))).getDay();
    const aula = spinning7.find((a) => a.diaSemana === dia);
    if (aula && inicio(data, aula.hora) <= agora) reservar("ana", aula, data, "confirmada", "07:00:00");
  }
  const futuras = ocorrencias(aulas, hoje, 8).filter((o) => inicio(o.data, o.hora) > agora);
  const porId = (id) => aulas.find((a) => a.id === id);
  const proxSpinning = futuras.find((o) => o.aulaId.startsWith("spinning-") && o.hora === "07:00");
  if (proxSpinning) reservar("ana", porId(proxSpinning.aulaId), proxSpinning.data, "confirmada", "07:30:00");

  // A próxima Dança vem lotada (8 confirmados) e com 1 pessoa na lista de espera
  const proxDanca = futuras.find((o) => o.aulaId.startsWith("danca-"));
  const extras = alunos.slice(3);
  extras.slice(0, 8).forEach((a, i) => reservar(a.id, porId(proxDanca.aulaId), proxDanca.data, "confirmada", `08:${String(10 + i)}:00`));
  reservar(extras[8].id, porId(proxDanca.aulaId), proxDanca.data, "espera", "09:00:00");

  // Os outros alunos também têm uma aula marcada, para as barras de vagas não ficarem vazias
  const outras = futuras.filter((o) => !o.aulaId.startsWith("danca-"));
  extras.slice(0, 8).forEach((a, i) => {
    const o = outras[(i * 3) % outras.length];
    reservar(a.id, porId(o.aulaId), o.data, "confirmada", `10:${String(10 + i)}:00`);
  });

  return {
    versao: 1,
    config: { aulasLigadas: true, individualLigado: true },
    planos, alunos, pagamentos, profissionais, aulas, servicos, disponibilidade, reservas,
  };
}
