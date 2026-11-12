// Testes dos dados de contato da academia (public/js/contato.js). Tudo é fictício, de exemplo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONTATO, linkTelefone, linkWhatsApp } from "../public/js/contato.js";

test("endereço é só a cidade, sem rua inventada", () => {
  assert.equal(CONTATO.endereco, "Itamaraju – BA");
});

test("telefone de exemplo aparece formatado e vira link de ligação", () => {
  assert.equal(CONTATO.telefone, "(73) 90000-0000");
  assert.equal(linkTelefone(CONTATO.telefone), "tel:+5573900000000");
});

test("WhatsApp abre a conversa com o número de exemplo e uma mensagem pronta", () => {
  assert.equal(linkWhatsApp(CONTATO.telefone, "Olá!"), "https://wa.me/5573900000000?text=Ol%C3%A1!");
  assert.equal(linkWhatsApp(CONTATO.telefone), "https://wa.me/5573900000000");
});

test("Instagram sem nome de usuário (aponta para a página inicial) e sem e-mail", () => {
  assert.equal(CONTATO.instagram, "https://www.instagram.com/");
  assert.ok(!("email" in CONTATO), "o e-mail foi tirado de propósito");
  assert.ok(!JSON.stringify(CONTATO).includes("@"), "nada de @usuario nem e-mail");
});

test("horários de funcionamento", () => {
  assert.deepEqual(CONTATO.horarios, [
    { dias: "Segunda a sexta", horas: "6h às 22h" },
    { dias: "Sábado", horas: "8h às 14h" },
    { dias: "Domingo", horas: "Fechado" },
  ]);
});
