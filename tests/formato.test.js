// Testes das funções de ajuda (public/js/formato.js). Rode com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  moeda, lerDinheiro, escaparHtml, dataISO, paraData, dataBR,
  telefoneValido, mascararTelefone, linkWhatsApp, criarSlug,
} from "../public/js/formato.js";

test("moeda: R$ com vírgula e espaço normal", () => {
  assert.equal(moeda(150), "R$ 150,00");
  assert.equal(moeda(1234.5), "R$ 1.234,50");
  assert.equal(moeda(0), "R$ 0,00");
  assert.equal(moeda("abc"), "R$ 0,00");
});

test("lerDinheiro: aceita o jeito brasileiro de digitar", () => {
  assert.equal(lerDinheiro("1.234,56"), 1234.56);
  assert.equal(lerDinheiro("R$ 45,90"), 45.9);
  assert.equal(lerDinheiro("10"), 10);
  assert.equal(lerDinheiro("10.5"), 10.5);
  assert.equal(lerDinheiro(""), 0);
  assert.equal(lerDinheiro("abc"), 0);
  assert.equal(lerDinheiro(7.5), 7.5);
});

test("escaparHtml: texto digitado não vira HTML", () => {
  assert.equal(escaparHtml(`<b>"Zé" & 'Ana'</b>`), "&lt;b&gt;&quot;Zé&quot; &amp; &#39;Ana&#39;&lt;/b&gt;");
  assert.equal(escaparHtml(null), "");
});

test("datas: ISO local, volta para Date e formato brasileiro", () => {
  assert.equal(dataISO(new Date(2026, 10, 7, 23, 30)), "2026-11-07");
  assert.equal(paraData("2026-11-07").getDate(), 7);
  assert.equal(dataBR("2026-11-07"), "07/11/2026");
  assert.equal(dataBR(""), "");
});

test("telefone: DDD + 8 ou 9 dígitos e máscara", () => {
  for (const t of ["73999990000", "(73) 99999-0000", "73 9999-0000"]) assert.equal(telefoneValido(t), true, t);
  for (const t of ["9999-0000", "(03) 99999-0000", ""]) assert.equal(telefoneValido(t), false, t);
  assert.equal(mascararTelefone("73999990000"), "(73) 99999-0000");
  assert.equal(mascararTelefone("7333330000"), "(73) 3333-0000");
  assert.equal(mascararTelefone("7399"), "(73) 99");
});

test("linkWhatsApp: número só com dígitos e mensagem codificada", () => {
  assert.equal(linkWhatsApp("55 (73) 90000-0000", "Olá, tudo bem?"), "https://wa.me/5573900000000?text=Ol%C3%A1%2C%20tudo%20bem%3F");
  assert.equal(linkWhatsApp("5573900000000"), "https://wa.me/5573900000000");
  assert.equal(linkWhatsApp(""), "");
});

test("criarSlug: sem acento, minúsculo, com hífen", () => {
  assert.equal(criarSlug("  Corte & Barba Clássica "), "corte-barba-classica");
  assert.equal(criarSlug("Ação!!"), "acao");
});
