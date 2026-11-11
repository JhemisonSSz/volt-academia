// Entrada.js — Primeira tela: matrícula e botões de demonstração.
import { html, useState } from "../react.js";
import { Botao, Campo } from "../componentes/basicos.js";
import { acoes } from "../componentes/usarEstado.js";
import { MENSAGENS } from "../regras.js";
import { Raio } from "../icones.js";

const DEMOS = [
  { matricula: "1001", texto: "Ana · em dia" },
  { matricula: "1002", texto: "Bruno · vence em 3 dias" },
  { matricula: "1003", texto: "Carla · em atraso" },
];

export function Entrada({ aoEntrar }) {
  const [matricula, setMatricula] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function tentar(valor) {
    setOcupado(true);
    const aluno = await acoes.entrar(valor);
    setOcupado(false);
    if (!aluno) return setErro(MENSAGENS.matricula);
    setErro("");
    aoEntrar(aluno);
  }

  return html`<main id="conteudo" className="entrada">
    <div className="entrada__miolo">
      <p className="logo"><span className="logo__raio"><${Raio} tamanho=${28} /></span> VOLT <span className="logo__leve">Academia</span></p>
      <h1 className="entrada__titulo">Carregue sua energia.</h1>
      <p className="entrada__sub">Entre com sua matrícula e reserve sua aula.</p>

      <form className="entrada__form" onSubmit=${(e) => { e.preventDefault(); tentar(matricula); }} noValidate>
        <${Campo}
          rotulo="Matrícula" value=${matricula} inputMode="numeric" autoComplete="off" erro=${erro}
          onChange=${(e) => { setMatricula(e.target.value); setErro(""); }}
        />
        <${Botao} type="submit" carregando=${ocupado}>Entrar<//>
      </form>

      <div className="entrada__demo">
        <p className="entrada__demo-titulo">Quer só conhecer? Entre como aluno de demonstração:</p>
        <div className="entrada__demo-botoes">
          ${DEMOS.map((d) => html`<${Botao} key=${d.matricula} variante="secundario" onClick=${() => tentar(d.matricula)}>${d.texto}<//>`)}
        </div>
      </div>
      <p className="entrada__rodape"><a href="admin.html">Painel da academia</a> · Projeto de demonstração</p>
    </div>
  </main>`;
}
