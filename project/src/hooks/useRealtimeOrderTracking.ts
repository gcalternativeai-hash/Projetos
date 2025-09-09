import { useEffect, useState, useCallback } from 'react';
import { supabase, PedidoSupabase } from '../lib/supabase';
import { OrderData } from '../types/order';
import { useOrder } from '../contexts/OrderContext'; // Importe useOrder

/**
 * Hook personalizado para acompanhamento em tempo real de pedidos específicos
 * Usado principalmente pelo cliente para acompanhar seu pedido
 */
export function useRealtimeOrderTracking(orderId?: string) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Obtenha o dispatch do OrderContext para limpar o pedido se ele não for encontrado
  const { dispatch: orderContextDispatch } = useOrder();

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

    console.log('DEBUG - useRealtimeOrderTracking: Dados brutos do Supabase para conversão:', pedido);
    console.log('DEBUG - useRealtimeOrderTracking: payment_method do Supabase:', pedido.payment_method);
    console.log('DEBUG - useRealtimeOrderTracking: delivery_fee do Supabase:', pedido.delivery_fee);
    console.log('DEBUG - useRealtimeOrderTracking: valor_pago do Supabase:', pedido.valor_pago);

    
    console.log('DEBUG: Supabase Pedido recebido para conversão:', pedido); // Adicione esta linha
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

  // Carregar pedido inicial
  const loadOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        // Se o erro for "no rows found" (PGRST116), significa que o ID não foi encontrado
        if (error.code === 'PGRST116') {
          console.warn(`Pedido com ID ${orderId} não encontrado no banco de dados. Limpando pedido local.`);
          orderContextDispatch({ type: 'CLEAR_ORDER' }); // Limpa o pedido do contexto e do localStorage
          setOrder(null); // Limpa o pedido do estado deste hook
          setError(null); // Limpa qualquer mensagem de erro
          return; // Sai da função, pois o pedido não existe
        }
        throw error; // Re-lança outros erros
      }

      if (data) {
        const convertedOrder = convertSupabaseToOrder(data);
        setOrder(convertedOrder);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Erro ao carregar pedido:', err);
      setError('Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  }, [orderId, convertSupabaseToOrder, orderContextDispatch]); // Adicione orderContextDispatch às dependências

  // Configurar listener em tempo real
  useEffect(() => {
    if (!orderId) return;

    // Carregar pedido inicial
    loadOrder();

    // Configurar subscription para mudanças em tempo real
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('DEBUG: Realtime payload recebido:', payload); // Adicione esta linha
          console.log('🔄 Pedido atualizado em tempo real:', payload);
          
          if (payload.new) {
            const updatedOrder = convertSupabaseToOrder(payload.new as PedidoSupabase);
            console.log('DEBUG: Pedido convertido em useRealtimeOrderTracking:', updatedOrder); // Adicione esta linha
            setOrder(updatedOrder);
            setLastUpdate(new Date());
            
            // Notificação visual opcional
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Pedido Atualizado!', {
                body: `Status: ${updatedOrder.status}`,
                icon: '/favicon.ico'
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, loadOrder, convertSupabaseToOrder]);

  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    order,
    loading,
    error,
    lastUpdate,
    refetch: loadOrder
  };
}
