/*
  # Adicionar coluna endereco na tabela pedidos

  1. Alterações
    - Adicionar coluna `endereco` na tabela `pedidos`
    - Definir valor padrão como string vazia
    - Atualizar índices se necessário

  2. Segurança
    - Manter políticas RLS existentes
    - Não afetar dados existentes
*/

-- Adicionar coluna endereco se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'endereco'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN endereco text DEFAULT '';
  END IF;
END $$;

-- Comentário da coluna
COMMENT ON COLUMN pedidos.endereco IS 'Endereço de entrega do pedido';