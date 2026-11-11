// app.js (aluno) — Monta a área do aluno: entrada, cabeçalho, menu e a tela da rota atual.
import { html, createRoot, useEffect, useRef, useState } from "../react.js";
import { usarEstado, usarRota } from "../componentes/usarEstado.js";
import { AvisosProvider } from "../componentes/avisos.js";
import { Confirmador } from "../componentes/modal.js";
import { Botao } from "../componentes/basicos.js";
import { Inicio as IconeInicio, Calendario, Usuario, Lista, Sair, Raio } from "../icones.js";
import { Entrada } from "./Entrada.js";
import { Inicio } from "./Inicio.js";
import { Mensalidade } from "./Mensalidade.js";
import { gravarAlunoId, lerAlunoId, limparAlunoId } from "./sessao.js";

// Telas que entram nas próximas tarefas aparecem como "em breve" até lá
const EmBreve = () => html`<div className="pagina"><p className="suave">Esta tela chega em breve.</p></div>`;

function Aplicacao() {
  const estado = usarEstado();
  const rota = usarRota("inicio");
  const [alunoId, setAlunoId] = useState(lerAlunoId());
  const conteudo = useRef(null);
  const aluno = estado.alunos.find((a) => a.id === alunoId);

  // Ao trocar de tela, o foco vai para o conteúdo (leitor de tela e teclado)
  useEffect(() => { conteudo.current?.focus({ preventScroll: true }); }, [rota]);

  if (!aluno) {
    return html`<${Entrada} aoEntrar=${(a) => { gravarAlunoId(a.id); setAlunoId(a.id); location.hash = "#/inicio"; }} />`;
  }

  const sair = () => { limparAlunoId(); setAlunoId(null); location.hash = ""; };
  const abas = [
    { rota: "inicio", texto: "Início", Icone: IconeInicio, mostrar: true },
    { rota: "aulas", texto: "Aulas", Icone: Calendario, mostrar: estado.config.aulasLigadas },
    { rota: "individual", texto: "Individual", Icone: Usuario, mostrar: estado.config.individualLigado },
    { rota: "reservas", texto: "Reservas", Icone: Lista, mostrar: true },
  ].filter((a) => a.mostrar);

  const tela = {
    inicio: html`<${Inicio} estado=${estado} aluno=${aluno} />`,
    mensalidade: html`<${Mensalidade} estado=${estado} aluno=${aluno} />`,
  }[rota] ?? html`<${EmBreve} />`;

  return html`<div className="app-aluno">
    <header className="topo">
      <a className="logo logo--pequeno" href="#/inicio"><span className="logo__raio"><${Raio} tamanho=${20} /></span> VOLT</a>
      <nav className="menu" aria-label="Principal">
        ${abas.map(({ rota: r, texto, Icone }) => html`<a key=${r} href=${`#/${r}`} className="menu__item" aria-current=${rota === r ? "page" : undefined}>
          <${Icone} /><span>${texto}</span>
        </a>`)}
      </nav>
      <div className="topo__usuario">
        <a className="topo__nome" href="#/mensalidade">${aluno.nome}</a>
        <${Botao} variante="fantasma" onClick=${sair} aria-label="Sair"><${Sair} /><span className="so-desktop">Sair</span><//>
      </div>
    </header>
    <main id="conteudo" tabIndex="-1" ref=${conteudo}>${tela}</main>
  </div>`;
}

createRoot(document.getElementById("app")).render(html`<${AvisosProvider}><${Aplicacao} /><${Confirmador} /><//>`);
