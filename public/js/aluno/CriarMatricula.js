// CriarMatricula.js — O visitante cria a própria matrícula (nome, WhatsApp e plano).
// O aluno nasce com a primeira mensalidade pendente: só reserva depois de pagar, pelo site ou na recepção.
import { html, useState } from "../react.js";
import { Botao, Campo } from "../componentes/basicos.js";
import { usarEstado, acoes } from "../componentes/usarEstado.js";
import { PainelPagamento } from "./Pagamento.js";
import { mascararTelefone, moeda } from "../formato.js";

export function CriarMatricula({ aoEntrar, aoVoltar }) {
  const estado = usarEstado();
  const [form, setForm] = useState({ nome: "", whatsapp: "", planoId: estado.planos[0]?.id ?? "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [criado, setCriado] = useState(null);

  async function criar(e) {
    e.preventDefault();
    setEnviando(true);
    let r;
    try {
      r = await acoes.criarMatricula(form);
    } catch {
      r = { ok: false, motivo: "Algo deu errado. Tente de novo." };
    } finally {
      setEnviando(false);
    }
    if (!r.ok) return setErro(r.motivo);
    setCriado(r.aluno);
  }

  if (criado) {
    const aluno = estado.alunos.find((a) => a.id === criado.id) ?? criado; // reflete o pagamento, se houver
    const plano = estado.planos.find((p) => p.id === aluno.planoId);
    return html`<div className="matricula-criada">
      <p className="suave">Matrícula criada!</p>
      <p className="matricula-numero numeros" aria-label=${`Sua matrícula é ${aluno.matricula}`}>${aluno.matricula}</p>
      <p>Guarde este número: é com ele que você entra.</p>
      <p className="faixa faixa--aviso">Para reservar, pague o valor da mensalidade por aqui ou na recepção.</p>
      ${plano ? html`<${PainelPagamento} aluno=${aluno} plano=${plano} />` : null}
      <${Botao} variante="secundario" className="botao--largo" onClick=${() => aoEntrar(aluno)}>Entrar<//>
    </div>`;
  }

  return html`<form className="entrada__form" onSubmit=${criar} noValidate>
    <h2>Criar minha matrícula</h2>
    ${erro ? html`<p className="faixa faixa--erro" role="alert">${erro}</p>` : null}
    <${Campo} rotulo="Nome" autoComplete="name" value=${form.nome}
      onChange=${(e) => { setForm({ ...form, nome: e.target.value }); setErro(""); }} />
    <${Campo} rotulo="WhatsApp" inputMode="tel" autoComplete="tel" ajuda="DDD + número" value=${form.whatsapp}
      onChange=${(e) => { setForm({ ...form, whatsapp: mascararTelefone(e.target.value) }); setErro(""); }} />
    <${Campo} rotulo="Plano" opcoes=${estado.planos.map((p) => ({ valor: p.id, texto: `${p.nome} · ${moeda(p.valor)}` }))}
      value=${form.planoId} onChange=${(e) => setForm({ ...form, planoId: e.target.value })} />
    <${Botao} type="submit" carregando=${enviando}>Criar matrícula<//>
    <${Botao} variante="fantasma" onClick=${aoVoltar}>Voltar<//>
  </form>`;
}
