// formato.js — Funções de ajuda que transformam valores em texto e vice-versa:
// dinheiro, datas, telefone, link do WhatsApp e proteção contra HTML.
// Não acessa o banco nem a página, por isso dá para testar com "npm test".

const dois = (n) => String(n).padStart(2, "0");
const soDigitos = (texto) => String(texto ?? "").replace(/\D/g, "");

// 1234.5 -> "R$ 1.234,50" (feito à mão: o Intl coloca um espaço especial depois do R$)
export function moeda(valor) {
  const numero = Number(valor);
  const [inteiro, centavos] = (Number.isFinite(numero) ? numero : 0).toFixed(2).split(".");
  return `R$ ${inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${centavos}`;
}

// "1.234,56" ou "R$ 45,90" ou "10.5" -> número. O que não for número vira 0.
export function lerDinheiro(texto) {
  if (typeof texto === "number") return Number.isFinite(texto) ? texto : 0;
  let limpo = String(texto ?? "").replace(/[^\d,.-]/g, "");
  if (limpo.includes(",")) limpo = limpo.replace(/\./g, "").replace(",", ".");
  const numero = Number.parseFloat(limpo);
  return Number.isFinite(numero) ? numero : 0;
}

// Use SEMPRE que for colocar um texto digitado por alguém dentro de innerHTML
export function escaparHtml(texto) {
  const trocas = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(texto ?? "").replace(/[&<>"']/g, (c) => trocas[c]);
}

// Date -> "AAAA-MM-DD" usando o dia local (não UTC)
export const dataISO = (d) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;

// "2026-11-07" -> Date à meia-noite local
export function paraData(iso) {
  const [a, m, d] = String(iso).split("-").map(Number);
  return new Date(a, m - 1, d);
}

// "2026-11-07" -> "07/11/2026"
export function dataBR(iso) {
  if (!iso) return "";
  const [a, m, d] = String(iso).split("-");
  return `${d}/${m}/${a}`;
}

// DDD (não começa com 0) + número de 8 ou 9 dígitos
export function telefoneValido(texto) {
  const d = soDigitos(texto);
  return (d.length === 10 || d.length === 11) && d[0] !== "0";
}

// "73999990000" -> "(73) 99999-0000"; durante a digitação mascara o que já tem
export function mascararTelefone(texto) {
  const d = soDigitos(texto).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = d.slice(0, 2), resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = resto.length === 9 ? 5 : 4; // celular: 99999-0000; fixo: 9999-0000
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

// Link que abre o WhatsApp no número dado (com 55 e DDD), já com a mensagem escrita
export function linkWhatsApp(numero, mensagem = "") {
  const d = soDigitos(numero);
  if (!d) return "";
  return `https://wa.me/${d}` + (mensagem ? `?text=${encodeURIComponent(mensagem)}` : "");
}

// "Corte & Barba Clássica" -> "corte-barba-classica" (bom para ids e endereços)
export function criarSlug(texto) {
  return String(texto ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
