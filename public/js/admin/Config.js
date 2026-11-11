// Config.js (painel) — Liga e desliga os tipos de agendamento e restaura os dados de demonstração.
import { html } from "../react.js";
import { Botao, Cartao } from "../componentes/basicos.js";
import { confirmar } from "../componentes/modal.js";
import { usarAvisos } from "../componentes/avisos.js";
import { dados } from "../dados.js";

function Interruptor({ rotulo, descricao, ligado, aoMudar }) {
  return html`<div className="interruptor-linha">
    <div><p className="interruptor-linha__titulo">${rotulo}</p><p className="suave">${descricao}</p></div>
    <button type="button" role="switch" aria-checked=${ligado} aria-label=${rotulo} className="interruptor" onClick=${() => aoMudar(!ligado)}>
      <span className="interruptor__bolinha"></span>
    </button>
  </div>`;
}

export function Config({ estado }) {
  const { avisar } = usarAvisos();
  const { aulasLigadas, individualLigado } = estado.config;

  async function restaurar() {
    const quer = await confirmar({
      titulo: "Restaurar dados de demonstração?", botao: "Restaurar",
      texto: "Alunos, aulas, reservas e pagamentos voltam ao estado inicial. O que você alterou neste navegador será perdido.",
    });
    if (!quer) return;
    await dados.restaurarDemo();
    avisar("Dados de demonstração restaurados.");
  }

  return html`<div className="pagina-admin">
    <h1>Configurações</h1>
    <${Cartao}>
      <h2>Tipos de agendamento</h2>
      <${Interruptor} rotulo="Aulas coletivas" descricao="O aluno reserva vaga em aulas com horário fixo."
        ligado=${aulasLigadas} aoMudar=${(v) => dados.salvarConfig({ aulasLigadas: v })} />
      <${Interruptor} rotulo="Atendimento individual" descricao="O aluno marca personal ou avaliação física."
        ligado=${individualLigado} aoMudar=${(v) => dados.salvarConfig({ individualLigado: v })} />
    <//>
    <${Cartao} className="cartao--espaco">
      <h2>Demonstração</h2>
      <p className="suave">Este site guarda tudo só no seu navegador. Use o botão abaixo para voltar aos dados de exemplo.</p>
      <${Botao} variante="perigo" onClick=${restaurar}>Restaurar dados de demonstração<//>
    <//>
  </div>`;
}
