// Pagamento.js — Pagar a mensalidade pelo site (SIMULAÇÃO): Pix ou cartão de crédito.
// Nada é cobrado e nenhum dado de cartão é pedido: o botão só registra o pagamento no navegador.
import { html, useState } from "../react.js";
import { Botao } from "../componentes/basicos.js";
import { usarAvisos } from "../componentes/avisos.js";
import { acoes } from "../componentes/usarEstado.js";
import { dataBR, moeda } from "../formato.js";
import { Check } from "../icones.js";

// QR de mentira: três quadrados de canto + pontos sorteados a partir do texto (sempre o mesmo para o mesmo aluno)
function caminhoQr(texto, n = 25) {
  let semente = 0;
  for (const c of texto) semente = (semente * 31 + c.charCodeAt(0)) >>> 0;
  const sortear = () => { semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0; return semente / 4294967296; };
  const cantos = [[0, 0], [n - 7, 0], [0, n - 7]];
  const noCanto = (x, y) => cantos.some(([cx, cy]) => x >= cx - 1 && x <= cx + 7 && y >= cy - 1 && y <= cy + 7);
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!noCanto(x, y) && sortear() > 0.52) d += `M${x} ${y}h1v1h-1z`;
  }
  for (const [cx, cy] of cantos) {
    d += `M${cx} ${cy}h7v7h-7zM${cx + 1} ${cy + 1}v5h5v-5z`; // moldura (furo no meio, regra even-odd)
    d += `M${cx + 2} ${cy + 2}h3v3h-3z`;
  }
  return d;
}

const FORMAS = [
  { id: "pix", titulo: "Pix", detalhe: "Aprovação na hora" },
  { id: "cartao", titulo: "Cartão de crédito", detalhe: "Em 1x, sem juros" },
];

export function PainelPagamento({ aluno, plano, aoPago }) {
  const { avisar } = usarAvisos();
  const [forma, setForma] = useState("pix");
  const [pagando, setPagando] = useState(false);
  const [pago, setPago] = useState(null); // novo vencimento
  const codigo = `00020126DEMO-VOLT-${aluno.matricula}-${plano.valor.toFixed(2).replace(".", "")}`;

  async function pagar() {
    setPagando(true);
    let r;
    try {
      r = await acoes.registrarPagamento(aluno.id, forma);
    } catch {
      r = { ok: false, motivo: "Algo deu errado. Tente de novo." };
    } finally {
      setPagando(false);
    }
    if (!r.ok) return avisar(r.motivo, "erro");
    setPago(r.vencimento);
    avisar(`Pagamento confirmado! Mensalidade em dia até ${dataBR(r.vencimento)}.`);
    aoPago?.(r.vencimento);
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(codigo); avisar("Código copiado (é só de demonstração)."); }
    catch { avisar("Não deu para copiar. Selecione o código e copie.", "erro"); }
  }

  if (pago) {
    return html`<div className="pagamento pagamento--pago" role="status">
      <p className="pagamento__ok"><${Check} /> Pagamento confirmado</p>
      <p className="suave">Mensalidade em dia até <span className="numeros">${dataBR(pago)}</span>. Você já pode reservar suas aulas.</p>
    </div>`;
  }

  return html`<div className="pagamento">
    <h2>Pague a mensalidade</h2>
    <p className="pagamento__valor"><span className="numeros">${moeda(plano.valor)}</span> <span className="suave">· plano ${plano.nome}</span></p>
    <div className="opcoes" role="group" aria-label="Forma de pagamento">
      ${FORMAS.map((f) => html`<button key=${f.id} type="button" className="opcao" aria-pressed=${forma === f.id} onClick=${() => setForma(f.id)}>
        <strong>${f.titulo}</strong><span className="suave">${f.detalhe}</span>
      </button>`)}
    </div>

    ${forma === "pix"
      ? html`<div className="pix">
          <svg className="qr" viewBox="-1 -1 27 27" role="img" aria-label="QR Code de demonstração" shapeRendering="crispEdges">
            <rect x="-1" y="-1" width="27" height="27" fill="#fff" />
            <path d=${caminhoQr(codigo)} fill="#0a0f18" fillRule="evenodd" />
          </svg>
          <div className="pix__texto">
            <p className="suave">Pix copia e cola</p>
            <code className="codigo">${codigo}</code>
            <${Botao} variante="secundario" className="botao--pequeno" onClick=${copiar}>Copiar código<//>
          </div>
        </div>`
      : html`<p className="suave">Nesta demonstração nenhum dado de cartão é pedido.</p>`}

    <p className="nota-demo">Simulação: nenhum valor é cobrado de verdade.</p>
    <${Botao} className="botao--largo" carregando=${pagando} onClick=${pagar}>
      ${forma === "pix" ? "Já fiz o Pix (simular)" : "Pagar com cartão (simular)"}
    <//>
    <p className="suave pagamento__recepcao">Se preferir, pague na recepção.</p>
  </div>`;
}
