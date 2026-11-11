# Volt Academia

Site de agendamento e painel administrativo para uma **academia fictícia**. É um projeto de portfólio:
tudo funciona direto no navegador, sem servidor e sem banco de dados (os dados ficam no `localStorage`).

> Nome, alunos, professores, telefones e preços são inventados.

## O que tem

**Área do aluno** (`index.html`)
- Entra com a **matrícula** (ou pelos botões de demonstração).
- Reserva **aulas coletivas** (com vagas e lista de espera) e **atendimento individual** (personal e avaliação física).
- Vê as próprias reservas, cancela (até 2 horas antes) e acompanha a **mensalidade**.
- Aluno com mensalidade em atraso **não consegue fazer novas reservas**.
- **Criar matrícula** pela tela de entrada: o aluno novo nasce com a primeira mensalidade pendente e paga pelo site
  (**Pix ou cartão, simulados**: nada é cobrado e nenhum dado de cartão é pedido) ou na recepção, pelo painel.

**Painel** (`admin.html`)
- Resumo do dia, alunos (busca, filtro, ficha, **registro de pagamento**), agenda da semana,
  aulas, atendimento individual, planos e configurações.
- **Pede usuário e senha** (veja "Acesso ao painel" abaixo). Quem quer conhecer o painel pede o acesso.

## Alunos de demonstração

| Matrícula | Aluno | Situação |
|---|---|---|
| 1001 | Ana | em dia, com treinos no cartão de energia |
| 1002 | Bruno | vence em 3 dias |
| 1003 | Carla | em atraso (não consegue reservar) |

As datas se ajustam sozinhas a "hoje", e os dados de exemplo são refeitos a cada novo dia (o que você mudar vale só até o dia seguinte). Para voltar aos dados de exemplo na hora:
painel → **Configurações** → *Restaurar dados de demonstração*.

## Acesso ao painel

O painel pede usuário e senha. A senha **não fica no projeto**: você define uma vez, no seu computador, e só o
"resumo criptografado" dela é gravado em `public/js/acesso-config.js`.

```bash
npm run senha
```

O comando pergunta o usuário (padrão: `admin`) e a senha (mínimo 8 caracteres, não aparece enquanto você digita).
Depois é só publicar de novo. Para trocar a senha, rode o comando outra vez. Enquanto nenhuma senha for definida,
ninguém entra no painel (aparece "O acesso ao painel ainda não foi configurado.").

> **Importante:** como o site é só de arquivos estáticos, esse login é uma *porta de fachada*: barra o acesso casual,
> mas quem ler o código consegue contornar. Não há nenhum dado real a proteger (tudo fica no navegador de cada
> visitante). Para proteção de verdade, o caminho é o Firebase Authentication (veja o COMO-FUNCIONA.md).

## Como rodar

Precisa do **Python** (para servir os arquivos) e do **Node** (só para os testes).

```bash
py servir.py
```

Abra http://localhost:5500 (aluno) e http://localhost:5500/admin.html (painel).
O `servir.py` é igual ao servidor padrão do Python, mas não deixa o navegador guardar arquivos velhos.

## Testes

```bash
npm test
```

Testam as regras (mensalidade, vagas, lista de espera, conflito de horário, prazo de cancelamento,
horários livres), a camada de dados e as ações. Os testes de tela foram feitos à mão no navegador.

## Publicar

É só a pasta `public/` (arquivos estáticos). No Firebase Hosting:

```bash
firebase deploy --project <id-do-projeto> --only hosting
```

Sempre informe o `--project` para não publicar no projeto errado.

## Créditos

- Foto da tela de entrada: [Airam Dato-on](https://www.pexels.com/photo/woman-lifting-a-dumbbell-13106577/), no Pexels
  ([licença do Pexels](https://www.pexels.com/license/): uso livre, inclusive comercial). Duas versões em `public/img/`:
  `entrada-800.jpg` (celular, ~51 KB) e `entrada-1600.jpg` (computador, ~185 KB).
- Fontes: Barlow e Barlow Condensed (Google Fonts, licença OFL).

## Tecnologia

HTML, CSS (variáveis, grid) e **React 18 + htm** carregados do CDN (`esm.sh`) — sem build, sem `npm install`
para rodar o site. Fontes: Barlow Condensed e Barlow (Google Fonts).

Para entender o código, leia o [COMO-FUNCIONA.md](COMO-FUNCIONA.md). O desenho completo está em
[docs/2026-11-11-volt-academia-design.md](docs/2026-11-11-volt-academia-design.md).
