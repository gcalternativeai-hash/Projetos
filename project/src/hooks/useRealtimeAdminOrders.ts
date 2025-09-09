import { useEffect, useState, useCallback } from 'react';
import { supabase, PedidoSupabase } from '../lib/supabase';
import { OrderData } from '../types/order';

/**
 * Hook para administradores acompanharem todos os pedidos em tempo real
 * Inclui notificações para novos pedidos e mudanças de status
 */
export function useRealtimeAdminOrders() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);

  // Converter pedido do Supabase para formato local
  const convertSupabaseToOrder = useCallback((pedido: PedidoSupabase): OrderData => {
    let items: OrderData['items'] = [];
    try {
      if (pedido.itens) {
        if (pedido.itens.startsWith('[')) {
          items = JSON.parse(pedido.itens);
        } else {
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

    const actualDeliveryFee = pedido.delivery_fee || 0;
  const actualTotal = pedido.valor_total;
  // Calcular subtotal subtraindo a taxa de entrega do total
  const calculatedSubtotalFromSupabase = actualTotal - actualDeliveryFee;

    console.log('DEBUG - useRealtimeAdminOrders: Dados brutos do Supabase para conversão:', pedido);
    console.log('DEBUG - useRealtimeAdminOrders: payment_method do Supabase:', pedido.payment_method);
    console.log('DEBUG - useRealtimeAdminOrders: delivery_fee do Supabase:', pedido.delivery_fee);
    console.log('DEBUG - useRealtimeAdminOrders: valor_pago do Supabase:', pedido.valor_pago);

    return {
      id: pedido.id!,
      customerName: pedido.nome,
      phone: pedido.telefone,
      address: pedido.endereco || 'Endereço não informado',
     paymentMethod: (pedido.payment_method || 'pix') as OrderData['paymentMethod'], // Lê do Supabase
      observations: pedido.adicionais || '',
      items,
      subtotal: calculatedSubtotalFromSupabase, // Subtotal é o total menos a taxa de entrega
      deliveryFee: pedido.delivery_fee || 0, // Lê do Supabase
      total: pedido.valor_total,
      status: (pedido.status || 'pendente') as OrderData['status'],
      createdAt: pedido.data_pedido ? new Date(pedido.data_pedido) : new Date(),
      estimatedDelivery: pedido.data_pedido ? new Date(new Date(pedido.data_pedido).getTime() + 45 * 60 * 1000) : new Date(),
      type: (pedido.type || 'delivery') as 'delivery' | 'pickup', // Lê do Supabase
      valorPago: pedido.valor_pago ? Number(pedido.valor_pago) : null, // Garante que seja um número
    };
  }, []);

  // Carregar pedidos iniciais
  const loadOrders = useCallback(async () => {
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

      const convertedOrders = (data || []).map(convertSupabaseToOrder);
      setOrders(convertedOrders);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setError('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [convertSupabaseToOrder]);

  // Configurar listeners em tempo real
  useEffect(() => {
    // Carregar pedidos iniciais
    loadOrders();

    // Configurar subscription para todos os pedidos
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('🆕 Novo pedido recebido:', payload);
          
          if (payload.new) {
            const newOrder = convertSupabaseToOrder(payload.new as PedidoSupabase);
            setOrders(currentOrders => [newOrder, ...currentOrders]);
            setNewOrderCount(count => count + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('🔄 Pedido atualizado:', payload);
          
          if (payload.new) {
            const updatedOrder = convertSupabaseToOrder(payload.new as PedidoSupabase);
            setOrders(currentOrders => 
              currentOrders.map(order => 
                order.id === updatedOrder.id ? updatedOrder : order
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('🗑️ Pedido removido:', payload);
          
          if (payload.old) {
            setOrders(currentOrders => 
              currentOrders.filter(order => order.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders, convertSupabaseToOrder]);

  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Função para marcar novos pedidos como visualizados
  const markNewOrdersAsViewed = useCallback(() => {
    setNewOrderCount(0);
  }, []);

  return {
    orders,
    loading,
    error,
    newOrderCount,
    markNewOrdersAsViewed,
    refetch: loadOrders
  };
}