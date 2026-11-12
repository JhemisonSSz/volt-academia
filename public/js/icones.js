// icones.js — Ícones em SVG de traço fino (estilo Lucide), feitos à mão.
// Sem rótulo, o ícone é só enfeite e fica escondido de leitores de tela.
import { html } from "./react.js";

const internos = {
  Raio: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  Calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  Relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  Usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  Usuarios: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a6 6 0 0 0-4-5.7"/>',
  Haltere: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',
  Inicio: '<path d="m3 11 9-8 9 8M5 10v10h14V10"/>',
  Lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  Cartao: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  Check: '<path d="M20 6 9 17l-5-5"/>',
  X: '<path d="M18 6 6 18M6 6l12 12"/>',
  Alerta: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  Sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  Menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  Mais: '<path d="M12 5v14M5 12h14"/>',
  Lixeira: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  Lapis: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  Ajustes: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  Grafico: '<path d="M3 3v18h18M7 14l4-4 4 4 5-6"/>',
  Busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  Pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  Telefone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  Mensagem: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  Instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
};

function criar(nome) {
  const interno = internos[nome];
  return function Icone({ tamanho = 20, rotulo }) {
    return html`<svg
      width=${tamanho} height=${tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="icone"
      aria-hidden=${rotulo ? undefined : "true"} role=${rotulo ? "img" : undefined} aria-label=${rotulo}
      focusable="false" dangerouslySetInnerHTML=${{ __html: interno }}
    />`;
  };
}

export const Raio = criar("Raio");
export const Calendario = criar("Calendario");
export const Relogio = criar("Relogio");
export const Usuario = criar("Usuario");
export const Usuarios = criar("Usuarios");
export const Haltere = criar("Haltere");
export const Inicio = criar("Inicio");
export const Lista = criar("Lista");
export const Cartao = criar("Cartao");
export const Check = criar("Check");
export const X = criar("X");
export const Alerta = criar("Alerta");
export const Sair = criar("Sair");
export const Menu = criar("Menu");
export const Mais = criar("Mais");
export const Lixeira = criar("Lixeira");
export const Lapis = criar("Lapis");
export const Ajustes = criar("Ajustes");
export const Grafico = criar("Grafico");
export const Busca = criar("Busca");
export const Pin = criar("Pin");
export const Telefone = criar("Telefone");
export const Mensagem = criar("Mensagem");
export const Instagram = criar("Instagram");
