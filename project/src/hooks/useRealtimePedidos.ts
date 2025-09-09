import { useEffect, useState } from 'react';
import { supabase, PedidoSupabase, RealtimePayload } from '../lib/supabase';
import { OrderData } from '../types/order';

// Converter pedido do Supabase para formato local
const convertSupabaseToOrder = (pedido: PedidoSupabase): OrderData => {
  // Parse dos itens (assumindo que estão em formato string)
  let items: OrderData['items'] = [];
  try {
    if (pedido.itens) {
      // Se os itens estão em formato JSON, parse eles
      if (pedido.itens.startsWith('[')) {
        items = JSON.parse(pedido.itens);
      } else {
        // Se estão em formato texto, criar estrutura básica
        items = [{
          productId: 'unknown',
          productName: pedido.itens,
          price: pedido.valor_total,
          quantity: 1
        }];
      }
    }
  } catch (error) {
    console.error('Erro ao parsear itens do pedido:', error);
    items = [{
      productId: 'unknown',
      productName: pedido.itens || 'Item desconhecido',
      price: pedido.valor_total,
      quantity: 1
    }];
  }

  return {
    id: pedido.id!,
    customerName: pedido.nome,
    phone: pedido.telefone,
    address: pedido.endereco || 'Endereço não informado',
    paymentMethod: 'pix' as const, // Valor padrão
    observations: pedido.adicionais || '',
    items,
    subtotal: pedido.valor_total,
    deliveryFee: 0, // Calcular se necessário
    total: pedido.valor_total,
    status: (pedido.status || 'recebido') as OrderData['status'],
    createdAt: pedido.data_pedido ? new Date(pedido.data_pedido) : new Date(),
    estimatedDelivery: pedido.data_pedido ? new Date(new Date(pedido.data_pedido).getTime() + 45 * 60 * 1000) : new Date(),
    type: (pedido.type || 'delivery') as 'delivery' | 'pickup'
  };
};

export function useRealtimePedidos() {
  const [pedidos, setPedidos] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar pedidos iniciais
  useEffect(() => {
    loadPedidos();
  }, []);

  // Configurar realtime listener
  useEffect(() => {
    const channel = supabase
      .channel('pedidos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos'
        },
        (payload: RealtimePayload<PedidoSupabase>) => {
          console.log('🔄 Pedido alterado:', payload);
          handleRealtimeChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('data_pedido', { ascending: false });

      if (error) {
        throw error;
      }

      const convertedPedidos = (data || []).map(convertSupabaseToOrder);
      setPedidos(convertedPedidos);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setError('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeChange = (payload: RealtimePayload<PedidoSupabase>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setPedidos(currentPedidos => {
      switch (eventType) {
        case 'INSERT':
          if (newRecord) {
            const newPedido = convertSupabaseToOrder(newRecord);
            return [newPedido, ...currentPedidos];
          }
          return currentPedidos;

        case 'UPDATE':
          if (newRecord) {
            const updatedPedido = convertSupabaseToOrder(newRecord);
            return currentPedidos.map(pedido => 
              pedido.id === updatedPedido.id ? updatedPedido : pedido
            );
          }
          return currentPedidos;

        case 'DELETE':
          if (oldRecord) {
            return currentPedidos.filter(pedido => pedido.id !== oldRecord.id);
          }
          return currentPedidos;

        default:
          return currentPedidos;
      }
    });
  };

  return {
    pedidos,
    loading,
    error,
    refetch: loadPedidos
  };
}