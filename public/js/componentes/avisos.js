// avisos.js — Mensagens curtas ("Reserva confirmada!") que somem sozinhas em 4 segundos.
// A região é "aria-live": o leitor de tela anuncia sem tirar o foco de onde o aluno está.
import { html, useState, useCallback, useContext, createContext, useRef } from "../react.js";
import { Check, Alerta } from "../icones.js";

const Contexto = createContext({ avisar: () => {} });
export const usarAvisos = () => useContext(Contexto);

export function AvisosProvider({ children }) {
  const [lista, setLista] = useState([]);
  const proximo = useRef(1);

  const avisar = useCallback((texto, tipo = "ok") => {
    const id = proximo.current++;
    setLista((atual) => [...atual, { id, texto, tipo }]);
    setTimeout(() => setLista((atual) => atual.filter((a) => a.id !== id)), 4000);
  }, []);

  return html`<${Contexto.Provider} value=${{ avisar }}>
    ${children}
    <div className="avisos" aria-live="polite" aria-atomic="false">
      ${lista.map((a) => html`<p key=${a.id} className=${`aviso aviso--${a.tipo}`}>
        ${a.tipo === "ok" ? html`<${Check} tamanho=${18} />` : html`<${Alerta} tamanho=${18} />`} ${a.texto}
      </p>`)}
    </div>
  <//>`;
}
