// contato.js — Endereço, telefone e horários da Volt Academia. Tudo FICTÍCIO (a academia é uma demonstração).
// Para mudar algo, é só editar aqui: o bloco da tela de entrada lê estes dados.
import { linkWhatsApp as montarLinkWhatsApp } from "./formato.js";

export const CONTATO = {
  endereco: "Itamaraju – BA",
  telefone: "(73) 90000-0000", // número de exemplo, não existe
  instagram: "https://www.instagram.com/", // sem nome de usuário de propósito (não há perfil real)
  horarios: [
    { dias: "Segunda a sexta", horas: "6h às 22h" },
    { dias: "Sábado", horas: "8h às 14h" },
    { dias: "Domingo", horas: "Fechado" },
  ],
};

// "(73) 90000-0000" -> "5573900000000" (com o 55 do Brasil)
const comPais = (telefone) => `55${String(telefone).replace(/\D/g, "")}`;

export const linkTelefone = (telefone) => `tel:+${comPais(telefone)}`;
export const linkWhatsApp = (telefone, mensagem = "") => montarLinkWhatsApp(comPais(telefone), mensagem);
