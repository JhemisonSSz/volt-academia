// sessao.js — Lembra qual aluno entrou (só neste navegador). Se o armazenamento estiver bloqueado, só não lembra.
const CHAVE = "volt-academia:aluno";

export function lerAlunoId() {
  try { return localStorage.getItem(CHAVE); } catch { return null; }
}
export function gravarAlunoId(id) {
  try { localStorage.setItem(CHAVE, id); } catch { /* sem lembrar */ }
}
export function limparAlunoId() {
  try { localStorage.removeItem(CHAVE); } catch { /* sem lembrar */ }
}
