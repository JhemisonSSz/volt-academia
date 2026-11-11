// app.js (painel) — Login (Firebase), menu lateral e a tela da rota atual.
import { html, createRoot, useEffect, useRef, useState } from "../react.js";
import { usarEstado, usarRota } from "../componentes/usarEstado.js";
import { AvisosProvider } from "../componentes/avisos.js";
import { Confirmador } from "../componentes/modal.js";
import { Botao, Campo } from "../componentes/basicos.js";
import { aoMudarLogin, entrar as entrarNoFirebase, sair as sairDoFirebase } from "../auth.js";
import { Raio, Grafico, Usuarios, Calendario, Haltere, Usuario, Cartao, Ajustes, Sair, Menu, X } from "../icones.js";
import { Resumo } from "./Resumo.js";
import { Alunos } from "./Alunos.js";
import { Agenda } from "./Agenda.js";
import { Aulas } from "./Aulas.js";
import { Individual as IndividualAdmin } from "./Individual.js";
import { Planos } from "./Planos.js";
import { Config } from "./Config.js";

const ITENS = [
  { rota: "resumo", texto: "Resumo", Icone: Grafico },
  { rota: "alunos", texto: "Alunos", Icone: Usuarios },
  { rota: "agenda", texto: "Agenda", Icone: Calendario },
  { rota: "aulas", texto: "Aulas", Icone: Haltere },
  { rota: "individual", texto: "Individual", Icone: Usuario },
  { rota: "planos", texto: "Planos", Icone: Cartao },
  { rota: "config", texto: "Configurações", Icone: Ajustes },
];

const NaoExiste = () => html`<div className="pagina-admin"><h1>Página não encontrada</h1><a href="#/resumo">Voltar ao resumo</a></div>`;

function Entrada() {
  const [fotoPronta, setFotoPronta] = useState(false); // a foto aparece suavemente depois de carregar
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [conferindo, setConferindo] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setConferindo(true);
    const resultado = await entrarNoFirebase(email, senha);
    setConferindo(false);
    if (!resultado.ok) { setSenha(""); setErro(resultado.motivo); }
    // Se deu certo, o Firebase avisa (aoMudarLogin) e o painel abre sozinho
  }

  return html`<main id="conteudo" className="entrada">
    <img className=${`entrada__fundo ${fotoPronta ? "entrada__fundo--pronto" : ""}`} ref=${(el) => { if (el?.complete && el.naturalWidth) setFotoPronta(true); }} onLoad=${() => setFotoPronta(true)}
      src="img/entrada-800.jpg" srcSet="img/entrada-800.jpg 800w, img/entrada-1600.jpg 1600w" sizes="100vw" alt="" width="800" height="1200" fetchPriority="high" decoding="async" />
    <div className="entrada__miolo">
      <p className="logo"><span className="logo__raio"><${Raio} tamanho=${28} /></span> VOLT <span className="logo__leve">Academia</span></p>
      <h1 className="entrada__titulo">Painel Volt</h1>
      <p className="entrada__sub">Gerencie alunos, aulas, agenda e mensalidades.</p>
      <form className="entrada__form" onSubmit=${entrar} noValidate>
        <${Campo} rotulo="E-mail" tipo="email" autoComplete="username" autoCapitalize="none" inputMode="email" value=${email}
          onChange=${(e) => { setEmail(e.target.value); setErro(""); }} />
        <${Campo} rotulo="Senha" tipo="password" autoComplete="current-password" value=${senha} erro=${erro}
          onChange=${(e) => { setSenha(e.target.value); setErro(""); }} />
        <${Botao} type="submit" carregando=${conferindo}>Entrar<//>
      </form>
      <p className="entrada__aviso">Painel restrito. Quer ver como ele funciona? Peça o acesso pelo <a href="https://jhemisontech.web.app/" target="_blank" rel="noopener">portfólio JhemisonTech</a>.</p>
      <p className="entrada__rodape">Demonstração: os dados ficam só neste navegador. · <a href="index.html">Ver site do aluno</a></p>
      <p className="entrada__credito">Foto: <a href="https://www.pexels.com/photo/woman-lifting-a-dumbbell-13106577/" target="_blank" rel="noopener">Airam Dato-on, Pexels</a></p>
    </div>
  </main>`;
}

function Aplicacao() {
  const estado = usarEstado();
  const rota = usarRota("resumo");
  const [usuario, setUsuario] = useState(undefined); // undefined = ainda conferindo, null = sem login
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

  // Confere se já há login guardado pelo Firebase (a pessoa não precisa entrar toda vez)
  useEffect(() => aoMudarLogin(setUsuario), []);

  if (usuario === undefined) return html`<main id="conteudo" className="entrada"><p className="suave carregando-login">Carregando…</p></main>`;
  if (!usuario) return html`<${Entrada} />`;

  const sair = () => { sairDoFirebase(); location.hash = ""; };
  const tela = {
    resumo: html`<${Resumo} estado=${estado} />`,
    alunos: html`<${Alunos} estado=${estado} />`,
    agenda: html`<${Agenda} estado=${estado} />`,
    aulas: html`<${Aulas} estado=${estado} />`,
    individual: html`<${IndividualAdmin} estado=${estado} />`,
    planos: html`<${Planos} estado=${estado} />`,
    config: html`<${Config} estado=${estado} />`,
  }[rota] ?? html`<${NaoExiste} />`;

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
