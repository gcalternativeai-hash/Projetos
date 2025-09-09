import React, { useState } from 'react';
import { Package, User, Phone, MapPin, CreditCard, MessageSquare, Clock, CheckCircle, Truck, ChefHat, X, Trash2 } from 'lucide-react';
import { useRealtimeAdminOrders } from '../hooks/useRealtimeAdminOrders';
import { atualizarPedido, deletarPedido } from '../lib/supabase';
import { OrderData } from '../types/order';
import { printComanda } from '../utils/printComanda';
import { PrintConfirmationModal } from './PrintConfirmationModal';
import { useAdmin } from '../contexts/AdminContext'; // <--- ADICIONE ESTA LINHA AQUI

interface OrderManagerProps {
  selectedOrder?: OrderData | null;
}

const statusConfig = {
  pendente: {
    icon: Clock,
    title: 'Pendente',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  },
  recebido: {
    icon: Package,
    title: 'Pedido Recebido',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  producao: {
    icon: ChefHat,
    title: 'Em Produção',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  entrega: {
    icon: Truck,
    title: 'Saindo para Entrega',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  pronto_para_retirada: {
    icon: CheckCircle,
    title: 'Pronto para Retirada',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200'
  },
  entregue: {
    icon: CheckCircle,
    title: 'Entregue',
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  }
};

export function OrderManager({ selectedOrder }: OrderManagerProps) {
  const { orders, loading, error } = useRealtimeAdminOrders();
  const { state: adminState } = useAdmin(); // <--- ADICIONE ESTA LINHA
  const [detailOrder, setDetailOrder] = useState<OrderData | null>(selectedOrder || null);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [orderToFinish, setOrderToFinish] = useState<OrderData | null>(null);

  // Atualizar pedido selecionado quando prop mudar
  React.useEffect(() => {
    if (selectedOrder) {
      setDetailOrder(selectedOrder);
    }
  }, [selectedOrder]);

  const handleStatusChange = async (order: OrderData, newStatus: 'recebido' | 'producao' | 'entrega' | 'pronto_para_retirada' | 'entregue') => {
    // Se o status for "entregue", mostrar modal de confirmação para impressão
    if (newStatus === 'entregue') {
      setOrderToFinish(order);
      setShowPrintModal(true);
      return;
    }

    // Para outros status, continuar com o fluxo normal
    await updateOrderStatus(order, newStatus);
  };

  const updateOrderStatus = async (order: OrderData, newStatus: 'recebido' | 'producao' | 'entrega'| 'pronto_para_retirada' | 'entregue') => {
    try {
      // Atualizar estado local imediatamente para feedback visual instantâneo
      const updatedOrder = { ...order, status: newStatus };
      
      // Se este é o pedido em detalhes, atualizar também
      if (detailOrder && detailOrder.id === order.id) {
        setDetailOrder(updatedOrder);
      }
      
      const result = await atualizarPedido(order.id, { status: newStatus });

      // ADICIONE ESTE LOG PARA DEPURAR
    console.log('Resultado da atualização do Supabase:', result);

      
      if (result.success) {
        setShowToast({
          message: `Status do Pedido ${order.id} alterado para ${statusConfig[newStatus].title.toUpperCase()}`,
          type: 'success'
        });
      } else {
        // Reverter estado local em caso de erro
        if (detailOrder && detailOrder.id === order.id) {
          setDetailOrder(order);
        }
        setShowToast({
          message: `Erro ao alterar status do pedido ${order.id}: ${result.message}`,
          type: 'error'
        });
      }
    } catch (error) {
      // Reverter estado local em caso de erro
      if (detailOrder && detailOrder.id === order.id) {
        setDetailOrder(order);
      }
      setShowToast({
        message: `Erro inesperado ao alterar status do pedido ${order.id}`,
        type: 'error'
      });
    }
    
    setTimeout(() => setShowToast(null), 3000);
  };

  const handlePrintConfirmation = async (shouldPrint: boolean) => {
    if (!orderToFinish) return;

    // Fechar modal
    setShowPrintModal(false);
    
    // O status final depende do tipo de pedido
    const finalStatus = 'entregue'; // <-- MODIFIQUE ESTA LINHA
    await updateOrderStatus(orderToFinish, finalStatus);

    if (shouldPrint) {
      printComanda(orderToFinish, {
        storeName: adminState.settings.storeName,
        storeAddress: adminState.settings.storeAddress,
        storePhone: adminState.settings.storePhone
      });
    }
    
    // Limpar estado
    setOrderToFinish(null);
    
    // Mostrar toast informativo
    const message = shouldPrint 
      ? `Pedido ${orderToFinish.id} finalizado e comanda impressa!`
      : `Pedido ${orderToFinish.id} finalizado com sucesso!`;
    
    setShowToast({
      message,
      type: 'success'
    });
  };

  const handlePrintModalCancel = () => {
    setShowPrintModal(false);
    setOrderToFinish(null);
  };

  const handleCancelOrder = async (order: OrderData) => {
    if (window.confirm(`Tem certeza que deseja cancelar o pedido ${order.id}?`)) {
      try {
        const result = await deletarPedido(order.id);
        
        if (result.success) {
          setDetailOrder(null);
          setShowToast({
            message: `Pedido ${order.id} cancelado com sucesso`,
            type: 'success'
          });
        } else {
          setShowToast({
            message: `Erro ao cancelar pedido ${order.id}: ${result.message}`,
            type: 'error'
          });
        }
      } catch (error) {
        setShowToast({
          message: `Erro inesperado ao cancelar pedido ${order.id}`,
          type: 'error'
        });
      }
      
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      pix: 'PIX',
      dinheiro: 'Dinheiro',
      cartao: 'Cartão'
    };
    return methods[method as keyof typeof methods] || method;
  };

  
  const activeOrders = orders.filter(order => order.status !== 'entregue'); // <-- MODIFIQUE ESTA LINHA
  const completedOrders = orders.filter(order => order.status === 'entregue' || order.status === 'pronto_para_retirada');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gerenciar Pedidos</h2>
          <p className="text-gray-600">
            {activeOrders.length} pedidos ativos • {completedOrders.length} finalizados
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${
          showToast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {showToast.message}
        </div>
      )}

      {/* Active Orders */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden dark:bg-gray-900">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pedidos em Aberto</h3>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            )}
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-1">Erro: {error}</p>
          )}
        </div>

        {activeOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg dark:text-gray-400">Nenhum pedido ativo</p>
            <p className="text-gray-400 text-sm dark:text-gray-500">Os novos pedidos aparecerão aqui</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeOrders.map((order) => {
              const statusInfo = statusConfig[order.status];
              const StatusIcon = statusInfo.icon;

              return (
                <div key={order.id} className={`p-6 hover:bg-gray-50 transition-colors dark:hover:bg-gray-800 ${
                  order.type === 'pickup' ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">{order.id}</h4>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} border ${statusInfo.borderColor}`}>
                          <StatusIcon size={12} />
                          <span>{statusInfo.title}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.type === 'delivery' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {order.type === 'delivery' ? '🚚 Entrega' : '🏪 Retirada'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-1">
                          <User size={14} />
                          <span>{order.customerName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CreditCard size={14} />
                          <span>R$ {order.total.toFixed(2)} - {getPaymentMethodLabel(order.paymentMethod)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{order.createdAt.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setDetailOrder(order)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Ver Detalhes
                      </button>
                      
                      <button
                        onClick={() => printComanda(order)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        title="Imprimir Comanda"
                      >
                        🖨️ Imprimir
                      </button>
                      
                      <select
                        value={order.status}
                        onChange={(e) => {
                          handleStatusChange(order, e.target.value as any);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="recebido">Pedido Recebido</option>
                        <option value="producao">Em Produção</option>
                        {order.type === 'delivery' ? (
                          <option value="entrega">Saindo para Entrega</option>
                        ) : (
                          <option value="pronto_para_retirada">Pronto para Retirada</option>
                        )}
                        <option value="entregue">Entregue</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden dark:bg-gray-900">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pedidos Finalizados</h3>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto dark:divide-gray-700">
            {completedOrders.slice(0, 10).map((order) => (
              <div key={order.id} className="p-4 text-sm dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{order.id}</span>
                    <span className="text-gray-600 dark:text-gray-400">{order.customerName}</span>
                    <span className="text-green-600 font-medium">R$ {order.total.toFixed(2)}</span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">
                    {order.createdAt.toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setDetailOrder(null)}
          />
          
          <div className="absolute inset-x-4 top-16 bottom-16 bg-white rounded-lg shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Detalhes do Pedido {detailOrder.id}</h3>
              <button
                onClick={() => setDetailOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-gray-700 dark:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
                <h4 className="font-semibold text-gray-800 mb-3 dark:text-gray-100">Informações do Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm dark:text-gray-300">
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-gray-500" />
                    <span>{detailOrder.customerName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone size={16} className="text-gray-500" />
                    <span>{detailOrder.phone}</span>
                  </div>
                  <div className="flex items-start space-x-2 md:col-span-2">
                    <MapPin size={16} className="text-gray-500 mt-0.5" />
                    <span>{detailOrder.address}</span>
                  </div>
                  <div className="flex items-center space-x-2 md:col-span-2">
                    <Package size={16} className="text-gray-500" />
                    <span className={`font-bold px-2 py-1 rounded-full text-xs ${
                      detailOrder.type === 'delivery' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {detailOrder.type === 'delivery' ? '🚚 Entrega' : '🏪 Retirada no Local'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 dark:text-gray-100">Itens do Pedido</h4>
                <div className="space-y-2">
                  {detailOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded dark:bg-gray-700">
                      <div>
                        <span className="font-medium dark:text-gray-100">{item.productName}</span>
                        <span className="text-gray-600 ml-2 dark:text-gray-300">x{item.quantity}</span>
                      </div>
                      <span className="font-medium dark:text-gray-100">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Total */}
              <div className="bg-orange-50 p-4 rounded-lg dark:bg-orange-900">
                <h4 className="font-semibold text-red-800 mb-3 dark:text-orange-200">Resumo do Pagamento</h4>
                <div className="space-y-2 text-sm dark:text-orange-100">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {detailOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de entrega:</span>
                    <span>R$ {detailOrder.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-800 border-t pt-2 dark:text-orange-200 dark:border-orange-700">
                    <span>Total:</span>
                    <span>R$ {detailOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <CreditCard size={16} />
                    <span>Pagamento: {getPaymentMethodLabel(detailOrder.paymentMethod)}</span>
                  </div>
                </div>
              </div>

              {/* Observations */}
              {detailOrder.observations && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2 dark:text-gray-100">
                    <MessageSquare size={16} />
                    <span>Observações</span>
                  </h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded dark:bg-gray-700 dark:text-gray-300">{detailOrder.observations}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t dark:border-gray-700">
                <select
                  value={detailOrder.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as any;
                    handleStatusChange(detailOrder, newStatus);
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="pendente">Pendente</option>
                  <option value="recebido">Pedido Recebido</option>
                  <option value="producao">Em Produção</option>
                  {detailOrder.type === 'delivery' ? (
                    <option value="entrega">Saindo para Entrega</option>
                  ) : (
                    <option value="pronto_para_retirada">Pronto para Retirada</option>
                  )}
                  <option value="entregue">Entregue</option>
                </select>
                
                <button
                  onClick={() => handleCancelOrder(detailOrder)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Cancelar Pedido</span>
                </button>
                
                <button
                  onClick={() => printComanda(detailOrder)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  title="Imprimir Comanda"
                >
                  <span>🖨️</span>
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Impressão */}
      {orderToFinish && (
        <PrintConfirmationModal
          order={orderToFinish}
          isOpen={showPrintModal}
          onConfirm={handlePrintConfirmation}
          onCancel={handlePrintModalCancel}
        />
      )}
    </div>
  );
}