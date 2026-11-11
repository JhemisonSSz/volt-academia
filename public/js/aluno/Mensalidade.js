// Mensalidade.js — Plano, valor, vencimento e histórico de pagamentos do aluno.
import { html } from "../react.js";
import { Cartao, Status } from "../componentes/basicos.js";
import { dataBR, dataISO, moeda } from "../formato.js";
import { statusMensalidade } from "../regras.js";
import { PainelPagamento } from "./Pagamento.js";

export function Mensalidade({ estado, aluno }) {
  const plano = estado.planos.find((p) => p.id === aluno.planoId);
  const status = statusMensalidade(aluno.vencimento, dataISO(new Date()));
  const pagamentos = estado.pagamentos
    .filter((p) => p.alunoId === aluno.id)
    .sort((a, b) => b.data.localeCompare(a.data));

  return html`<div className="pagina">
    <h1>Mensalidade</h1>
    <${Cartao}>
      <p><${Status} status=${status} /></p>
      <dl className="dados">
        <div><dt>Plano</dt><dd>${plano?.nome ?? "—"}</dd></div>
        <div><dt>Valor</dt><dd className="numeros">${plano ? moeda(plano.valor) : "—"}</dd></div>
        <div><dt>Vencimento</dt><dd className="numeros">${dataBR(aluno.vencimento)}</dd></div>
      </dl>
      <p className="suave">Para trocar de plano, fale com a recepção.</p>
    <//>
    ${status !== "em-dia" && plano ? html`<div className="cartao--espaco"><${PainelPagamento} aluno=${aluno} plano=${plano} /></div>` : null}

    <h2>Histórico de pagamentos</h2>
    ${pagamentos.length === 0
      ? html`<p className="suave">Nenhum pagamento registrado ainda.</p>`
      : html`<div className="tabela-rolagem"><table className="tabela">
          <thead><tr><th scope="col">Data</th><th scope="col">Plano</th><th scope="col" className="direita">Valor</th></tr></thead>
          <tbody>${pagamentos.map((p) => html`<tr key=${p.id}>
            <td className="numeros">${dataBR(p.data)}</td>
            <td>${estado.planos.find((x) => x.id === p.planoId)?.nome ?? "—"}</td>
            <td className="numeros direita">${moeda(p.valor)}</td>
          </tr>`)}</tbody>
        </table></div>`}
  </div>`;
}
