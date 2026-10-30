# RedeSocial (Vue + Vite + json-server)

Rede social de vídeos curtos no estilo TikTok, feita com **Vue 3**, **Vite**, **Vue Router** e uma API local com **json-server + json-server-auth** (baseada em [rede_social-mvp](https://github.com/joaotech12/rede_social-mvp)).

## Como rodar

```bash
npm install       # instala o site E o servidor (pasta servidor/)
npm run dev:all   # liga a API (porta 3001) e o site (porta 5173) juntos
```

Depois abra **http://localhost:5173**.

Também dá para ligar cada parte num terminal separado:

```bash
npm run api   # servidor da API em http://localhost:3001
npm run dev   # site em http://localhost:5173
```

### Contas de teste

| E-mail             | Senha    |
| ------------------ | -------- |
| joao@email.com     | 123456   |
| maria@email.com    | 123456   |
| pedro@email.com    | 123456   |
| olivier@mail.com   | 123456   |
| teste@email.com    | teste123 |

## Funcionalidades

- **Feed** em tela cheia com fotos e vídeos: rolar passa para o próximo; vídeos tocam sozinhos
- **Publicar foto ou vídeo**: o usuário escolhe um arquivo do computador/celular, vê a prévia e acompanha o envio
- **Foto de perfil enviada pelo próprio usuário** (sem foto, aparecem as iniciais do nome)
- **Curtir, comentar, compartilhar** (copia o link) e **apagar** as próprias publicações
- **Descobrir**: busca de usuários e publicações
- **Perfil**: seguidores, seguindo, curtidas, seguir/deixar de seguir e editar o próprio perfil
- **Cadastro com e-mail obrigatório** e login com senha criptografada
- **Permissões**: cada pessoa só consegue apagar/editar o que é dela

### Onde ficam as fotos e vídeos

Tudo fica **no nosso servidor**, nada vem de sites externos:

- o **arquivo** (foto/vídeo) é salvo em `servidor/uploads/`;
- o **registro** da publicação (autor, legenda, tipo, endereço do arquivo...) é salvo no `servidor/db.json`.

O servidor recusa publicações e fotos de perfil que apontem para links externos.
Quando uma publicação é apagada (ou a foto de perfil é trocada), o arquivo antigo é apagado também.

| Tipo  | Formatos aceitos         | Tamanho máximo |
| ----- | ------------------------ | -------------- |
| Foto  | JPG, PNG, GIF, WEBP      | 10 MB          |
| Vídeo | MP4, WEBM, MOV, OGG      | 100 MB         |

## Organização das pastas

```
servidor/                 → a API (o "back-end")
  server.js               → liga o servidor, regras de permissão e envio de arquivos
  db.json                 → o "banco de dados" (usuários, publicações, comentários...)
  uploads/                → fotos e vídeos enviados pelos usuários

src/                      → o site (o "front-end")
  main.ts                 → ponto de partida do site
  App.vue                 → moldura: menu lateral + página atual + barra inferior
  paginas/                → uma tela para cada endereço (feed, perfil, login...)
  componentes/            → pedaços reutilizáveis das telas
    comuns/               → peças genéricas (foto de perfil)
    layout/               → menu lateral e barra inferior
    publicacao/           → cartão da publicação (foto/vídeo), botões de ação, grade de miniaturas
    comentarios/          → gaveta de comentários
    perfil/               → cabeçalho do perfil
  servicos/               → conversa com a API (um arquivo por assunto)
  estado/                 → informações compartilhadas (quem está logado)
  rotas/                  → qual página abre em cada endereço
  tipos/                  → formato dos dados (usuário, publicação, comentário...)
  utilitarios/            → pequenas funções de ajuda (formatar números, datas e iniciais)
  estilos/                → cores e aparência geral do site

public/                   → arquivos servidos como estão (ícone do site)
```

> A pasta `public/` mantém o nome em inglês porque o Vite exige esse nome.

## Endereços do site

| Endereço        | Página                                  |
| --------------- | --------------------------------------- |
| `/`             | Feed "Para você"                        |
| `/descobrir`    | Busca / em alta                         |
| `/post/:id`     | Uma publicação só                       |
| `/upload`       | Publicar foto ou vídeo (precisa login)  |
| `/perfil`       | Leva para o seu perfil                  |
| `/@:username`   | Perfil de um usuário                    |
| `/login`        | Entrar / criar conta                    |

## Como a API funciona

| Pedido                   | O que faz                                          |
| ------------------------ | -------------------------------------------------- |
| `POST /register`         | Cria conta (e-mail e senha obrigatórios)           |
| `POST /login`            | Entra e recebe um token (válido por 1 hora)        |
| `POST /upload`           | Envia uma foto ou vídeo (campo `arquivo`, com login) |
| `/posts`, `/comments`, `/likes`, `/follows`, `/users` | Listar, criar, editar e apagar |

Regras de permissão (em `servidor/server.js`): **todo mundo pode ver**, mas **só o dono** pode criar, editar ou apagar as próprias publicações, comentários, curtidas, "seguir" e perfil. Senha e e-mail nunca aparecem nas respostas públicas.

> ⚠️ Projeto para estudo: a chave dos tokens é a padrão do json-server-auth e as fotos/vídeos ficam salvos no próprio computador onde o servidor roda.
