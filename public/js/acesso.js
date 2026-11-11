// acesso.js — Confere usuário e senha do painel.
// ATENÇÃO: o site é só de arquivos estáticos, então isto é uma porta de fachada: barra o acesso casual,
// mas quem ler o código consegue contornar. Não há dado real a proteger (tudo fica no navegador do visitante).
import { sha256 } from "./sha256.js";
import { ACESSO } from "./acesso-config.js";

// Resumo criptografado repetido várias vezes (deixa tentar adivinhar a senha um pouco mais lento)
export function calcularHash(usuario, senha, sal, iteracoes) {
  let resumo = sha256(`${sal}:${String(usuario).trim().toLowerCase()}:${senha}`);
  for (let i = 1; i < iteracoes; i++) resumo = sha256(`${sal}:${resumo}`);
  return resumo;
}

const MENSAGEM_ERRO = "Usuário ou senha incorretos.";

export function verificarAcesso(usuario, senha, config = ACESSO) {
  if (!config.hash) return { ok: false, motivo: "O acesso ao painel ainda não foi configurado." };
  const certo = calcularHash(usuario, String(senha ?? ""), config.sal, config.iteracoes) === config.hash
    && String(usuario ?? "").trim().toLowerCase() === String(config.usuario).toLowerCase();
  return certo ? { ok: true } : { ok: false, motivo: MENSAGEM_ERRO };
}
