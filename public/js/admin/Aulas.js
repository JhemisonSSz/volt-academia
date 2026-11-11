// Aulas.js (painel) — Aulas coletivas agrupadas por dia da semana: criar, editar e excluir.
import { html, useState } from "../react.js";
import { Botao } from "../componentes/basicos.js";
import { confirmar } from "../componentes/modal.js";
import { usarAvisos } from "../componentes/avisos.js";
import { acoes } from "../componentes/usarEstado.js";
import { Mais } from "../icones.js";
import { NOMES_DIAS } from "../descricao.js";
import { Editor } from "./Editor.js";

const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]; // segunda a domingo

export function Aulas({ estado }) {
  const { avisar } = usarAvisos();
  const [editando, setEditando] = useState(null); // aula, ou {} para nova

  const campos = [
    { nome: "nome", rotulo: "Nome da aula" },
    { nome: "profissionalId", rotulo: "Professor", opcoes: estado.profissionais.map((p) => ({ valor: p.id, texto: p.nome })) },
    { nome: "diaSemana", rotulo: "Dia da semana", opcoes: NOMES_DIAS.map((n, i) => ({ valor: i, texto: n })) },
    { nome: "hora", rotulo: "Horário", tipo: "time" },
    { nome: "duracao", rotulo: "Duração (minutos)", tipo: "number", min: 1, inputMode: "numeric" },
    { nome: "vagas", rotulo: "Vagas", tipo: "number", min: 1, inputMode: "numeric" },
  ];

  async function salvar(valores) {
    const r = await acoes.salvarAula(valores);
    if (r.ok) avisar("Aula salva.");
    return r;
  }

  async function excluir(aula) {
    const futuras = acoes.reservasFuturasDaAula(aula.id);
    const quer = await confirmar({
      titulo: "Excluir aula?", botao: "Excluir aula",
      texto: futuras > 0
        ? `Esta aula tem ${futuras} ${futuras === 1 ? "reserva futura" : "reservas futuras"}. ${futuras === 1 ? "Ela será cancelada" : "Elas serão canceladas"}.`
        : `${aula.nome} · ${NOMES_DIAS[aula.diaSemana]} às ${aula.hora}`,
    });
    if (!quer) return undefined;
    const r = await acoes.excluirAula(aula.id);
    avisar(r.canceladas > 0 ? `Aula excluída. ${r.canceladas} reservas canceladas.` : "Aula excluída.");
    return r;
  }

  return html`<div className="pagina-admin">
    <div className="titulo-linha">
      <h1>Aulas</h1>
      <${Botao} onClick=${() => setEditando({ profissionalId: estado.profissionais[0]?.id, diaSemana: 1, hora: "18:00", duracao: 50, vagas: 15 })}><${Mais} /> Nova aula<//>
    </div>
    ${ORDEM_DIAS.map((dia) => {
      const doDia = estado.aulas.filter((a) => a.diaSemana === dia).sort((a, b) => a.hora.localeCompare(b.hora));
      if (doDia.length === 0) return null;
      return html`<section key=${dia} className="grupo">
        <h2>${NOMES_DIAS[dia]}</h2>
        <ul className="lista">${doDia.map((a) => html`<li key=${a.id}>
          <button type="button" className="linha-edicao linha-edicao--aula" onClick=${() => setEditando(a)}>
            <span className="numeros linha-edicao__hora">${a.hora}</span>
            <span className="linha-edicao__nome">${a.nome}</span>
            <span className="suave">${estado.profissionais.find((p) => p.id === a.profissionalId)?.nome ?? "—"} · ${a.duracao} min · ${a.vagas} vagas</span>
          </button>
        </li>`)}</ul>
      </section>`;
    })}
    ${estado.aulas.length === 0 ? html`<p className="suave">Nenhuma aula cadastrada.</p>` : null}

    ${editando ? html`<${Editor} key=${editando.id ?? "nova"} titulo=${editando.id ? "Editar aula" : "Nova aula"} campos=${campos} valores=${editando}
      aoSalvar=${salvar} aoExcluir=${editando.id ? () => excluir(editando) : undefined} aoFechar=${() => setEditando(null)} />` : null}
  </div>`;
}
