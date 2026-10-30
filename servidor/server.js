/*
 * ============================================================
 *  SERVIDOR DA API (o "back-end" da rede social)
 * ============================================================
 * Este arquivo liga um pequeno servidor que guarda TUDO da rede social:
 *
 *  - Os DADOS (usuários, publicações, comentários, curtidas e seguidores)
 *    ficam no arquivo db.json.
 *  - Os ARQUIVOS (fotos e vídeos postados e fotos de perfil)
 *    ficam na pasta uploads/, aqui dentro do próprio servidor.
 *
 * Nada é buscado de sites externos: toda foto e todo vídeo
 * precisa ser enviado pelo usuário para este servidor.
 *
 * Ferramentas usadas:
 *  - json-server: transforma o db.json numa API completa (listar, criar, editar, apagar)
 *  - json-server-auth: adiciona cadastro, login e senhas criptografadas
 *  - multer: recebe os arquivos (fotos e vídeos) enviados pelos usuários
 *  - cors: permite que o site (que roda em outra porta) converse com este servidor
 *
 * Para ligar: npm run api (na pasta principal do projeto)
 */

// ------------------------------------------------------------
// 1. IMPORTAÇÕES (ferramentas que este arquivo usa)
// ------------------------------------------------------------
const path = require("node:path"); // monta caminhos de pastas/arquivos
const fs = require("node:fs"); // lê e apaga arquivos do disco
const crypto = require("node:crypto"); // gera códigos aleatórios para nomes de arquivos
const express = require("express"); // base do servidor web
const jsonServer = require("json-server"); // API automática a partir do db.json
const auth = require("json-server-auth"); // login, cadastro e permissões
const jwt = require("jsonwebtoken"); // confere o "crachá" (token) de login
const multer = require("multer"); // recebe arquivos enviados
const cors = require("cors"); // libera o acesso do site
// Chave secreta que o json-server-auth usa para assinar os tokens de login
const { JWT_SECRET_KEY } = require("json-server-auth/dist/constants");

// ------------------------------------------------------------
// 2. CONFIGURAÇÕES
// ------------------------------------------------------------

// Porta em que o servidor vai rodar (http://localhost:3001)
const port = process.env.PORT || 3001;

// Pasta onde as fotos e vídeos enviados ficam guardados (é criada se não existir)
const PASTA_UPLOADS = path.join(__dirname, "uploads");
fs.mkdirSync(PASTA_UPLOADS, { recursive: true });

// Começo do endereço de todo arquivo salvo aqui (ex.: /uploads/123-abc.jpg)
const PREFIXO_UPLOADS = "/uploads/";

// Tamanhos máximos (1 MB = 1024 * 1024 bytes)
const MB = 1024 * 1024;
const TAMANHO_MAXIMO_VIDEO = 100 * MB;
const TAMANHO_MAXIMO_IMAGEM = 10 * MB;

/*
 * Tipos de arquivo aceitos e a extensão usada ao salvar.
 * A extensão vem do TIPO do arquivo (e não do nome que o usuário deu),
 * para ninguém conseguir disfarçar um arquivo perigoso de foto.
 */
const TIPOS_DE_IMAGEM = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};
const TIPOS_DE_VIDEO = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov", // vídeos de iPhone
  "video/ogg": ".ogv",
};

// Diz se o arquivo é "image" (foto), "video" ou null (tipo não aceito)
function tipoDaMidia(mimetype) {
  if (TIPOS_DE_IMAGEM[mimetype]) return "image";
  if (TIPOS_DE_VIDEO[mimetype]) return "video";
  return null;
}

// ------------------------------------------------------------
// 3. CRIAÇÃO DO SERVIDOR E DO BANCO DE DADOS
// ------------------------------------------------------------
const app = jsonServer.create();

// O "router" é quem lê e grava no db.json
const router = jsonServer.router(path.join(__dirname, "db.json"));

// O json-server-auth precisa acessar o banco de dados por aqui
app.db = router.db;

/*
 * REGRAS DE PERMISSÃO
 * Cada número de 3 dígitos diz quem pode fazer o quê:
 *   1º dígito = o dono do item, 2º = qualquer usuário logado, 3º = qualquer visitante
 *   6 = ler e escrever, 4 = só ler
 * "644" = todo mundo pode ver, mas só o dono pode criar/editar/apagar.
 * O "dono" é o usuário cujo id está no campo userId do item
 * (no caso de users, é o próprio id do usuário).
 */
const regras = auth.rewriter({
  users: 644,
  posts: 644,
  comments: 644,
  likes: 644,
  follows: 644,
});

/*
 * Remove campos sensíveis (senha e e-mail) de tudo que a API devolver,
 * inclusive dos usuários que vêm "dentro" de publicações e comentários.
 * Funciona "descendo" por listas e objetos até o fim (função recursiva).
 */
