// Testes das regras do login do painel que não dependem do Firebase (public/js/permissao.js):
// quem pode entrar e como cada erro do Firebase vira uma mensagem em português.
import { test } from "node:test";
import assert from "node:assert/strict";
import { emailPermitido, mensagemDeErro, MENSAGENS_LOGIN } from "../public/js/permissao.js";

const LISTA = ["admin@volt-academia.teste"];

test("emailPermitido: só os e-mails da lista entram, sem diferenciar maiúsculas nem espaços", () => {
  assert.equal(emailPermitido("admin@volt-academia.teste", LISTA), true);
  assert.equal(emailPermitido("  Admin@Volt-Academia.TESTE ", LISTA), true);
  assert.equal(emailPermitido("outro@volt-academia.teste", LISTA), false);
  assert.equal(emailPermitido("", LISTA), false);
  assert.equal(emailPermitido(null, LISTA), false);
  assert.equal(emailPermitido(undefined, LISTA), false);
});

test("emailPermitido: lista vazia ou ausente não deixa ninguém entrar", () => {
  assert.equal(emailPermitido("admin@volt-academia.teste", []), false);
  assert.equal(emailPermitido("admin@volt-academia.teste", undefined), false);
});

test("mensagemDeErro: credencial errada, usuário inexistente e senha errada têm a mesma mensagem (não revela qual)", () => {
  const igual = MENSAGENS_LOGIN.incorreto;
  for (const codigo of ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-login-credentials"]) {
    assert.equal(mensagemDeErro(codigo), igual, codigo);
  }
  assert.equal(igual, "E-mail ou senha incorretos.");
});

test("mensagemDeErro: e-mail inválido, muitas tentativas, sem internet e usuário desativado", () => {
  assert.equal(mensagemDeErro("auth/invalid-email"), "Digite um e-mail válido.");
  assert.equal(mensagemDeErro("auth/too-many-requests"), "Muitas tentativas. Espere alguns minutos e tente de novo.");
  assert.equal(mensagemDeErro("auth/network-request-failed"), "Sem conexão com o Firebase. Confira a internet e tente de novo.");
  assert.equal(mensagemDeErro("auth/user-disabled"), "Este usuário está desativado.");
});

test("mensagemDeErro: código desconhecido vira uma mensagem genérica, sem mostrar texto técnico", () => {
  assert.equal(mensagemDeErro("auth/algo-novo-que-ninguem-previu"), "Não foi possível entrar agora. Tente de novo.");
  assert.equal(mensagemDeErro(undefined), "Não foi possível entrar agora. Tente de novo.");
});

test("sem permissão: mensagem própria para quem tem login mas não é do painel", () => {
  assert.equal(MENSAGENS_LOGIN.semPermissao, "Este usuário não tem acesso ao painel.");
  assert.equal(MENSAGENS_LOGIN.naoConfigurado, "O login do painel ainda não está configurado.");
});
