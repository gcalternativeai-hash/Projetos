import { useEffect, useState, useCallback } from 'react';
import { supabase, ProdutoSupabase, RealtimePayload } from '../lib/supabase';
import { Product } from '../data/products';

// Converter produto do Supabase para formato local
const convertSupabaseToProduct = (produto: ProdutoSupabase): Product => ({
  id: produto.id!,
  name: produto.nome,
  price: produto.preco,
  description: produto.descricao || '',
  category: produto.categoria || 'Salgados',
  image: produto.imagem || '',
  available: produto.disponivel === 'true', // Converte a string "true" para boolean true, e qualquer outra coisa para false
  ingredients: produto.ingredientes || [],
  ordem: produto.ordem || 0
});

export function useRealtimeProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar produtos iniciais
  useEffect(() => {
    loadProducts();
  }, []);

  // Configurar realtime listener
  useEffect(() => {
    const channel = supabase
      .channel('produtos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produtos'
        },
        (payload: RealtimePayload<ProdutoSupabase>) => {
          console.log('🔄 [Realtime] Payload bruto recebido:', payload); // Log do payload bruto
          handleRealtimeChange(payload);
        }
      )
      .subscribe();

    console.log('✅ [Realtime] Canal "produtos-changes" inscrito com sucesso.'); // NOVO LOG AQUI

    return () => {
      console.log('🧹 [Realtime] Limpando canal "produtos-changes".'); // NOVO LOG AQUI
      supabase.removeChannel(channel);
    };
  }, []);

 const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, preco, descricao, categoria, imagem, disponivel, ingredientes, ordem')
        .order('ordem', { ascending: true });

      if (error) {
        throw error;
      }

      const convertedProducts = (data || []).map(convertSupabaseToProduct);
      setProducts(convertedProducts);
      console.log('📦 [Realtime] Produtos iniciais carregados:', convertedProducts.length); // NOVO LOG AQUI
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRealtimeChange = useCallback((payload: RealtimePayload<ProdutoSupabase>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setProducts(currentProducts => {
      switch (eventType) {
        case 'INSERT':
          if (newRecord) {
            const newProduct = convertSupabaseToProduct(newRecord);
            console.log('🆕 Produto inserido (converted):', newProduct); // Log do novo produto convertido
            return [...currentProducts, newProduct].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
          }
          return currentProducts;

        case 'UPDATE':
          if (newRecord) {
            const updatedProduct = convertSupabaseToProduct(newRecord);
            console.log('🔄 [Realtime] Produto atualizado (convertido):', updatedProduct);
            return currentProducts
              .map(product => product.id === updatedProduct.id ? updatedProduct : product)
              .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
          }
          return currentProducts;

        case 'DELETE':
          if (oldRecord) {
            console.log('🗑️ Produto deletado (old record):', oldRecord); // Log do registro antigo deletado
            return currentProducts.filter(product => product.id !== oldRecord.id);
          }
          return currentProducts;

        default:
          return currentProducts;
      }
    });
  }, [convertSupabaseToProduct]);

  return {
    products,
    loading,
    error,
    refetch: loadProducts
  };
}