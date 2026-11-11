// Alunos.js — Lista de alunos com busca e filtro, e a ficha (editar, registrar pagamento, excluir).
import { html, useEffect, useState } from "../react.js";
import { Botao, Campo, Status } from "../componentes/basicos.js";
import { Modal, confirmar } from "../componentes/modal.js";
import { usarAvisos } from "../componentes/avisos.js";
import { acoes } from "../componentes/usarEstado.js";
import { dataBR, dataISO, mascararTelefone, moeda } from "../formato.js";
import { novoVencimento, statusMensalidade } from "../regras.js";
import { Busca, Mais, Lixeira, Alerta } from "../icones.js";

const FILTROS = [["todos", "Todos"], ["em-dia", "Em dia"], ["vence-em-breve", "Vence em breve"], ["em-atraso", "Em atraso"]];
const ORDEM_STATUS = { "em-atraso": 0, "vence-em-breve": 1, "em-dia": 2 };

function Ficha({ estado, alunoId, aoFechar }) {
  const { avisar } = usarAvisos();
  const existente = estado.alunos.find((a) => a.id === alunoId);
  const hoje = dataISO(new Date());
  const [form, setForm] = useState(() => existente
    ? { ...existente, whatsapp: mascararTelefone(String(existente.whatsapp).replace(/^55/, "")) }
    : { nome: "", whatsapp: "", matricula: "", planoId: estado.planos[0]?.id, vencimento: hoje });
  const [erro, setErro] = useState("");
  // Depois de "Registrar pagamento" o vencimento muda: o campo acompanha, senão "Salvar" desfaria o pagamento
  useEffect(() => {
    if (existente) setForm((f) => ({ ...f, vencimento: existente.vencimento }));
  }, [existente?.vencimento]);
  const campo = (nome) => ({ value: form[nome] ?? "", onChange: (e) => { setForm({ ...form, [nome]: e.target.value }); setErro(""); } });

  const aluno = existente ?? null;
  const plano = estado.planos.find((p) => p.id === (aluno?.planoId ?? form.planoId));
  const pagamentos = aluno ? estado.pagamentos.filter((p) => p.alunoId === aluno.id).sort((a, b) => b.data.localeCompare(a.data)) : [];

  async function salvar(e) {
    e.preventDefault();
    const r = await acoes.salvarAluno(form);
    if (!r.ok) return setErro(r.motivo);
    avisar(aluno ? "Dados do aluno salvos." : "Aluno cadastrado.");
    aoFechar();
  }

  async function pagar() {
    const novo = novoVencimento(aluno.vencimento, plano.meses, hoje);
    const quer = await confirmar({
      titulo: "Registrar pagamento?", botao: "Registrar",
      texto: `${aluno.nome} · plano ${plano.nome} (${moeda(plano.valor)}). Novo vencimento: ${dataBR(novo)}.`,
    });
    if (!quer) return;
    const r = await acoes.registrarPagamento(aluno.id);
    avisar(r.ok ? `Pagamento registrado. Novo vencimento: ${dataBR(r.vencimento)}.` : r.motivo, r.ok ? "ok" : "erro");
  }

  async function excluir() {
    const quer = await confirmar({
      titulo: "Excluir aluno?", botao: "Excluir aluno",
      texto: `${aluno.nome} e as reservas dele serão apagados. Os pagamentos ficam no histórico como "Aluno removido".`,
    });
    if (!quer) return;
    await acoes.excluirAluno(aluno.id);
    avisar("Aluno excluído.");
    aoFechar();
  }

  return html`<form onSubmit=${salvar} noValidate>
    ${aluno ? html`<p><${Status} status=${statusMensalidade(aluno.vencimento, hoje)} /></p>` : null}
    ${erro ? html`<p className="faixa faixa--erro" role="alert"><${Alerta} /> ${erro}</p>` : null}
    <${Campo} rotulo="Nome" autoComplete="off" ...${campo("nome")} />
    <${Campo} rotulo="WhatsApp" inputMode="tel" autoComplete="off" ajuda="DDD + número"
      value=${form.whatsapp} onChange=${(e) => { setForm({ ...form, whatsapp: mascararTelefone(e.target.value) }); setErro(""); }} />
    <${Campo} rotulo="Matrícula" inputMode="numeric" autoComplete="off" ajuda=${aluno ? undefined : "Deixe em branco para gerar a próxima"} ...${campo("matricula")} />
    <${Campo} rotulo="Plano" opcoes=${estado.planos.map((p) => ({ valor: p.id, texto: `${p.nome} · ${moeda(p.valor)}` }))} ...${campo("planoId")} />
    <${Campo} rotulo="Vencimento" tipo="date" ...${campo("vencimento")} />
    <div className="modal__acoes modal__acoes--espalhar">
      ${aluno ? html`<${Botao} variante="perigo" onClick=${excluir}><${Lixeira} /> Excluir<//>` : html`<span></span>`}
      <${Botao} type="submit">Salvar<//>
    </div>
  </form>
  ${aluno ? html`<section className="ficha-pagamentos">
    <h3>Pagamentos</h3>
    <${Botao} variante="secundario" onClick=${pagar}>Registrar pagamento<//>
    ${pagamentos.length === 0 ? html`<p className="suave">Nenhum pagamento registrado.</p>` : html`<ul className="lista-simples">
      ${pagamentos.map((p) => html`<li key=${p.id}><span className="numeros">${dataBR(p.data)}</span><span>${estado.planos.find((x) => x.id === p.planoId)?.nome ?? "—"}</span><span className="numeros">${moeda(p.valor)}</span></li>`)}
    </ul>`}
  </section>` : null}`;
}

export function Alunos({ estado }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [aberto, setAberto] = useState(null); // id do aluno, "novo" ou null
  const hoje = dataISO(new Date());

  const termo = busca.trim().toLowerCase();
  const lista = estado.alunos
    .map((a) => ({ ...a, status: statusMensalidade(a.vencimento, hoje) }))
    .filter((a) => filtro === "todos" || a.status === filtro)
    .filter((a) => !termo || a.nome.toLowerCase().includes(termo) || String(a.matricula).includes(termo))
    .sort((a, b) => ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] || a.nome.localeCompare(b.nome));

  return html`<div className="pagina-admin">
    <div className="titulo-linha">
      <h1>Alunos</h1>
      <${Botao} onClick=${() => setAberto("novo")}><${Mais} /> Novo aluno<//>
    </div>

    <div className="filtros">
      <label className="busca">
        <span className="so-leitor">Buscar por nome ou matrícula</span>
        <${Busca} />
        <input type="search" placeholder="Buscar por nome ou matrícula" value=${busca} onChange=${(e) => setBusca(e.target.value)} />
      </label>
      <div className="abas" role="group" aria-label="Filtrar por situação">
        ${FILTROS.map(([id, texto]) => html`<button key=${id} type="button" className="abas__botao" aria-pressed=${filtro === id} onClick=${() => setFiltro(id)}>${texto}</button>`)}
      </div>
    </div>

    <p className="suave" aria-live="polite">${lista.length} ${lista.length === 1 ? "aluno" : "alunos"}</p>
    ${lista.length === 0 ? html`<p className="suave">Nenhum aluno encontrado.</p>` : html`<ul className="lista-alunos">
      ${lista.map((a) => html`<li key=${a.id}>
        <button type="button" className="linha-aluno" onClick=${() => setAberto(a.id)}>
          <span className="linha-aluno__matricula numeros">${a.matricula}</span>
          <span className="linha-aluno__nome">${a.nome}</span>
          <span className="suave">${estado.planos.find((p) => p.id === a.planoId)?.nome ?? "—"}</span>
          <span className="suave numeros">Vence ${dataBR(a.vencimento)}</span>
          <${Status} status=${a.status} />
        </button>
      </li>`)}
    </ul>`}

    <${Modal} titulo=${aberto === "novo" ? "Novo aluno" : "Ficha do aluno"} aberto=${aberto !== null} aoFechar=${() => setAberto(null)}>
      ${aberto !== null ? html`<${Ficha} key=${aberto} estado=${estado} alunoId=${aberto === "novo" ? null : aberto} aoFechar=${() => setAberto(null)} />` : null}
    <//>
  </div>`;
}
