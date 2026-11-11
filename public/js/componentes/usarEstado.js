// usarEstado.js — Liga o React aos dados: toda vez que algo muda (aqui ou em outra aba), a tela refaz.
import { useState, useEffect } from "../react.js";
import { dados } from "../dados.js";
import { criarAcoes } from "../acoes.js";

export const acoes = criarAcoes(dados);

export function usarEstado() {
  const [estado, setEstado] = useState(dados.ler());
  useEffect(() => dados.ouvir(setEstado), []);
  return estado;
}

// Rota guardada no endereço (#/aulas): o botão "voltar" do navegador funciona e dá para compartilhar o link
export function usarRota(padrao) {
  const ler = () => location.hash.replace(/^#\/?/, "") || padrao;
  const [rota, setRota] = useState(ler());
  useEffect(() => {
    const aoMudar = () => setRota(ler());
    window.addEventListener("hashchange", aoMudar);
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);
  return rota;
}
