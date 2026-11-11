# Como o código funciona

A regra de ouro: **cada arquivo tem um trabalho só**. As telas não sabem onde os dados ficam, e as regras
não sabem que existe uma tela.

```
telas (React)  →  acoes.js  →  regras.js (decide)
                           →  dados.js  (guarda no localStorage)
```

## Pasta `public/js/`

| Arquivo | O que faz |
|---|---|
| `react.js` | Traz React e htm do CDN. O `html` deixa escrever HTML dentro do JS: ``html`<p>${nome}</p>` ``. |
| `formato.js` | Dinheiro (`R$ 80,00`), datas, telefone. Vem de um modelo-base de projetos estáticos, com testes. |
| `regras.js` | **As regras da academia**: status da mensalidade, vagas, lista de espera, conflito de horário, prazo de cancelamento, horários livres, cartão de energia. Só recebe dados e devolve resultado; nunca mexe na tela nem no `localStorage`. É o arquivo mais testado. |
| `semente.js` | Os dados de demonstração (alunos, aulas, reservas). As datas partem de "hoje". |
| `dados.js` | **O único arquivo que mexe no `localStorage`.** Se der erro (aba anônima, dados quebrados), cai nos dados de demonstração. Avisa as telas quando algo muda, inclusive quando a mudança veio de **outra aba**. |
| `acoes.js` | O que as telas pedem: reservar, cancelar, registrar pagamento, excluir. Junta `regras.js` com `dados.js`. Cada ação entra numa fila, então dois cliques seguidos nunca criam reserva duplicada. |
| `descricao.js` | Transforma reservas e datas em texto ("Qui 12/11", "Dança · Júlia Santos"). |
| `icones.js` | Ícones em SVG. |
| `acesso.js`, `acesso-config.js`, `sha256.js` | O login do painel: confere usuário e senha pelo "resumo criptografado" (SHA-256 feito à mão, para funcionar também em endereços http). `acesso-config.js` é gerado pelo comando `npm run senha` (`scripts/definir-senha.mjs`) e guarda só o resumo, nunca a senha. É uma porta de fachada, não segurança de verdade. |
| `componentes/` | Peças pequenas: `basicos.js` (botão, campo, status, barra de vagas), `avisos.js` (mensagens que somem), `modal.js` (janela e "tem certeza?"), `usarEstado.js` (liga o React aos dados e controla a rota). |
| `aluno/` | Telas da área do aluno: `Entrada`, `Inicio`, `Aulas`, `Individual`, `Reservas`, `Mensalidade`, e `app.js` que monta tudo. |
| `admin/` | Telas do painel: `Resumo`, `Alunos`, `Agenda`, `Aulas`, `Individual`, `Planos`, `Config`, `Editor` (janela de cadastro reutilizada) e `app.js`. |

## CSS (`public/css/`)

- `tokens.css`: todas as cores, espaços e tempos. **Mude a cor do site aqui e só aqui.**
- `base.css`: fundo escuro, fontes, foco visível e "reduzir movimento".
- `componentes.css`: botões, campos, cartões, janelas, avisos.
- `aluno.css` e `admin.css`: o que é específico de cada página.

## Como trocar o localStorage por Firebase

Se um cliente de verdade fechar, o caminho é:

1. Crie um projeto Firebase novo (sempre use `--project` nos comandos).
2. Reescreva **só o `dados.js`**, mantendo as mesmas funções: `ler`, `ouvir`, `aplicar`, `salvar`,
   `remover`, `salvarConfig` e `restaurarDemo`. Um `db.js` feito com o Firebase é um bom ponto de partida
   (ele já tem `onSnapshot` para "ouvir" e login por e-mail para o painel).
3. Troque o login de fachada (`acesso.js`) pelo Firebase Authentication (e-mail e senha) e escreva as regras de segurança do Firestore.
4. As telas, as ações e as regras **não mudam**.

Ao ligar o banco de verdade, pense também em: quem pode ler as reservas dos outros alunos
(o aluno só deve ver as dele) e em fazer a reserva dentro de uma transação, para duas pessoas não
pegarem a última vaga ao mesmo tempo.
