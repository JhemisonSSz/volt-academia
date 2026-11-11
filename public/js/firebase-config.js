// firebase-config.js — Dados do projeto no Firebase usados no login do painel.
// Onde pegar: console do Firebase → ⚙️ Configurações do projeto → Seus apps → app Web → "Configuração".
// Esses valores não são senha: eles ficam visíveis no site. Quem protege o acesso é o Firebase Authentication.
export const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI",
};

// E-mails que podem entrar no painel (o usuário é criado no console: Authentication → Users → Add user).
// Mesmo que alguém crie uma conta no Firebase por fora, só estes e-mails abrem o painel.
// O domínio ".teste" não existe de propósito: ninguém consegue "recuperar a senha" por e-mail.
export const EMAILS_ADMIN = ["admin@volt-academia.teste"];
