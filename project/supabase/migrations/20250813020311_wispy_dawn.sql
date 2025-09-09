/*
  # Configuração de Realtime para Painel Admin

  1. Configurações de RLS
    - Habilita RLS nas tabelas necessárias
    - Cria políticas para permitir operações admin
    - Configura acesso público para leitura

  2. Realtime
    - Habilita realtime nas tabelas
    - Configura publicações para mudanças

  3. Índices
    - Otimiza consultas frequentes
    - Melhora performance do realtime
*/

-- Configurar RLS para tabela produtos
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública de produtos
CREATE POLICY "Produtos são visíveis publicamente"
  ON produtos
  FOR SELECT
  TO public
  USING (true);

-- Política para permitir todas as operações (admin)
CREATE POLICY "Admin pode gerenciar produtos"
  ON produtos
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Configurar RLS para tabela pedidos (já existe, mas vamos garantir)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de pedidos (clientes)
CREATE POLICY "Clientes podem criar pedidos"
  ON pedidos
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política para permitir leitura e atualização (admin)
CREATE POLICY "Admin pode gerenciar pedidos"
  ON pedidos
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Habilitar realtime nas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE produtos;
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_produtos_ordem ON produtos(ordem ASC);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_disponivel ON produtos(disponivel);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido DESC);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Adicionar coluna updated_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'produtos' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE produtos ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Criar triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_produtos_updated_at ON produtos;
CREATE TRIGGER update_produtos_updated_at
    BEFORE UPDATE ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();