function removerDadosPrivados(dado) {
  if (Array.isArray(dado)) return dado.map(removerDadosPrivados);
  if (dado && typeof dado === "object") {
    const copia = {};
    for (const [chave, valor] of Object.entries(dado)) {
      if (chave === "password" || chave === "email") continue; // pula os campos privados
      copia[chave] = removerDadosPrivados(valor);
    }
    return copia;
  }
  return dado;
}
// Toda resposta do banco passa por aqui antes de ir para o site
router.render = (req, res) => {
  res.jsonp(removerDadosPrivados(res.locals.data));
};

// ------------------------------------------------------------
// 4. FUNÇÕES DE APOIO (middlewares)
// "Middleware" é uma função que roda no meio do caminho de um pedido,
// podendo deixá-lo seguir (next) ou barrá-lo com uma resposta de erro.
// ------------------------------------------------------------

/*
 * Verifica se quem fez o pedido está logado (se mandou um token válido).
 * Usado na rota de envio de arquivos.
 */
function exigirLogin(req, res, next) {
  // O site manda o token assim: "Authorization: Bearer <token>"
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json("Missing token");
  }
  try {
    // Confere a assinatura e a validade; guarda os dados do usuário em req.claims
    req.claims = jwt.verify(token, JWT_SECRET_KEY);
    next();
  } catch (erro) {
    res.status(401).json(erro.message);
  }
}

/*
 * Confere se um endereço aponta para um arquivo que REALMENTE
 * foi enviado para este servidor (e não para um site externo).
 * Devolve o tipo da mídia ("image"/"video") ou null se for inválido.
 */
function tipoDoArquivoSalvo(url) {
  if (typeof url !== "string" || !url.startsWith(PREFIXO_UPLOADS)) return null;
  // path.basename impede truques como "/uploads/../db.json"
  const nome = path.basename(url);
  if (url !== PREFIXO_UPLOADS + nome) return null;
  if (!fs.existsSync(path.join(PASTA_UPLOADS, nome))) return null;
  const extensao = path.extname(nome).toLowerCase();
  if (Object.values(TIPOS_DE_IMAGEM).includes(extensao)) return "image";
  if (Object.values(TIPOS_DE_VIDEO).includes(extensao)) return "video";
  return null;
}

/*
 * Garante que publicações e fotos de perfil só usem arquivos enviados para cá.
 * - Publicação nova: precisa de mediaUrl válido, e mediaType tem que bater com o arquivo.
 * - Editar publicação: não pode trocar o arquivo.
 * - Foto de perfil (no cadastro ou ao editar): vazia (sem foto) ou uma IMAGEM enviada para cá.
 */
function validarArquivos(req, res, next) {
  const corpo = req.body || {};
  const ehPosts = /^\/posts(\/|\?|$)/.test(req.path);
  const ehUsers = /^\/users(\/|\?|$)/.test(req.path);

  if (ehPosts && req.method === "POST") {
    const tipo = tipoDoArquivoSalvo(corpo.mediaUrl);
    if (!tipo || tipo !== corpo.mediaType) {
      return res.status(400).json("A publicação precisa de uma foto ou vídeo enviado pelo app");
    }
  }

  if (ehPosts && (req.method === "PATCH" || req.method === "PUT")) {
    if ("mediaUrl" in corpo || "mediaType" in corpo) {
      return res.status(400).json("Não é possível trocar o arquivo de uma publicação");
    }
  }

  // Cadastro (/register, /signup ou POST /users) e edição de perfil
  const ehCadastro = req.method === "POST" && /^\/(register|signup|users)\/?$/.test(req.path);
  const ehEdicaoDePerfil = ehUsers && (req.method === "PATCH" || req.method === "PUT");
  if ((ehCadastro || ehEdicaoDePerfil) && "avatar" in corpo) {
    if (corpo.avatar !== "" && tipoDoArquivoSalvo(corpo.avatar) !== "image") {
      return res.status(400).json("A foto de perfil precisa ser uma imagem enviada pelo app");
    }
  }

  next();
}

/*
 * Apaga do disco um arquivo enviado, MAS só se nenhuma publicação
 * nem foto de perfil estiver usando ele (para não quebrar nada).
 */
function apagarArquivoSeNinguemUsa(url) {
  if (!tipoDoArquivoSalvo(url)) return; // não é um arquivo nosso (ou já não existe)
  const usadoEmPost = app.db.get("posts").some({ mediaUrl: url }).value();
  const usadoEmPerfil = app.db.get("users").some({ avatar: url }).value();
  if (usadoEmPost || usadoEmPerfil) return;
  fs.unlink(path.join(PASTA_UPLOADS, path.basename(url)), () => {});
}

