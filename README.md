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
- **Pede e-mail e senha** (login do Firebase, como nos outros projetos; veja "Acesso ao painel" abaixo). Quem quer conhecer o painel pede o acesso.

## Alunos de demonstração

| Matrícula | Aluno | Situação |
|---|---|---|
| 1001 | Ana | em dia, com treinos no cartão de energia |
| 1002 | Bruno | vence em 3 dias |
| 1003 | Carla | em atraso (não consegue reservar) |

As datas se ajustam sozinhas a "hoje", e os dados de exemplo são refeitos a cada novo dia (o que você mudar vale só até o dia seguinte). Para voltar aos dados de exemplo na hora:
painel → **Configurações** → *Restaurar dados de demonstração*.

## Acesso ao painel

O painel usa o **login do Firebase (e-mail e senha)**, no mesmo padrão dos outros projetos. A senha fica guardada
no Firebase, nunca no projeto. Configuração, uma vez só:

1. **App Web:** console do Firebase → projeto `volt-academia` → ⚙️ Configurações do projeto → *Seus apps* → ícone `</>`
   (Web) → registrar o app. Copie a configuração para `public/js/firebase-config.js` (esses valores não são senha).
2. **Ativar o login:** *Authentication* → Começar → *Método de login* → **E-mail/senha** → ativar.
3. **Criar o administrador:** *Authentication* → *Usuários* → Adicionar usuário, com o e-mail que está em
   `EMAILS_ADMIN` (em `firebase-config.js`, padrão `admin@volt-academia.teste`) e a senha que você escolher.
4. **Fechar o cadastro:** *Authentication* → *Configurações* → *Ações do usuário* → desmarque "Ativar criação (cadastro)",
   para ninguém criar conta por fora. (Mesmo sem isso, só os e-mails de `EMAILS_ADMIN` abrem o painel.)
5. Publique de novo: `firebase deploy --project volt-academia --only hosting`.

Enquanto o `firebase-config.js` estiver com "COLE_AQUI", ninguém entra e a tela avisa que o login não está configurado.

> Os dados do painel (alunos, aulas, reservas) continuam no navegador de cada visitante; o Firebase cuida só do login.

### Sobre o alerta "Possible valid secrets detected" do GitHub

O GitHub pode avisar que há uma "Google API Key" em `public/js/firebase-config.js`. **É um falso positivo.** A `apiKey`
do Firebase Web é um identificador **público** do app: ela precisa estar no código do site e qualquer visitante a vê
no navegador. Quem protege o painel é o login do Firebase (a senha fica lá), e não esta chave. Boa prática: no Google
Cloud (*APIs e serviços → Credenciais → "Browser key"*), restrinja a chave a **Sites (referenciadores HTTP)**:
`https://volt-academia.web.app/*` e `https://volt-academia.firebaseapp.com/*`. No GitHub, feche o alerta como
"False positive". Não é preciso trocar a chave.

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
