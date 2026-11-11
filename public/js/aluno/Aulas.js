// Aulas.js — Aulas coletivas: escolher o dia, ver as vagas e reservar, cancelar ou entrar na lista de espera.
import { html, useState } from "../react.js";
import { Botao, BarraVagas } from "../componentes/basicos.js";
import { usarAvisos } from "../componentes/avisos.js";
import { acoes } from "../componentes/usarEstado.js";
import { dataISO } from "../formato.js";
import { ocorrencias, contagem, avaliarPedido, avaliarCancelamento, somarDias } from "../regras.js";
import { partesDia, rotuloDia } from "../descricao.js";
import { cancelarComConfirmacao } from "./cancelamento.js";

export function Aulas({ estado, aluno }) {
  const { avisar } = usarAvisos();
  const [diaEscolhido, setDiaEscolhido] = useState(0);
  const [ocupadas, setOcupadas] = useState({}); // ids com ação em andamento
  const agora = new Date();
  const hoje = dataISO(agora);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i));
  const data = dias[diaEscolhido];

  if (!estado.config.aulasLigadas) {
    return html`<div className="pagina"><h1>Aulas</h1><p className="suave">${"Este tipo de agendamento está desligado."}</p></div>`;
  }

  const minhas = estado.reservas.filter((r) => r.alunoId === aluno.id && r.situacao !== "cancelada");
  const lista = ocorrencias(estado.aulas, data, 1);

  async function reservar(aulaId) {
    setOcupadas((o) => ({ ...o, [aulaId]: true }));
    let r;
    try {
      r = await acoes.reservar({ alunoId: aluno.id, tipo: "aula", aulaId, data });
    } catch {
      r = { ok: false, motivo: "Algo deu errado. Tente de novo." };
    } finally {
      setOcupadas((o) => ({ ...o, [aulaId]: false }));
    }
    if (!r.ok) return avisar(r.motivo, "erro");
    const aula = estado.aulas.find((a) => a.id === aulaId);
    avisar(r.situacao === "espera"
      ? `Você entrou na lista de espera de ${aula.nome}.`
      : `Reserva confirmada: ${aula.nome}, ${rotuloDia(data)} às ${aula.hora}.`);
  }

  return html`<div className="pagina">
    <h1>Aulas</h1>
    <div className="dias" role="group" aria-label="Escolha o dia">
      ${dias.map((d, i) => {
        const { semana, numero } = partesDia(d);
        return html`<button key=${d} type="button" className="dias__botao" aria-pressed=${i === diaEscolhido} onClick=${() => setDiaEscolhido(i)}>
          <span>${i === 0 ? "Hoje" : semana}</span><strong className="numeros">${numero}</strong>
        </button>`;
      })}
    </div>

    ${lista.length === 0 ? html`<p className="suave">Nenhuma aula neste dia.</p>` : null}
    <ul className="lista">
      ${lista.map((o) => {
        const aula = estado.aulas.find((a) => a.id === o.aulaId);
        const prof = estado.profissionais.find((p) => p.id === aula.profissionalId);
        const { confirmadas, espera } = contagem(estado.reservas, aula.id, data);
        const minha = minhas.find((r) => r.aulaId === aula.id && r.data === data);
        const pedido = { alunoId: aluno.id, tipo: "aula", aulaId: aula.id, data };
        const avaliacao = minha ? null : avaliarPedido(estado, pedido, agora);
        const cancelavel = minha ? avaliarCancelamento(minha, agora) : null;
        const ocupado = Boolean(ocupadas[aula.id]);

        return html`<li key=${aula.id} className="item-aula">
          <div className="item-aula__hora numeros">${aula.hora}</div>
          <div className="item-aula__info">
            <h2>${aula.nome}</h2>
            <p className="suave">${prof?.nome ?? ""} · ${aula.duracao} min</p>
            <${BarraVagas} ocupadas=${confirmadas} total=${aula.vagas} />
            ${espera > 0 ? html`<p className="suave numeros">${espera} na lista de espera</p>` : null}
          </div>
          <div className="item-aula__acao">
            ${minha
              ? html`<p className="chip">${minha.situacao === "espera" ? "Na espera" : "Reservada"}</p>
                  <${Botao} variante="secundario" disabled=${!cancelavel.ok} carregando=${ocupado}
                    onClick=${() => cancelarComConfirmacao(minha, estado, avisar)}>${minha.situacao === "espera" ? "Sair da espera" : "Cancelar"}<//>
                  ${!cancelavel.ok ? html`<p className="item-aula__motivo">${cancelavel.motivo}</p>` : null}`
              : html`<${Botao} disabled=${!avaliacao.ok} carregando=${ocupado} onClick=${() => reservar(aula.id)}>
                    ${avaliacao.ok && avaliacao.situacao === "espera" ? "Entrar na lista de espera" : "Reservar"}<//>
                  ${!avaliacao.ok ? html`<p className="item-aula__motivo">${avaliacao.motivo}</p>` : null}`}
          </div>
        </li>`;
      })}
    </ul>
  </div>`;
}
