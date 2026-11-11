// auth.js — ÚNICO arquivo do painel que conversa com o Firebase (login por e-mail e senha).
// O resto do painel só chama as funções daqui. O Firebase vem direto do CDN do Google: sem npm e sem build.
// Os dados do painel (alunos, aulas, reservas) continuam no navegador do visitante: o Firebase só cuida do login.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, connectAuthEmulator,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, EMAILS_ADMIN } from "./firebase-config.js";
import { MENSAGENS_LOGIN, emailPermitido, mensagemDeErro } from "./permissao.js";

// Só em localhost (testes): permite apontar para o emulador do Firebase, sem tocar no projeto de verdade.
const teste = ["localhost", "127.0.0.1"].includes(location.hostname) ? globalThis.__VOLT_TESTE__ : null;
const config = teste?.config ?? firebaseConfig;

// Só liga o Firebase se o firebase-config.js estiver preenchido
export const firebaseConfigurado = ["apiKey", "authDomain", "projectId", "appId"]
  .every((campo) => config[campo] && !String(config[campo]).startsWith("COLE"));

const auth = firebaseConfigurado ? getAuth(initializeApp(config)) : null;
if (auth && teste?.emulador) connectAuthEmulator(auth, teste.emulador, { disableWarnings: true });

// Chama aoMudar(usuario) quando alguém entra e aoMudar(null) quando sai (ou se o e-mail não for de administrador).
// O Firebase lembra do login entre visitas, então ao abrir o painel de novo a pessoa já continua dentro.
export function aoMudarLogin(aoMudar) {
  if (!auth) { aoMudar(null); return () => {}; }
  return onAuthStateChanged(auth, (usuario) => {
    if (usuario && !emailPermitido(usuario.email, EMAILS_ADMIN)) { signOut(auth); return aoMudar(null); }
    aoMudar(usuario);
  });
}

// Devolve { ok: true } ou { ok: false, motivo } (nunca lança erro para a tela)
export async function entrar(email, senha) {
  if (!auth) return { ok: false, motivo: MENSAGENS_LOGIN.naoConfigurado };
  try {
    const { user } = await signInWithEmailAndPassword(auth, String(email).trim(), String(senha));
    if (!emailPermitido(user.email, EMAILS_ADMIN)) {
      await signOut(auth);
      return { ok: false, motivo: MENSAGENS_LOGIN.semPermissao };
    }
    return { ok: true };
  } catch (erro) {
    return { ok: false, motivo: mensagemDeErro(erro?.code) };
  }
}

export const sair = () => (auth ? signOut(auth) : Promise.resolve());
