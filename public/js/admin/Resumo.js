// Resumo.js — Primeira tela do painel: números do dia e da semana.
import { html } from "../react.js";
import { Cartao, BarraVagas } from "../componentes/basicos.js";
import { dataBR, dataISO, moeda } from "../formato.js";
import { contagem, ocorrencias, receitaDoMes, statusMensalidade, inicio } from "../regras.js";
import { nomeDoPagador } from "../descricao.js";

const FORMAS = { pix: "Pix", cartao: "Cartão", recepcao: "Recepção" };

export function Resumo({ estado }) {
  const agora = new Date();
  const hoje = dataISO(agora);

  const reservasHoje = estado.reservas.filter((r) => r.data === hoje && r.situacao === "confirmada").length;
  const emAtraso = estado.alunos.filter((a) => statusMensalidade(a.vencimento, hoje) === "em-atraso").length;
  const receita = receitaDoMes(estado.pagamentos, hoje);

  // Ocupação: confirmados / vagas, somando as aulas dos próximos 7 dias (a mesma janela que o aluno enxerga)
  const semana = ocorrencias(estado.aulas, hoje, 7);
  let ocupadas = 0, vagas = 0;
  for (const o of semana) {
    ocupadas += contagem(estado.reservas, o.aulaId, o.data).confirmadas;
    vagas += estado.aulas.find((a) => a.id === o.aulaId).vagas;
  }
  const ocupacao = vagas > 0 ? Math.round((ocupadas / vagas) * 100) : 0;

  const aulasHoje = ocorrencias(estado.aulas, hoje, 1);
  const pagamentosDoMes = estado.pagamentos
    .filter((p) => String(p.data).slice(0, 7) === hoje.slice(0, 7))
    .sort((a, b) => b.data.localeCompare(a.data));
  const numeros = [
    { rotulo: "Reservas hoje", valor: reservasHoje },
    { rotulo: "Ocupação (próximos 7 dias)", valor: `${ocupacao}%` },
    { rotulo: "Alunos em atraso", valor: emAtraso, alerta: emAtraso > 0 },
    { rotulo: "Receita do mês", valor: moeda(receita) },
  ];

  return html`<div className="pagina-admin">
    <h1>Resumo</h1>
    <div className="numeros-grade">
      ${numeros.map((n) => html`<${Cartao} key=${n.rotulo} className="numero">
        <p className="numero__rotulo">${n.rotulo}</p>
        <p className=${`numero__valor numeros ${n.alerta ? "numero__valor--alerta" : ""}`}>${n.valor}</p>
      <//>`)}
    </div>

    <h2>Aulas de hoje</h2>
    ${aulasHoje.length === 0
      ? html`<p className="suave">Nenhuma aula hoje.</p>`
      : html`<ul className="lista">${aulasHoje.map((o) => {
          const aula = estado.aulas.find((a) => a.id === o.aulaId);
          const prof = estado.profissionais.find((p) => p.id === aula.profissionalId);
          const { confirmadas, espera } = contagem(estado.reservas, aula.id, o.data);
          const passou = inicio(o.data, o.hora) <= agora;
          return html`<li key=${aula.id} className=${`linha-aula ${passou ? "linha-aula--passou" : ""}`}>
            <span className="linha-aula__hora numeros">${aula.hora}</span>
            <span><strong>${aula.nome}</strong><br /><span className="suave">${prof?.nome ?? ""}${espera ? ` · ${espera} na espera` : ""}</span></span>
            <${BarraVagas} ocupadas=${confirmadas} total=${aula.vagas} />
          </li>`;
        })}</ul>`}

    <h2>Pagamentos do mês</h2>
    ${pagamentosDoMes.length === 0
      ? html`<p className="suave">Nenhum pagamento registrado neste mês.</p>`
      : html`<ul className="lista-simples">${pagamentosDoMes.map((p) => html`<li key=${p.id}>
          <span className="numeros">${dataBR(p.data)}</span>
          <span className="pagador">${nomeDoPagador(estado, p)}</span>
          <span className="suave">${estado.planos.find((x) => x.id === p.planoId)?.nome ?? "—"}${p.forma ? ` · ${FORMAS[p.forma] ?? p.forma}` : ""}</span>
          <span className="numeros">${moeda(p.valor)}</span>
        </li>`)}</ul>`}
  </div>`;
}
