-- =====================================================================================
-- ECOAPP - ESTRUTURA MINIMA DE BANCO DE DADOS
-- =====================================================================================
-- Banco alvo: PostgreSQL
-- Objetivo: suportar apenas o que o app precisa hoje
--
-- Tabelas:
-- - usuarios
-- - pontos_coleta
-- - descartes
-- - ranking
--
-- Este script evita complexidade desnecessaria e pode ser executado de uma vez.
-- =====================================================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  ano_nascimento VARCHAR(7) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'usuario',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_usuarios_tipo CHECK (tipo IN ('usuario', 'admin'))
);

CREATE TABLE IF NOT EXISTS pontos_coleta (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  bairro VARCHAR(100) NOT NULL,
  endereco VARCHAR(255) NOT NULL,
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  avaliacao DECIMAL(3, 1),
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_pontos_tipo CHECK (tipo IN ('reciclavel', 'lixo')),
  CONSTRAINT chk_pontos_avaliacao CHECK (avaliacao IS NULL OR (avaliacao >= 0 AND avaliacao <= 5))
);

CREATE TABLE IF NOT EXISTS descartes (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  foto_url TEXT NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  data_iso TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  validado_em TIMESTAMP NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_descartes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT chk_descartes_status CHECK (status IN ('pendente', 'validado'))
);

CREATE TABLE IF NOT EXISTS ranking (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL UNIQUE,
  pontos INTEGER NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_ranking_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT chk_ranking_pontos CHECK (pontos >= 0)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_pontos_tipo ON pontos_coleta(tipo);
CREATE INDEX IF NOT EXISTS idx_pontos_bairro ON pontos_coleta(bairro);
CREATE INDEX IF NOT EXISTS idx_descartes_usuario_id ON descartes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_descartes_status ON descartes(status);
CREATE INDEX IF NOT EXISTS idx_descartes_data_iso ON descartes(data_iso DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_pontos ON ranking(pontos DESC);

-- =====================================================================================
-- ADMINS FIXOS DO SISTEMA
-- =====================================================================================
-- Inserir somente se ainda nao existirem.
-- Substituir <hash_da_senha> pelo hash bcrypt da senha escolhida.
-- Esses usuarios nao devem ser criados pelo cadastro normal do app.

INSERT INTO usuarios (nome, ano_nascimento, telefone, email, senha_hash, tipo)
VALUES
  ('Beatriz Freitas', '2000-01', '00000000000', 'beatriz@app.com', '<hash_da_senha>', 'admin'),
  ('Samuel Valentim',  '2000-01', '00000000000', 'samuel@app.com',  '<hash_da_senha>', 'admin'),
  ('Gabriel Suliano',  '2000-01', '00000000000', 'gabriel@app.com', '<hash_da_senha>', 'admin')
ON CONFLICT (email) DO NOTHING;

-- =====================================================================================
-- DADOS INICIAIS MINIMOS
-- =====================================================================================

INSERT INTO pontos_coleta (id, nome, tipo, bairro, endereco, lat, lng, avaliacao)
VALUES
  ('cg-01', 'Ecoponto Campo Grande', 'lixo', 'Campo Grande', 'Avenida Maria Teresa, Campo Grande, Rio de Janeiro, RJ', NULL, NULL, 4.8),
  ('cg-02', 'Ecoponto Campo Grande Reciclavel', 'reciclavel', 'Campo Grande', 'Avenida Maria Teresa, Campo Grande, Rio de Janeiro, RJ', NULL, NULL, 4.8),
  ('bg-01', 'Ecoponto Catiri', 'lixo', 'Bangu', 'Catiri, Bangu, Rio de Janeiro, RJ', NULL, NULL, 4.7),
  ('bg-03', 'Ecoponto Reciclavel Bangu Shopping', 'reciclavel', 'Bangu', 'Rua Fonseca, 240 - Bangu, Rio de Janeiro - RJ', NULL, NULL, 4.9)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================================
-- CONSULTA SIMPLES DE RANKING
-- =====================================================================================
-- Cada descarte validado vale 10 pontos.

-- Exemplo de consulta:
-- SELECT
--   u.email,
--   COUNT(d.id) * 10 AS pontos
-- FROM usuarios u
-- LEFT JOIN descartes d
--   ON d.usuario_id = u.id
--  AND d.status = 'validado'
-- GROUP BY u.id, u.email
-- ORDER BY pontos DESC, u.email ASC;

-- =====================================================================================
-- OBSERVACAO IMPORTANTE
-- =====================================================================================
-- A tabela ranking armazena a pontuacao acumulada por usuario.
-- Atualizar via: INSERT ... ON CONFLICT (usuario_id) DO UPDATE SET pontos = pontos + 10
-- ao validar um descarte em PUT /api/descartes/:id/validar.