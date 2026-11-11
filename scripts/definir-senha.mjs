// definir-senha.mjs — Define (ou troca) a senha do painel. Rode:  npm run senha
// Pergunta o usuário e a senha no terminal (a senha não aparece enquanto você digita) e grava em
// public/js/acesso-config.js só o "resumo criptografado" dela. A senha em si NUNCA é salva nem mostrada.
import { writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { calcularHash } from "../public/js/acesso.js";

const DESTINO = fileURLToPath(new URL("../public/js/acesso-config.js", import.meta.url));
const ITERACOES = 10000;
const MINIMO = 8;

// Lê uma linha. Em terminal de verdade, esconde o que é digitado (se "oculto"); com entrada redirecionada, lê da fila.
const fila = [];
let leitor = null;
function lerLinhaRedirecionada() {
  leitor ??= createInterface({ input: process.stdin });
  if (!fila.pronto) {
    fila.pronto = new Promise((resolver) => {
      leitor.on("line", (linha) => { const espera = fila.esperas.shift(); espera ? espera(linha) : fila.push(linha); });
      leitor.on("close", () => { fila.fim = true; fila.esperas.splice(0).forEach((e) => e("")); resolver(); });
    });
    fila.esperas = [];
  }
  return new Promise((resolver) => { if (fila.length) resolver(fila.shift()); else if (fila.fim) resolver(""); else fila.esperas.push(resolver); });
}

function perguntar(texto, oculto = false) {
  process.stdout.write(texto);
  if (!process.stdin.isTTY) return lerLinhaRedirecionada().then((l) => { process.stdout.write("\n"); return l; });
  return new Promise((resolver) => {
    let digitado = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    const aoTecla = (tecla) => {
      for (const c of tecla) {
        if (c === "\u0003") { process.stdout.write("\n"); process.exit(130); } // Ctrl+C
        if (c === "\r" || c === "\n") {
          process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off("data", aoTecla);
          process.stdout.write("\n"); return resolver(digitado);
        }
        if (c === "\u007f" || c === "\b") { if (digitado) { digitado = digitado.slice(0, -1); if (!oculto) process.stdout.write("\b \b"); else process.stdout.write("\b \b"); } continue; }
        digitado += c;
        process.stdout.write(oculto ? "*" : c);
      }
    };
    process.stdin.on("data", aoTecla);
  });
}

const usuarioInformado = (await perguntar("Usuário do painel [admin]: ")).trim();
const usuario = usuarioInformado || "admin";
const senha = await perguntar(`Senha (mínimo ${MINIMO} caracteres): `, true);
if (senha.length < MINIMO) { console.error(`\nA senha precisa ter pelo menos ${MINIMO} caracteres. Nada foi alterado.`); process.exit(1); }
const confirmacao = await perguntar("Repita a senha: ", true);
if (confirmacao !== senha) { console.error("\nAs senhas não são iguais. Nada foi alterado."); process.exit(1); }

const sal = randomBytes(16).toString("hex");
const hash = calcularHash(usuario, senha, sal, ITERACOES);
writeFileSync(DESTINO, `// acesso-config.js — Dados do login do painel. ESTE ARQUIVO É GERADO: não edite à mão.
// Para definir (ou trocar) a senha, rode no terminal, dentro da pasta do projeto:  npm run senha
// Aqui fica só o "resumo criptografado" da senha, nunca a senha em si.
export const ACESSO = ${JSON.stringify({ usuario: usuario.toLowerCase(), sal, iteracoes: ITERACOES, hash })};
`);
console.log(`\nPronto! Usuário "${usuario.toLowerCase()}" configurado. A senha não foi salva em lugar nenhum, só o resumo dela.`);
console.log("Agora publique:  git add -A && git commit -m \"Senha do painel\" && git push && firebase deploy --project volt-academia --only hosting");
process.exit(0);
