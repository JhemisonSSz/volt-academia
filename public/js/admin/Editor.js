// Editor.js — Janela de cadastro reutilizada pelas telas Aulas, Individual e Planos.
// Você descreve os campos e ele cuida do formulário, do erro e dos botões Salvar / Excluir.
import { html, useState } from "../react.js";
import { Botao, Campo } from "../componentes/basicos.js";
import { Modal } from "../componentes/modal.js";
import { Lixeira, Alerta } from "../icones.js";

// campos: [{ nome, rotulo, tipo?, opcoes?, ajuda?, min?, step?, inputMode? }]
// aoSalvar(valores) -> { ok, motivo? }    aoExcluir?() -> { ok, motivo? } | undefined (cancelado)
export function Editor({ titulo, campos, valores, aoSalvar, aoExcluir, aoFechar }) {
  return html`<${Modal} titulo=${titulo} aberto=${true} aoFechar=${aoFechar}>
    <${Formulario} campos=${campos} valores=${valores} aoSalvar=${aoSalvar} aoExcluir=${aoExcluir} aoFechar=${aoFechar} />
  <//>`;
}

function Formulario({ campos, valores, aoSalvar, aoExcluir, aoFechar }) {
  const [form, setForm] = useState(valores);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    const r = await aoSalvar(form);
    setEnviando(false);
    if (!r.ok) return setErro(r.motivo);
    aoFechar();
  }

  async function excluir() {
    const r = await aoExcluir();
    if (!r) return; // o usuário desistiu na confirmação
    if (!r.ok) return setErro(r.motivo);
    aoFechar();
  }

  return html`<form onSubmit=${enviar} noValidate>
    ${erro ? html`<p className="faixa faixa--erro" role="alert"><${Alerta} /> ${erro}</p>` : null}
    ${campos.map((c) => html`<${Campo} key=${c.nome} rotulo=${c.rotulo} tipo=${c.tipo} opcoes=${c.opcoes} ajuda=${c.ajuda}
      min=${c.min} step=${c.step} inputMode=${c.inputMode} autoComplete="off"
      value=${form[c.nome] ?? ""} onChange=${(e) => { setForm({ ...form, [c.nome]: e.target.value }); setErro(""); }} />`)}
    <div className="modal__acoes modal__acoes--espalhar">
      ${aoExcluir ? html`<${Botao} variante="perigo" onClick=${excluir}><${Lixeira} /> Excluir<//>` : html`<span></span>`}
      <${Botao} type="submit" carregando=${enviando}>Salvar<//>
    </div>
  </form>`;
}
