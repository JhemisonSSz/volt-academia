// Entrada.js — Primeira tela: matrícula e botões de demonstração.
import { html, useState } from "../react.js";
import { Botao, Campo } from "../componentes/basicos.js";
import { acoes, usarEstado } from "../componentes/usarEstado.js";
import { MENSAGENS, valorPorMes, planoMaisEconomico } from "../regras.js";
import { moeda } from "../formato.js";
import { Raio, Pin, Telefone, Mensagem, Instagram, Relogio } from "../icones.js";
import { CONTATO, linkTelefone, linkWhatsApp } from "../contato.js";
import { CriarMatricula } from "./CriarMatricula.js";

const DEMOS = [
  { matricula: "1001", texto: "Ana · em dia" },
  { matricula: "1002", texto: "Bruno · vence em 3 dias" },
  { matricula: "1003", texto: "Carla · em atraso" },
];

export function Entrada({ aoEntrar }) {
  const [matricula, setMatricula] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const estado = usarEstado();
  const [criando, setCriando] = useState(false);
  const planos = [...estado.planos].sort((a, b) => a.meses - b.meses);
  const maisEconomico = planoMaisEconomico(planos);
  const [fotoPronta, setFotoPronta] = useState(false); // a foto aparece suavemente depois de carregar

  async function tentar(valor) {
    setOcupado(true);
    const aluno = await acoes.entrar(valor);
    setOcupado(false);
    if (!aluno) return setErro(MENSAGENS.matricula);
    setErro("");
    aoEntrar(aluno);
  }

  return html`<main id="conteudo" className="entrada">
    <img className=${`entrada__fundo ${fotoPronta ? "entrada__fundo--pronto" : ""}`} ref=${(el) => { if (el?.complete && el.naturalWidth) setFotoPronta(true); }} onLoad=${() => setFotoPronta(true)} src="img/entrada-800.jpg" srcSet="img/entrada-800.jpg 800w, img/entrada-1600.jpg 1600w" sizes="100vw"
      alt="" width="800" height="1200" fetchPriority="high" decoding="async" />
    <div className="entrada__miolo">
      <p className="logo"><span className="logo__raio"><${Raio} tamanho=${28} /></span> VOLT <span className="logo__leve">Academia</span></p>
      <h1 className="entrada__titulo">Carregue sua energia.</h1>
      <p className="entrada__sub">Entre com sua matrícula e reserve sua aula.</p>

      ${criando
        ? html`<${CriarMatricula} aoEntrar=${aoEntrar} aoVoltar=${() => setCriando(false)} />`
        : html`<form className="entrada__form" onSubmit=${(e) => { e.preventDefault(); tentar(matricula); }} noValidate>
            <${Campo}
              rotulo="Matrícula" value=${matricula} inputMode="numeric" autoComplete="off" erro=${erro}
              onChange=${(e) => { setMatricula(e.target.value); setErro(""); }}
            />
            <${Botao} type="submit" carregando=${ocupado}>Entrar<//>
            <${Botao} variante="secundario" onClick=${() => setCriando(true)}>Criar minha matrícula<//>
          </form>`}

      ${criando ? null : html`<div className="entrada__demo">
        <p className="entrada__demo-titulo">Quer só conhecer? Entre como aluno de demonstração:</p>
        <div className="entrada__demo-botoes">
          ${DEMOS.map((d) => html`<${Botao} key=${d.matricula} variante="secundario" onClick=${() => tentar(d.matricula)}>${d.texto}<//>`)}
        </div>
      </div>`}
      ${criando || planos.length === 0 ? null : html`<section className="entrada__planos" aria-labelledby="titulo-planos">
        <h2 id="titulo-planos">Planos</h2>
        <ul className="planos">
          ${planos.map((p) => html`<li key=${p.id} className=${`plano ${p.id === maisEconomico ? "plano--destaque" : ""}`}>
            <span className="plano__nome">${p.nome}</span>
            <span className="plano__preco numeros">${moeda(p.valor)}</span>
            <span className="plano__mes numeros">${p.meses > 1 ? `${moeda(valorPorMes(p))} por mês` : "por mês"}</span>
            ${p.id === maisEconomico ? html`<span className="plano__selo">Menor preço por mês</span>` : null}
          </li>`)}
        </ul>
        <${Botao} variante="secundario" onClick=${() => { setCriando(true); window.scrollTo({ top: 0 }); }}>Quero me matricular<//>
      </section>`}
      <p className="entrada__rodape"><a href="admin.html">Painel da academia</a> · Projeto de demonstração</p>
      <p className="entrada__credito">Foto: <a href="https://www.pexels.com/photo/woman-lifting-a-dumbbell-13106577/" target="_blank" rel="noopener">Airam Dato-on, Pexels</a></p>
    </div>

    <aside className="entrada__contato" aria-label="Contato e endereço">
      <h2>Informações de contato</h2>
      <p className="contato__linha"><${Pin} tamanho=${18} /> <span>${CONTATO.endereco}</span></p>
      <p className="contato__linha"><${Telefone} tamanho=${18} /> <a href=${linkTelefone(CONTATO.telefone)}>${CONTATO.telefone}</a></p>
      <div className="contato__botoes">
        <a className="contato__botao" href=${linkWhatsApp(CONTATO.telefone, "Olá! Vi o site da Volt Academia e quero saber mais.")} target="_blank" rel="noopener"><${Mensagem} tamanho=${16} /> WhatsApp</a>
        <a className="contato__botao" href=${CONTATO.instagram} target="_blank" rel="noopener"><${Instagram} tamanho=${16} /> Instagram</a>
      </div>
      <div className="contato__horarios">
        <p className="contato__linha"><${Relogio} tamanho=${18} /> <strong>Horários</strong></p>
        <ul>${CONTATO.horarios.map((h) => html`<li key=${h.dias}><span>${h.dias}</span> <span className="numeros">${h.horas}</span></li>`)}</ul>
      </div>
    </aside>
  </main>`;
}
