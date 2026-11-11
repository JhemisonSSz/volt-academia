// basicos.js — Peças pequenas que as telas reutilizam: botão, campo, cartão, status e barra de vagas.
import { html, React } from "../react.js";
import { Check, Relogio, Alerta } from "../icones.js";

export function Botao({ variante = "principal", carregando = false, disabled, children, className = "", ...resto }) {
  return html`<button
    type="button" className=${`botao botao--${variante} ${className}`}
    disabled=${disabled || carregando} aria-busy=${carregando || undefined} ...${resto}
  >
    ${carregando ? html`<span className="giro" aria-hidden="true"></span>` : null}${children}
  </button>`;
}

// Campo com rótulo sempre visível; o erro e a ajuda ficam ligados ao campo para o leitor de tela
export function Campo({ rotulo, erro, ajuda, tipo = "text", opcoes, className = "", ...resto }) {
  const id = React.useId();
  const descricao = [erro ? `${id}-erro` : null, ajuda ? `${id}-ajuda` : null].filter(Boolean).join(" ") || undefined;
  const props = { id, "aria-invalid": erro ? "true" : undefined, "aria-describedby": descricao, className: "campo__controle", ...resto };
  const controle = opcoes
    ? html`<select ...${props}>${opcoes.map((o) => html`<option key=${o.valor} value=${o.valor}>${o.texto}</option>`)}</select>`
    : html`<input type=${tipo} ...${props} />`;
  return html`<div className=${`campo ${erro ? "campo--erro" : ""} ${className}`}>
    <label htmlFor=${id}>${rotulo}</label>
    ${controle}
    ${ajuda ? html`<p className="campo__ajuda" id=${`${id}-ajuda`}>${ajuda}</p>` : null}
    ${erro ? html`<p className="campo__erro" id=${`${id}-erro`}><${Alerta} tamanho=${16} /> ${erro}</p>` : null}
  </div>`;
}

export function Cartao({ children, className = "", ...resto }) {
  return html`<section className=${`cartao ${className}`} ...${resto}>${children}</section>`;
}

const STATUS = {
  "em-dia": { texto: "Em dia", Icone: Check, classe: "ok" },
  "vence-em-breve": { texto: "Vence em breve", Icone: Relogio, classe: "aviso" },
  "em-atraso": { texto: "Em atraso", Icone: Alerta, classe: "erro" },
};

// Cor + ícone + texto: nunca só a cor
export function Status({ status }) {
  const { texto, Icone, classe } = STATUS[status] ?? STATUS["em-dia"];
  return html`<span className=${`status status--${classe}`}><${Icone} tamanho=${16} /> ${texto}</span>`;
}

export function BarraVagas({ ocupadas, total }) {
  const cheia = ocupadas >= total;
  const proporcao = total > 0 ? Math.min(1, ocupadas / total) : 0;
  return html`<div className=${`vagas ${cheia ? "vagas--cheia" : ""}`}>
    <span className="vagas__texto numeros">${cheia ? "Lotada" : `${ocupadas} de ${total}`}</span>
    <div className="vagas__barra" role="img" aria-label=${`${ocupadas} de ${total} vagas ocupadas`}>
      <span className="vagas__preenchido" style=${{ transform: `scaleX(${proporcao})` }}></span>
    </div>
  </div>`;
}
