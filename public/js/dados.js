// dados.js — ÚNICO arquivo que mexe no localStorage.
// O resto do site só chama as funções daqui. Se um dia entrar o Firebase,
// é este arquivo que se reescreve (mantendo os mesmos nomes de função).
import { criarSemente } from "./semente.js";
import { dataISO } from "./formato.js";
import { novoId } from "./id.js";

const CHAVE = "volt-academia:v1";
const VERSAO = 1;
const COLECOES = ["planos", "alunos", "pagamentos", "profissionais", "aulas", "servicos", "disponibilidade", "reservas"];

// localStorage se funcionar; senão guarda só na memória (aba anônima, bloqueio de cookies...)
export function armazenamentoSeguro() {
  try {
    const teste = "volt-academia:teste";
    globalThis.localStorage.setItem(teste, "1");
    globalThis.localStorage.removeItem(teste);
    return globalThis.localStorage;
  } catch {
    const memoria = new Map();
    return {
      getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
      setItem: (k, v) => void memoria.set(k, String(v)),
      removeItem: (k) => void memoria.delete(k),
    };
  }
}

export function criarDados({ armazenamento, agora = () => new Date(), janela = globalThis.window } = {}) {
  const ouvintes = new Set();

  // Lê do armazenamento; se estiver vazio, quebrado ou de outra versão, usa a semente
  function carregar() {
    try {
      const bruto = armazenamento.getItem(CHAVE);
      if (bruto) {
        const salvo = JSON.parse(bruto);
        // Dados de demonstração de outro dia são refeitos: as datas (vencimentos, aulas) são relativas a "hoje"
        const completo = salvo && salvo.versao === VERSAO && salvo.config && typeof salvo.config === "object"
          && COLECOES.every((c) => Array.isArray(salvo[c]));
        if (completo && salvo.sementeEm === dataISO(agora())) return salvo;
      }
    } catch {
      // JSON inválido ou acesso bloqueado: cai na semente
    }
    return criarSemente(agora());
  }

  let estado = carregar();

  function gravar() {
    try {
      armazenamento.setItem(CHAVE, JSON.stringify(estado));
    } catch {
      // sem espaço ou bloqueado: o site continua funcionando só na memória
    }
  }

  const avisar = () => ouvintes.forEach((fn) => fn(estado));

  // Mudança feita em OUTRA aba do mesmo navegador
  janela?.addEventListener?.("storage", (evento) => {
    if (evento.key !== CHAVE && evento.key !== null) return;
    estado = carregar();
    avisar();
  });

  const aplicarUma = (base, { colecao, salvar, remover }) => {
    const lista = base[colecao] ?? [];
    if (remover !== undefined) return { ...base, [colecao]: lista.filter((x) => x.id !== remover) };
    const existe = lista.some((x) => x.id === salvar.id);
    return { ...base, [colecao]: existe ? lista.map((x) => (x.id === salvar.id ? salvar : x)) : [...lista, salvar] };
  };

  return {
    ler: () => estado,

    // Chama fn(estado) agora e a cada mudança. Devolve a função que para de ouvir.
    ouvir(fn) {
      ouvintes.add(fn);
      fn(estado);
      return () => ouvintes.delete(fn);
    },

    // Várias mudanças de uma vez: [{ colecao, salvar: registro } | { colecao, remover: id }]
    async aplicar(mudancas) {
      estado = mudancas.reduce(aplicarUma, estado);
      gravar();
      avisar();
    },

    async salvar(colecao, registro) {
      const completo = registro.id ? registro : { ...registro, id: novoId() };
      await this.aplicar([{ colecao, salvar: completo }]);
      return completo;
    },

    async remover(colecao, id) {
      await this.aplicar([{ colecao, remover: id }]);
    },

    async salvarConfig(config) {
      estado = { ...estado, config: { ...estado.config, ...config } };
      gravar();
      avisar();
    },

    async restaurarDemo() {
      estado = criarSemente(agora());
      gravar();
      avisar();
    },
  };
}

// Instância usada pelas telas
export const dados = criarDados({ armazenamento: armazenamentoSeguro() });
