// Individual.js — Atendimento individual: serviço, profissional, dia e horário livre.
import { html, useState } from "../react.js";
import { Botao, Cartao } from "../componentes/basicos.js";
import { Modal } from "../componentes/modal.js";
import { usarAvisos } from "../componentes/avisos.js";
import { acoes } from "../componentes/usarEstado.js";
import { dataISO } from "../formato.js";
import { MENSAGENS, horariosLivres, somarDias, statusMensalidade } from "../regras.js";
import { partesDia, rotuloDia } from "../descricao.js";
import { Alerta } from "../icones.js";

export function Individual({ estado, aluno }) {
  const { avisar } = usarAvisos();
  const [servicoId, setServicoId] = useState(estado.servicos[0]?.id);
  const [profEscolhido, setProfEscolhido] = useState(null);
  const [diaEscolhido, setDiaEscolhido] = useState(0);
  const [horaEscolhida, setHoraEscolhida] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (!estado.config.individualLigado) {
    return html`<div className="pagina"><h1>Atendimento individual</h1><p className="suave">${MENSAGENS.desligado}</p></div>`;
  }

  const agora = new Date();
  const hoje = dataISO(agora);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i));
  const data = dias[diaEscolhido];
  const emAtraso = statusMensalidade(aluno.vencimento, hoje) === "em-atraso";

  const servico = estado.servicos.find((s) => s.id === servicoId);
  const profissionais = estado.profissionais.filter((p) =>
    estado.disponibilidade.some((d) => d.servicoId === servicoId && d.profissionalId === p.id));
  const profissionalId = profissionais.some((p) => p.id === profEscolhido) ? profEscolhido : profissionais[0]?.id;
  const profissional = estado.profissionais.find((p) => p.id === profissionalId);
  const livres = profissionalId ? horariosLivres(estado, { profissionalId, servicoId, data }, agora) : [];

  async function confirmar() {
    setEnviando(true);
    const r = await acoes.reservar({ alunoId: aluno.id, tipo: "individual", servicoId, profissionalId, data, hora: horaEscolhida });
    setEnviando(false);
    setHoraEscolhida(null);
    avisar(r.ok ? `Reserva confirmada: ${servico.nome}, ${rotuloDia(data)} às ${horaEscolhida}.` : r.motivo, r.ok ? "ok" : "erro");
  }

  return html`<div className="pagina">
    <h1>Atendimento individual</h1>
    ${emAtraso ? html`<p className="faixa faixa--erro" role="alert"><${Alerta} /> ${MENSAGENS.atraso}</p>` : null}

    <h2 className="passo">1. Serviço</h2>
    <div className="opcoes" role="group" aria-label="Serviço">
      ${estado.servicos.map((s) => html`<button key=${s.id} type="button" className="opcao" aria-pressed=${s.id === servicoId}
        onClick=${() => { setServicoId(s.id); setProfEscolhido(null); }}>
        <strong>${s.nome}</strong><span className="suave">${s.duracao} min</span>
      </button>`)}
    </div>

    <h2 className="passo">2. Profissional</h2>
    <div className="opcoes" role="group" aria-label="Profissional">
      ${profissionais.map((p) => html`<button key=${p.id} type="button" className="opcao" aria-pressed=${p.id === profissionalId}
        onClick=${() => setProfEscolhido(p.id)}>
        <strong>${p.nome}</strong><span className="suave">${p.especialidade}</span>
      </button>`)}
      ${profissionais.length === 0 ? html`<p className="suave">Nenhum profissional atende este serviço.</p>` : null}
    </div>

    <h2 className="passo">3. Dia</h2>
    <div className="dias" role="group" aria-label="Escolha o dia">
      ${dias.map((d, i) => {
        const { semana, numero } = partesDia(d);
        return html`<button key=${d} type="button" className="dias__botao" aria-pressed=${i === diaEscolhido} onClick=${() => setDiaEscolhido(i)}>
          <span>${i === 0 ? "Hoje" : semana}</span><strong className="numeros">${numero}</strong>
        </button>`;
      })}
    </div>

    <h2 className="passo">4. Horário</h2>
    ${livres.length === 0
      ? html`<p className="suave">Nenhum horário livre neste dia.</p>`
      : html`<div className="horarios">
          ${livres.map((h) => html`<${Botao} key=${h} variante="secundario" disabled=${emAtraso} onClick=${() => setHoraEscolhida(h)}>
            <span className="numeros">${h}</span><//>`)}
        </div>`}

    <${Modal} titulo="Confirmar reserva" aberto=${Boolean(horaEscolhida)} aoFechar=${() => setHoraEscolhida(null)}>
      <${Cartao}>
        <p className="proxima__titulo">${servico?.nome}</p>
        <p className="suave numeros">${profissional?.nome} · ${rotuloDia(data)} às ${horaEscolhida}</p>
      <//>
      <div className="modal__acoes">
        <${Botao} variante="fantasma" onClick=${() => setHoraEscolhida(null)}>Voltar<//>
        <${Botao} carregando=${enviando} onClick=${confirmar}>Confirmar<//>
      </div>
    <//>
  </div>`;
}