/*
 * Faxina automática dos arquivos:
 *  - ao APAGAR uma publicação, apaga a foto/vídeo dela;
 *  - ao TROCAR ou REMOVER a foto de perfil, apaga a foto antiga.
 * Guardamos o arquivo antigo ANTES do pedido e só apagamos DEPOIS que
 * o servidor respondeu com sucesso (se der erro de permissão, nada é apagado).
 */
function limparArquivosAntigos(req, res, next) {
  const [, recurso, id] = req.path.split("/"); // "/posts/3" -> ["", "posts", "3"]
  let urlAntiga = null;

  if (recurso === "posts" && id && req.method === "DELETE") {
    urlAntiga = app.db.get("posts").getById(id).value()?.mediaUrl;
  }
  if (recurso === "users" && id && ["PATCH", "PUT"].includes(req.method) && "avatar" in (req.body || {})) {
    urlAntiga = app.db.get("users").getById(id).value()?.avatar;
  }

  if (urlAntiga) {
    // "finish" = a resposta terminou de ser enviada
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) apagarArquivoSeNinguemUsa(urlAntiga);
    });
  }
  next();
}

/*
 * CONFIGURAÇÃO DO RECEBIMENTO DE ARQUIVOS (multer)
 * Cada arquivo é salvo com um nome único (data + código aleatório),
 * assim dois arquivos com o mesmo nome nunca se substituem.
 */
const recebimentoDeArquivo = multer({
  storage: multer.diskStorage({
    destination: PASTA_UPLOADS,
    filename: (req, arquivo, callback) => {
      const extensao = TIPOS_DE_IMAGEM[arquivo.mimetype] || TIPOS_DE_VIDEO[arquivo.mimetype];
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extensao}`);
    },
  }),
  // Limite geral = o do vídeo (o limite menor da imagem é conferido depois)
  limits: { fileSize: TAMANHO_MAXIMO_VIDEO, files: 1 },
  // Só aceita os tipos de foto e vídeo listados lá em cima
  fileFilter: (req, arquivo, callback) => {
    callback(null, tipoDaMidia(arquivo.mimetype) !== null);
  },
});

// ------------------------------------------------------------
// 5. ROTAS E ORDEM DOS MIDDLEWARES
// A ordem importa: cada pedido passa por eles de cima para baixo.
// ------------------------------------------------------------

// Permite que o site acesse este servidor
app.use(cors());

/*
 * Deixa os arquivos enviados visíveis no navegador:
 * http://localhost:3001/uploads/nome-do-arquivo
 * "nosniff" impede o navegador de tratar um arquivo como algo diferente do seu tipo.
 */
app.use(
  "/uploads",
  express.static(PASTA_UPLOADS, {
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  }),
);

/*
 * ROTA DE ENVIO: POST /upload
 * Recebe UM arquivo (foto ou vídeo) no campo "arquivo".
 * Devolve: { url: "/uploads/....", mediaType: "image" ou "video" }
 */
app.post("/upload", exigirLogin, recebimentoDeArquivo.single("arquivo"), (req, res) => {
  // Se o multer recusou o tipo, req.file fica vazio
  if (!req.file) {
    return res.status(400).json("Envie uma foto (JPG, PNG, GIF, WEBP) ou vídeo (MP4, WEBM, MOV)");
  }

  const mediaType = tipoDaMidia(req.file.mimetype);

  // Fotos têm limite menor que vídeos: se passar, apaga o arquivo e avisa
  if (mediaType === "image" && req.file.size > TAMANHO_MAXIMO_IMAGEM) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json("A foto deve ter no máximo 10 MB");
  }

  res.status(201).json({ url: PREFIXO_UPLOADS + req.file.filename, mediaType });
});

// Trata erros do envio (por exemplo, arquivo grande demais)
app.use((erro, req, res, next) => {
  if (erro instanceof multer.MulterError) {
    const mensagem =
      erro.code === "LIMIT_FILE_SIZE" ? "O vídeo deve ter no máximo 100 MB" : erro.message;
    return res.status(400).json(mensagem);
  }
  next(erro);
});

// Lê o corpo dos pedidos em JSON para a validação de arquivos conseguir enxergá-lo
app.use(express.json());

// Bloqueia publicações e fotos de perfil que não usem arquivos enviados para cá
app.use(validarArquivos);

// Apaga arquivos que deixaram de ser usados (publicação apagada, foto de perfil trocada)
app.use(limparArquivosAntigos);

// Depois: permissões -> login/cadastro -> dados do db.json
app.use(regras);
app.use(auth);
app.use(router);

// ------------------------------------------------------------
// 6. LIGA O SERVIDOR
// ------------------------------------------------------------
app.listen(port, () => console.log("Servidor rodando na porta:", port));
