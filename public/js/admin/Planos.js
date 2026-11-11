// Planos.js (painel) — Planos de mensalidade: nome, valor e quantos meses cada pagamento cobre.
import { html, useState } from "../react.js";
import { Botao } from "../componentes/basicos.js";
import { confirmar } from "../componentes/modal.js";
import { usarAvisos } from "../componentes/avisos.js";
import { acoes } from "../componentes/usarEstado.js";
import { Mais } from "../icones.js";
import { lerDinheiro, moeda } from "../formato.js";
import { Editor } from "./Editor.js";

const CAMPOS = [
  { nome: "nome", rotulo: "Nome do plano" },
  { nome: "valor", rotulo: "Valor (R$)", inputMode: "decimal", ajuda: "Ex.: 80,00" },
  { nome: "meses", rotulo: "Cada pagamento cobre quantos meses?", tipo: "number", min: 1, inputMode: "numeric" },
];

export function Planos({ estado }) {
  const { avisar } = usarAvisos();
  const [editando, setEditando] = useState(null);

  async function salvar(valores) {
    const r = await acoes.salvarPlano({ ...valores, valor: lerDinheiro(valores.valor) });
    if (r.ok) avisar("Plano salvo.");
    return r;
  }

  async function excluir(plano) {
    const quer = await confirmar({ titulo: "Excluir plano?", botao: "Excluir plano", texto: `${plano.nome} · ${moeda(plano.valor)}` });
    if (!quer) return undefined;
    const r = await acoes.excluirPlano(plano.id);
    if (r.ok) avisar("Plano excluído.");
    return r;
  }

  const abrir = (plano) => setEditando({ ...plano, valor: String(plano.valor ?? "").replace(".", ",") });

  return html`<div className="pagina-admin">
    <div className="titulo-linha">
      <h1>Planos</h1>
      <${Botao} onClick=${() => abrir({ nome: "", valor: "", meses: 1 })}><${Mais} /> Novo plano<//>
    </div>
    ${estado.planos.length === 0 ? html`<p className="suave">Nenhum plano cadastrado.</p>` : html`<ul className="lista">
      ${estado.planos.map((p) => html`<li key=${p.id}>
        <button type="button" className="linha-edicao linha-edicao--plano" onClick=${() => abrir(p)}>
          <span className="linha-edicao__nome">${p.nome}</span>
          <span className="numeros">${moeda(p.valor)}</span>
          <span className="suave">${p.meses === 1 ? "1 mês" : `${p.meses} meses`} · ${estado.alunos.filter((a) => a.planoId === p.id).length} alunos</span>
        </button>
      </li>`)}
    </ul>`}

    ${editando ? html`<${Editor} key=${editando.id ?? "novo"} titulo=${editando.id ? "Editar plano" : "Novo plano"} campos=${CAMPOS} valores=${editando}
      aoSalvar=${salvar} aoExcluir=${editando.id ? () => excluir(estado.planos.find((p) => p.id === editando.id)) : undefined} aoFechar=${() => setEditando(null)} />` : null}
  </div>`;
}
