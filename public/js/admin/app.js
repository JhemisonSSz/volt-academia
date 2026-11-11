// app.js (painel) — Entrada de demonstração, menu lateral e a tela da rota atual.
import { html, createRoot, useEffect, useRef, useState } from "../react.js";
import { usarEstado, usarRota } from "../componentes/usarEstado.js";
import { AvisosProvider } from "../componentes/avisos.js";
import { Confirmador } from "../componentes/modal.js";
import { Botao } from "../componentes/basicos.js";
import { Raio, Grafico, Usuarios, Calendario, Haltere, Usuario, Cartao, Ajustes, Sair, Menu, X } from "../icones.js";
import { Resumo } from "./Resumo.js";
import { Alunos } from "./Alunos.js";
import { Agenda } from "./Agenda.js";

const CHAVE = "volt-academia:admin";
const lerSessao = () => { try { return sessionStorage.getItem(CHAVE) === "1"; } catch { return false; } };
const gravarSessao = (v) => { try { v ? sessionStorage.setItem(CHAVE, "1") : sessionStorage.removeItem(CHAVE); } catch { /* sem lembrar */ } };

const ITENS = [
  { rota: "resumo", texto: "Resumo", Icone: Grafico },
  { rota: "alunos", texto: "Alunos", Icone: Usuarios },
  { rota: "agenda", texto: "Agenda", Icone: Calendario },
  { rota: "aulas", texto: "Aulas", Icone: Haltere },
  { rota: "individual", texto: "Individual", Icone: Usuario },
  { rota: "planos", texto: "Planos", Icone: Cartao },
  { rota: "config", texto: "Configurações", Icone: Ajustes },
];

// Telas que chegam na próxima tarefa
const EmBreve = () => html`<div className="pagina-admin"><p className="suave">Esta tela chega em breve.</p></div>`;

function Entrada({ aoEntrar }) {
  return html`<main id="conteudo" className="entrada">
    <div className="entrada__miolo">
      <p className="logo"><span className="logo__raio"><${Raio} tamanho=${28} /></span> VOLT <span className="logo__leve">Academia</span></p>
      <h1 className="entrada__titulo">Painel Volt</h1>
      <p className="entrada__sub">Gerencie alunos, aulas, agenda e mensalidades.</p>
      <${Botao} className="botao--largo" onClick=${aoEntrar}>Entrar como admin (demo)<//>
      <p className="entrada__rodape">Demonstração: os dados ficam só neste navegador. · <a href="index.html">Ver site do aluno</a></p>
    </div>
  </main>`;
}

function Aplicacao() {
  const estado = usarEstado();
  const rota = usarRota("resumo");
  const [logado, setLogado] = useState(lerSessao());
  const [menuAberto, setMenuAberto] = useState(false);
  const conteudo = useRef(null);

  useEffect(() => { setMenuAberto(false); conteudo.current?.focus({ preventScroll: true }); }, [rota]);

  // Esc fecha o menu no celular
  useEffect(() => {
    if (!menuAberto) return undefined;
    const aoApertar = (e) => { if (e.key === "Escape") setMenuAberto(false); };
    document.addEventListener("keydown", aoApertar);
    return () => document.removeEventListener("keydown", aoApertar);
  }, [menuAberto]);

  if (!logado) return html`<${Entrada} aoEntrar=${() => { gravarSessao(true); setLogado(true); }} />`;

  const sair = () => { gravarSessao(false); setLogado(false); location.hash = ""; };
  const tela = {
    resumo: html`<${Resumo} estado=${estado} />`,
    alunos: html`<${Alunos} estado=${estado} />`,
    agenda: html`<${Agenda} estado=${estado} />`,
  }[rota] ?? html`<${EmBreve} />`;

  return html`<div className="app-admin">
    <header className="admin-topo">
      <button type="button" className="botao-icone" aria-label=${menuAberto ? "Fechar menu" : "Abrir menu"} aria-expanded=${menuAberto} aria-controls="menu-lateral"
        onClick=${() => setMenuAberto(!menuAberto)}>${menuAberto ? html`<${X} />` : html`<${Menu} />`}</button>
      <p className="logo logo--pequeno"><span className="logo__raio"><${Raio} tamanho=${20} /></span> VOLT <span className="logo__leve">Painel</span></p>
    </header>

    ${menuAberto ? html`<div className="lateral-fundo" onClick=${() => setMenuAberto(false)}></div>` : null}
    <nav id="menu-lateral" className=${`lateral ${menuAberto ? "lateral--aberta" : ""}`} aria-label="Principal">
      <p className="logo lateral__logo"><span className="logo__raio"><${Raio} tamanho=${24} /></span> VOLT <span className="logo__leve">Painel</span></p>
      <ul className="lateral__lista">
        ${ITENS.map(({ rota: r, texto, Icone }) => html`<li key=${r}>
          <a href=${`#/${r}`} className="lateral__item" aria-current=${rota === r ? "page" : undefined}><${Icone} /> ${texto}</a>
        </li>`)}
      </ul>
      <div className="lateral__rodape">
        <a className="lateral__item" href="index.html" target="_blank" rel="noopener">Ver site do aluno</a>
        <${Botao} variante="fantasma" onClick=${sair}><${Sair} /> Sair<//>
      </div>
    </nav>

    <main id="conteudo" tabIndex="-1" ref=${conteudo} className="admin-conteudo">${tela}</main>
  </div>`;
}

createRoot(document.getElementById("app")).render(html`<${AvisosProvider}><${Aplicacao} /><${Confirmador} /><//>`);
