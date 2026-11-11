// Testes do login do painel: o "resumo criptografado" (sha256) e a conferência de usuário e senha.
// Os testes usam uma senha de teste inventada aqui; a senha de verdade nunca fica no projeto, só o resumo dela.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sha256 } from "../public/js/sha256.js";
import { calcularHash, verificarAcesso } from "../public/js/acesso.js";

test("sha256: valores conhecidos (vazio, abc e frase longa)", () => {
  assert.equal(sha256(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  assert.equal(sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(sha256("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"), "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
});

test("sha256: acentos são lidos como UTF-8 e textos de 55 a 65 caracteres (limite do bloco) funcionam", () => {
  assert.equal(sha256("ação").length, 64);
  assert.notEqual(sha256("ação"), sha256("acao"));
  for (const n of [55, 56, 57, 63, 64, 65]) assert.match(sha256("x".repeat(n)), /^[0-9a-f]{64}$/, `tamanho ${n}`);
  // mesmo resultado do módulo crypto do Node
  return import("node:crypto").then(({ createHash }) => {
    for (const t of ["", "abc", "ação", "x".repeat(55), "x".repeat(56), "x".repeat(64), "senha com espaço e símbolos !@#"]) {
      assert.equal(sha256(t), createHash("sha256").update(t, "utf8").digest("hex"), JSON.stringify(t));
    }
  });
});

const sal = "sal-de-teste";
const config = { usuario: "admin", sal, iteracoes: 25, hash: calcularHash("admin", "senha-de-teste-123", sal, 25) };

test("verificarAcesso: usuário e senha certos entram", () => {
  assert.deepEqual(verificarAcesso("admin", "senha-de-teste-123", config), { ok: true });
});

test("verificarAcesso: aceita o usuário com espaços e letras maiúsculas, mas a senha tem que ser exata", () => {
  assert.equal(verificarAcesso("  ADMIN ", "senha-de-teste-123", config).ok, true);
  assert.equal(verificarAcesso("admin", "Senha-de-teste-123", config).ok, false);
  assert.equal(verificarAcesso("admin", "senha-de-teste-123 ", config).ok, false);
});

test("verificarAcesso: usuário ou senha errados voltam a mesma mensagem (não revela qual errou)", () => {
  const a = verificarAcesso("outro", "senha-de-teste-123", config);
  const b = verificarAcesso("admin", "errada", config);
  assert.equal(a.ok, false);
  assert.equal(b.ok, false);
  assert.equal(a.motivo, "Usuário ou senha incorretos.");
  assert.equal(b.motivo, a.motivo);
});

test("verificarAcesso: campos vazios são recusados e sem senha configurada ninguém entra", () => {
  assert.equal(verificarAcesso("", "", config).ok, false);
  assert.equal(verificarAcesso("admin", "", config).ok, false);
  const semSenha = { ...config, hash: "" };
  assert.deepEqual(verificarAcesso("admin", "senha-de-teste-123", semSenha), { ok: false, motivo: "O acesso ao painel ainda não foi configurado." });
});

test("calcularHash: usuário, senha, sal e iterações mudam o resultado", () => {
  const base = calcularHash("admin", "x", "s", 10);
  assert.notEqual(base, calcularHash("admin2", "x", "s", 10));
  assert.notEqual(base, calcularHash("admin", "y", "s", 10));
  assert.notEqual(base, calcularHash("admin", "x", "s2", 10));
  assert.notEqual(base, calcularHash("admin", "x", "s", 11));
  assert.equal(base, calcularHash("admin", "x", "s", 10));
});
