// id.js — Gera ids únicos para reservas, pagamentos e cadastros novos.
// O crypto.randomUUID só existe em endereços seguros (https ou localhost). Testando pelo celular em
// http://192.168.x.x ele some, então há alternativas para o site continuar funcionando.
export function criarNovoId(cripto = globalThis.crypto) {
  let contador = 0;
  return function novoId() {
    if (typeof cripto?.randomUUID === "function") return cripto.randomUUID();
    contador++;
    if (typeof cripto?.getRandomValues === "function") {
      const bytes = cripto.getRandomValues(new Uint8Array(12));
      return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("") + contador.toString(16);
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${contador.toString(36)}`;
  };
}

export const novoId = criarNovoId();
