// Reservas.js — Minhas reservas: próximas (com cancelar) e anteriores.
import { html, useState } from "../react.js";
import { Botao } from "../componentes/basicos.js";
import { usarAvisos } from "../componentes/avisos.js";
import { avaliarCancelamento, inicio } from "../regras.js";
import { descreverReserva, rotuloDia, ROTULO_SITUACAO } from "../descricao.js";
import { cancelarComConfirmacao } from "./cancelamento.js";

export function Reservas({ estado, aluno }) {
  const { avisar } = usarAvisos();
  const [aba, setAba] = useState("proximas");
  const agora = new Date();

  const minhas = estado.reservas.filter((r) => r.alunoId === aluno.id);
  const futura = (r) => r.situacao !== "cancelada" && inicio(r.data, r.hora) > agora;
  const proximas = minhas.filter(futura).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const anteriores = minhas.filter((r) => !futura(r)).sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora)).slice(0, 30);
  const lista = aba === "proximas" ? proximas : anteriores;

  return html`<div className="pagina">
    <h1>Minhas reservas</h1>
    <div className="abas" role="tablist" aria-label="Reservas">
      ${[["proximas", `Próximas (${proximas.length})`], ["anteriores", "Anteriores"]].map(([id, texto]) => html`<button
        key=${id} type="button" role="tab" id=${`aba-${id}`} aria-selected=${aba === id} aria-controls="painel-reservas" className="abas__botao"
        onClick=${() => setAba(id)}>${texto}</button>`)}
    </div>

    <div id="painel-reservas" role="tabpanel" aria-labelledby=${`aba-${aba}`}>
      ${lista.length === 0
        ? html`<div className="vazio">
            <p className="suave">${aba === "proximas" ? "Nenhuma reserva marcada." : "Você ainda não tem reservas anteriores."}</p>
            ${aba === "proximas" && estado.config.aulasLigadas ? html`<${Botao} onClick=${() => { location.hash = "#/aulas"; }}>Ver aulas<//>` : null}
          </div>`
        : html`<ul className="lista">
            ${lista.map((r) => {
              const { titulo, detalhe } = descreverReserva(r, estado);
              const cancelamento = aba === "proximas" ? avaliarCancelamento(r, agora) : null;
              return html`<li key=${r.id} className="item-reserva">
                <div>
                  <h2>${titulo}</h2>
                  <p className="suave numeros">${rotuloDia(r.data)} às ${r.hora}${detalhe ? ` · ${detalhe}` : ""}</p>
                  <p className=${`chip chip--${r.situacao}`}>${ROTULO_SITUACAO[r.situacao]}</p>
                </div>
                ${cancelamento
                  ? cancelamento.ok
                    ? html`<${Botao} variante="secundario" onClick=${() => cancelarComConfirmacao(r, estado, avisar)}>${r.situacao === "espera" ? "Sair da espera" : "Cancelar"}<//>`
                    : html`<p className="item-aula__motivo">${cancelamento.motivo}</p>`
                  : null}
              </li>`;
            })}
          </ul>`}
    </div>
  </div>`;
}
