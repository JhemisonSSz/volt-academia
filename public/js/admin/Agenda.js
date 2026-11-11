// Agenda.js — Os próximos 7 dias (hoje + 6): aulas e atendimentos individuais.
// Ao clicar num item, aparece quem reservou e dá para cancelar (admin cancela a qualquer hora).
import { html, useState } from "../react.js";
import { Botao, BarraVagas } from "../componentes/basicos.js";
import { Modal, confirmar } from "../componentes/modal.js";
import { usarAvisos } from "../componentes/avisos.js";
import { acoes } from "../componentes/usarEstado.js";
import { dataISO } from "../formato.js";
import { contagem, ocorrencias, somarDias, inicio } from "../regras.js";
import { NOMES_DIAS, ROTULO_SITUACAO, rotuloDia } from "../descricao.js";

export function Agenda({ estado }) {
  const { avisar } = usarAvisos();
  const [aberto, setAberto] = useState(null); // item escolhido: { chave, titulo, data, hora }
  const agora = new Date();
  // Hoje + 6 dias: a mesma janela em que o aluno consegue reservar
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(dataISO(agora), i));

  const nomeAluno = (id) => estado.alunos.find((a) => a.id === id)?.nome ?? "Aluno removido";
  const ativas = estado.reservas.filter((r) => r.situacao !== "cancelada");

  // Tudo que acontece num dia: aulas + atendimentos individuais, por horário
  function itensDoDia(data) {
    const aulas = ocorrencias(estado.aulas, data, 1).map((o) => {
      const aula = estado.aulas.find((a) => a.id === o.aulaId);
      const { confirmadas, espera } = contagem(estado.reservas, aula.id, data);
      return { tipo: "aula", chave: aula.id, data, hora: aula.hora, titulo: aula.nome, confirmadas, espera, vagas: aula.vagas };
    });
    const individuais = ativas.filter((r) => r.tipo === "individual" && r.data === data).map((r) => ({
      tipo: "individual", chave: r.id, data, hora: r.hora,
      titulo: estado.servicos.find((s) => s.id === r.servicoId)?.nome ?? "Atendimento",
      quem: nomeAluno(r.alunoId),
    }));
    return [...aulas, ...individuais].sort((a, b) => a.hora.localeCompare(b.hora));
  }

  // Reservas do item aberto, sempre lidas do estado atual (a lista se atualiza depois de cancelar)
  const participantes = !aberto ? [] : ativas
    .filter((r) => aberto.tipo === "aula" ? r.aulaId === aberto.chave && r.data === aberto.data : r.id === aberto.chave)
    .sort((a, b) => (a.situacao === b.situacao ? String(a.criadaEm).localeCompare(String(b.criadaEm)) : a.situacao === "confirmada" ? -1 : 1));

  async function cancelar(reserva) {
    const quer = await confirmar({
      titulo: "Cancelar reserva?", botao: "Cancelar reserva",
      texto: `${nomeAluno(reserva.alunoId)} · ${aberto.titulo} · ${rotuloDia(reserva.data)} às ${reserva.hora}`,
    });
    if (!quer) return;
    const r = await acoes.cancelar(reserva.id, { admin: true });
    if (!r.ok) return avisar(r.motivo, "erro");
    avisar(r.promovida ? `Reserva cancelada. ${nomeAluno(r.promovida.alunoId)} subiu da lista de espera.` : "Reserva cancelada.");
  }

  return html`<div className="pagina-admin">
    <h1>Agenda dos próximos 7 dias</h1>
    <div className="semana">
      ${dias.map((data) => {
        const itens = itensDoDia(data);
        const ehHoje = data === dataISO(agora);
        return html`<section key=${data} className=${`semana__dia ${ehHoje ? "semana__dia--hoje" : ""}`} aria-label=${NOMES_DIAS[new Date(data + "T00:00").getDay()]}>
          <h2>${rotuloDia(data)}${ehHoje ? html` <span className="chip">Hoje</span>` : null}</h2>
          ${itens.length === 0 ? html`<p className="suave">Sem atividades.</p>` : html`<ul className="lista-simples lista-simples--cartoes">
            ${itens.map((i) => html`<li key=${i.tipo + i.chave + i.data}>
              <button type="button" className=${`item-agenda ${inicio(i.data, i.hora) <= agora ? "item-agenda--passou" : ""}`} onClick=${() => setAberto(i)}>
                <span className="numeros item-agenda__hora">${i.hora}</span>
                <span className="item-agenda__titulo">${i.titulo}</span>
                ${i.tipo === "aula"
                  ? html`<${BarraVagas} ocupadas=${i.confirmadas} total=${i.vagas} />${i.espera ? html`<span className="suave numeros">+${i.espera} na espera</span>` : null}`
                  : html`<span className="suave">${i.quem}</span>`}
              </button>
            </li>`)}
          </ul>`}
        </section>`;
      })}
    </div>

    <${Modal} titulo=${aberto ? `${aberto.titulo} · ${rotuloDia(aberto.data)} às ${aberto.hora}` : ""} aberto=${Boolean(aberto)} aoFechar=${() => setAberto(null)}>
      ${participantes.length === 0
        ? html`<p className="suave">Ninguém reservou este horário.</p>`
        : html`<ul className="lista-simples">
            ${participantes.map((r) => html`<li key=${r.id} className="participante">
              <span>${nomeAluno(r.alunoId)}</span>
              <span className=${`chip chip--${r.situacao}`}>${ROTULO_SITUACAO[r.situacao]}</span>
              <${Botao} variante="secundario" className="botao--pequeno" onClick=${() => cancelar(r)}>Cancelar<//>
            </li>`)}
          </ul>`}
    <//>
  </div>`;
}
