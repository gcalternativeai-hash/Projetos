/*
  # Criar tabela de pedidos

  1. Nova Tabela
    - `pedidos`
      - `id` (uuid, primary key)
      - `nome` (text)
      - `telefone` (text)
      - `itens` (text)
      - `adicionais` (text)
      - `bebidas` (text)
      - `valor_total` (numeric)
      - `status` (text, default 'pendente')
      - `data_pedido` (timestamptz, default now())

  2. Segurança
    - Habilitar RLS na tabela `pedidos`
    - Adicionar política para permitir inserção pública
    - Adicionar política para leitura autenticada
*/

CREATE TABLE IF NOT EXISTS pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text NOT NULL,
  itens text NOT NULL,
  adicionais text DEFAULT '',
  bebidas text DEFAULT '',
  valor_total numeric(10,2) NOT NULL,
  status text DEFAULT 'pendente',
  data_pedido timestamptz DEFAULT now()
);

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública (clientes fazendo pedidos)
CREATE POLICY "Permitir inserção pública de pedidos"
  ON pedidos
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política para permitir leitura autenticada (admin visualizando pedidos)
CREATE POLICY "Permitir leitura autenticada de pedidos"
  ON pedidos
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir atualização autenticada (admin atualizando status)
CREATE POLICY "Permitir atualização autenticada de pedidos"
  ON pedidos
  FOR UPDATE
  TO authenticated
  USING (true);