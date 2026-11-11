// Inicio.js — Resumo do aluno: mensalidade, cartão de energia e próxima reserva.
import { html } from "../react.js";
import { Botao, Cartao, Status } from "../componentes/basicos.js";
import { Raio, Alerta } from "../icones.js";
import { dataBR } from "../formato.js";
import { dataISO } from "../formato.js";
import { MENSAGENS, statusMensalidade, resumoEnergia } from "../regras.js";
import { descreverReserva, primeiroNome, proximasReservas, rotuloDia } from "../descricao.js";

export function Inicio({ estado, aluno }) {
  const agora = new Date();
  const status = statusMensalidade(aluno.vencimento, dataISO(agora));
  const plano = estado.planos.find((p) => p.id === aluno.planoId);
  const { treinosNoMes, semanasSeguidas } = resumoEnergia(estado.reservas, aluno.id, agora);
  const proxima = proximasReservas(estado, aluno.id, agora)[0];
  const aulasLigadas = estado.config.aulasLigadas;

  return html`<div className="pagina">
    <h1>Olá, ${primeiroNome(aluno.nome)}</h1>

    ${status === "em-atraso" ? html`<p className="faixa faixa--erro" role="alert"><${Alerta} /> ${MENSAGENS.atraso} <a href="#/mensalidade">Pagar agora</a></p>` : null}

    <div className="grade-cartoes">
      <${Cartao} className="cartao--mensalidade">
        <h2 className="cartao__titulo">Mensalidade</h2>
        <p><${Status} status=${status} /></p>
        <p className="suave">Plano ${plano?.nome ?? "—"} · vence em <span className="numeros">${dataBR(aluno.vencimento)}</span></p>
        <a className="link-seta" href="#/mensalidade">Ver detalhes</a>
      <//>

      <${Cartao} className="cartao--energia">
        <h2 className="cartao__titulo"><${Raio} /> Sua energia</h2>
        ${treinosNoMes > 0
          ? html`<p className="energia__numero numeros">${treinosNoMes} ${treinosNoMes === 1 ? "treino" : "treinos"} este mês</p>
                 <p className="suave">${semanasSeguidas} ${semanasSeguidas === 1 ? "semana seguida" : "semanas seguidas"} treinando</p>`
          : html`<p className="energia__numero">Sua primeira carga de energia começa hoje</p>
                 ${aulasLigadas ? html`<a className="link-seta" href="#/aulas">Reservar uma aula</a>` : null}`}
      <//>

      <${Cartao} className="cartao--proxima">
        <h2 className="cartao__titulo">Próxima reserva</h2>
        ${proxima
          ? (() => {
              const { titulo, detalhe } = descreverReserva(proxima, estado);
              return html`<p className="proxima__titulo">${titulo}</p>
                <p className="suave numeros">${rotuloDia(proxima.data)} às ${proxima.hora}${detalhe ? ` · ${detalhe}` : ""}</p>
                ${proxima.situacao === "espera" ? html`<p className="suave">Você está na lista de espera.</p>` : null}`;
            })()
          : html`<p className="suave">Nenhuma reserva marcada.</p>`}
      <//>
    </div>

    ${aulasLigadas ? html`<${Botao} className="botao--largo" onClick=${() => { location.hash = "#/aulas"; }}>Reservar<//>` : null}
  </div>`;
}
