// modal.js — Janela por cima da página (usa o <dialog> do navegador: Esc fecha e o foco fica preso dentro)
// e a pergunta "Tem certeza?" (confirmar), que devolve uma Promise: true se o aluno confirmou.
import { html, useEffect, useRef, useState } from "../react.js";
import { Botao } from "./basicos.js";
import { X } from "../icones.js";

export function Modal({ titulo, aberto, aoFechar, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  // Clique no fundo escuro (fora da caixa) também fecha
  const cliqueNoFundo = (e) => { if (e.target === ref.current) aoFechar(); };

  return html`<dialog ref=${ref} className="modal" onClose=${aoFechar} onClick=${cliqueNoFundo} aria-label=${titulo}>
    ${aberto ? html`<div className="modal__caixa">
      <header className="modal__topo">
        <h2>${titulo}</h2>
        <button type="button" className="botao-icone" onClick=${aoFechar} aria-label="Fechar"><${X} /></button>
      </header>
      <div className="modal__corpo">${children}</div>
    </div>` : null}
  </dialog>`;
}

let pedirConfirmacao = null;

// confirmar({ titulo, texto, botao }) -> Promise<boolean>
export function confirmar(opcoes) {
  return new Promise((resolver) => {
    if (!pedirConfirmacao) return resolver(globalThis.confirm?.(opcoes.texto ?? opcoes.titulo) ?? false);
    pedirConfirmacao({ ...opcoes, resolver });
  });
}

// Coloque UMA vez no app, junto com o resto da tela
export function Confirmador() {
  const [pedido, setPedido] = useState(null);
  useEffect(() => {
    pedirConfirmacao = setPedido;
    return () => { pedirConfirmacao = null; };
  }, []);
  const responder = (resposta) => { pedido?.resolver(resposta); setPedido(null); };

  return html`<${Modal} titulo=${pedido?.titulo ?? ""} aberto=${Boolean(pedido)} aoFechar=${() => pedido && responder(false)}>
    <p>${pedido?.texto}</p>
    <div className="modal__acoes">
      <${Botao} variante="fantasma" onClick=${() => responder(false)}>Cancelar<//>
      <${Botao} variante="perigo" onClick=${() => responder(true)}>${pedido?.botao ?? "Confirmar"}<//>
    </div>
  <//>`;
}
