// Individual.js (painel) — Atendimento individual: profissionais, serviços e os horários em que cada um atende.
import { html, useState } from "../react.js";
import { Botao } from "../componentes/basicos.js";
import { confirmar } from "../componentes/modal.js";
import { usarAvisos } from "../componentes/avisos.js";
import { acoes } from "../componentes/usarEstado.js";
import { Mais } from "../icones.js";
import { NOMES_DIAS } from "../descricao.js";
import { Editor } from "./Editor.js";

export function Individual({ estado }) {
  const { avisar } = usarAvisos();
  const [editando, setEditando] = useState(null); // { tipo: "profissional"|"servico"|"disponibilidade", valores }

  const opcoesProf = estado.profissionais.map((p) => ({ valor: p.id, texto: p.nome }));
  const opcoesServ = estado.servicos.map((s) => ({ valor: s.id, texto: s.nome }));
  const dias = NOMES_DIAS.map((n, i) => ({ valor: i, texto: n }));

  const tipos = {
    profissional: {
      novo: "Novo profissional", editar: "Editar profissional", salvar: acoes.salvarProfissional, excluir: acoes.excluirProfissional,
      campos: [{ nome: "nome", rotulo: "Nome" }, { nome: "especialidade", rotulo: "Especialidade" }],
    },
    servico: {
      novo: "Novo serviço", editar: "Editar serviço", salvar: acoes.salvarServico, excluir: acoes.excluirServico,
      campos: [{ nome: "nome", rotulo: "Nome do serviço" }, { nome: "duracao", rotulo: "Duração (minutos)", tipo: "number", min: 1, inputMode: "numeric" }],
    },
    disponibilidade: {
      novo: "Novo horário de atendimento", editar: "Editar horário de atendimento", salvar: acoes.salvarDisponibilidade,
      excluir: acoes.excluirDisponibilidade,
      campos: [
        { nome: "profissionalId", rotulo: "Profissional", opcoes: opcoesProf },
        { nome: "servicoId", rotulo: "Serviço", opcoes: opcoesServ },
        { nome: "diaSemana", rotulo: "Dia da semana", opcoes: dias },
        { nome: "inicio", rotulo: "Início", tipo: "time" },
        { nome: "fim", rotulo: "Fim", tipo: "time" },
      ],
    },
  };
  const atual = editando ? tipos[editando.tipo] : null;

  async function salvar(valores) {
    const r = await atual.salvar(valores);
    if (r.ok) avisar("Salvo.");
    return r;
  }

  async function excluir() {
    const quer = await confirmar({ titulo: "Excluir?", botao: "Excluir", texto: "Esta ação não pode ser desfeita (só restaurando os dados de demonstração)." });
    if (!quer) return undefined;
    const r = await atual.excluir(editando.valores.id);
    if (r.ok) avisar("Excluído.");
    return r;
  }

  const abrir = (tipo, valores) => setEditando({ tipo, valores });
  const nomeProf = (id) => estado.profissionais.find((p) => p.id === id)?.nome ?? "—";
  const nomeServ = (id) => estado.servicos.find((s) => s.id === id)?.nome ?? "—";
  const disp = [...estado.disponibilidade].sort((a, b) =>
    nomeProf(a.profissionalId).localeCompare(nomeProf(b.profissionalId)) || ((a.diaSemana + 6) % 7) - ((b.diaSemana + 6) % 7));

  return html`<div className="pagina-admin">
    <h1>Atendimento individual</h1>

    <section className="grupo">
      <div className="titulo-linha"><h2>Profissionais</h2>
        <${Botao} variante="secundario" onClick=${() => abrir("profissional", { nome: "", especialidade: "" })}><${Mais} /> Novo<//></div>
      <ul className="lista">${estado.profissionais.map((p) => html`<li key=${p.id}>
        <button type="button" className="linha-edicao" onClick=${() => abrir("profissional", p)}>
          <span className="linha-edicao__nome">${p.nome}</span><span className="suave">${p.especialidade}</span>
        </button></li>`)}</ul>
    </section>

    <section className="grupo">
      <div className="titulo-linha"><h2>Serviços</h2>
        <${Botao} variante="secundario" onClick=${() => abrir("servico", { nome: "", duracao: 60 })}><${Mais} /> Novo<//></div>
      <ul className="lista">${estado.servicos.map((s) => html`<li key=${s.id}>
        <button type="button" className="linha-edicao" onClick=${() => abrir("servico", s)}>
          <span className="linha-edicao__nome">${s.nome}</span><span className="suave numeros">${s.duracao} min</span>
        </button></li>`)}</ul>
    </section>

    <section className="grupo">
      <div className="titulo-linha"><h2>Quando cada um atende</h2>
        <${Botao} variante="secundario" onClick=${() => abrir("disponibilidade", { profissionalId: estado.profissionais[0]?.id, servicoId: estado.servicos[0]?.id, diaSemana: 1, inicio: "08:00", fim: "12:00" })}><${Mais} /> Novo<//></div>
      ${disp.length === 0 ? html`<p className="suave">Nenhum horário cadastrado. Sem isso, o aluno não consegue reservar atendimento individual.</p>` : null}
      <ul className="lista">${disp.map((d) => html`<li key=${d.id}>
        <button type="button" className="linha-edicao" onClick=${() => abrir("disponibilidade", d)}>
          <span className="linha-edicao__nome">${nomeProf(d.profissionalId)} · ${nomeServ(d.servicoId)}</span>
          <span className="suave numeros">${NOMES_DIAS[d.diaSemana]} · ${d.inicio} às ${d.fim}</span>
        </button></li>`)}</ul>
    </section>

    ${editando ? html`<${Editor} key=${editando.valores.id ?? "novo"} titulo=${editando.valores.id ? atual.editar : atual.novo} campos=${atual.campos}
      valores=${editando.valores} aoSalvar=${salvar} aoExcluir=${editando.valores.id ? excluir : undefined} aoFechar=${() => setEditando(null)} />` : null}
  </div>`;
}
