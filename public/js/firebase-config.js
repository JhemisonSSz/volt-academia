// firebase-config.js — Dados do projeto no Firebase usados no login do painel.
// Onde pegar: console do Firebase → ⚙️ Configurações do projeto → Seus apps → app Web → "Configuração".
// Esses valores não são senha: eles ficam visíveis no site. Quem protege o acesso é o Firebase Authentication.
// (O GitHub pode alertar "Google API Key" aqui: é falso positivo, a apiKey do Firebase Web é pública. Veja o README.)
export const firebaseConfig = {
  apiKey: "AIzaSyC6gQxunTZYnnh2w60hLMJUTda-LXlj-iA",
  authDomain: "volt-academia.firebaseapp.com",
  projectId: "volt-academia",
  storageBucket: "volt-academia.firebasestorage.app",
  messagingSenderId: "158466181635",
  appId: "1:158466181635:web:1ef4cec73ac5abf0e65c36"
};

// E-mails que podem entrar no painel (o usuário é criado no console: Authentication → Users → Add user).
// Mesmo que alguém crie uma conta no Firebase por fora, só estes e-mails abrem o painel.
// O domínio ".teste" não existe de propósito: ninguém consegue "recuperar a senha" por e-mail.
export const EMAILS_ADMIN = ["admin@volt-academia.teste"];
