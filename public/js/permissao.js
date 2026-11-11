// permissao.js — Regras do login do painel que não dependem do Firebase (por isso dá para testar com "npm test"):
// quem pode entrar e qual mensagem mostrar para cada erro.

export const MENSAGENS_LOGIN = {
  incorreto: "E-mail ou senha incorretos.",
  semPermissao: "Este usuário não tem acesso ao painel.",
  naoConfigurado: "O login do painel ainda não está configurado.",
  generico: "Não foi possível entrar agora. Tente de novo.",
};

// Só entra no painel quem está na lista de administradores (firebase-config.js)
export function emailPermitido(email, lista) {
  const procurado = String(email ?? "").trim().toLowerCase();
  if (!procurado || !Array.isArray(lista)) return false;
  return lista.some((e) => String(e).trim().toLowerCase() === procurado);
}

// Códigos de erro do Firebase -> frase em português. Usuário inexistente e senha errada dão a MESMA frase,
// para ninguém descobrir quais e-mails existem.
const POR_CODIGO = {
  "auth/invalid-credential": MENSAGENS_LOGIN.incorreto,
  "auth/invalid-login-credentials": MENSAGENS_LOGIN.incorreto,
  "auth/wrong-password": MENSAGENS_LOGIN.incorreto,
  "auth/user-not-found": MENSAGENS_LOGIN.incorreto,
  "auth/invalid-email": "Digite um e-mail válido.",
  "auth/missing-password": "Digite a senha.",
  "auth/too-many-requests": "Muitas tentativas. Espere alguns minutos e tente de novo.",
  "auth/network-request-failed": "Sem conexão com o Firebase. Confira a internet e tente de novo.",
  "auth/user-disabled": "Este usuário está desativado.",
};

export const mensagemDeErro = (codigo) => POR_CODIGO[codigo] ?? MENSAGENS_LOGIN.generico;
