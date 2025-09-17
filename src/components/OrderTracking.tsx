import React, { useEffect } from 'react';
import { X, Package, ChefHat, Truck, CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import { useOrder } from '../contexts/OrderContext';
import { RealtimeOrderStatus } from './RealtimeOrderStatus';

const getStatusConfig = (orderType: 'delivery' | 'pickup') => ({
  pendente: {
    icon: Clock,
    title: orderType === 'delivery' ? 'Entregue' : 'Retirado', // <-- ESTA LINHA É CRÍTICA
    description: 'Aguardando confirmação do pedido',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100'
  },
  recebido: {
    icon: Package,
    title: 'Pedido Recebido',
    description: 'Seu pedido foi confirmado e está sendo preparado',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  producao: {
    icon: ChefHat,
    title: 'Em Produção',
    description: 'Nossos chefs estão preparando seu lanche',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100'
  },
  entrega: {
    icon: Truck,
    title: orderType === 'delivery' ? 'Saindo para Entrega' : 'Pronto para Retirada',
    description: orderType === 'delivery' ? 'Seu pedido está a caminho!' : 'Seu pedido está pronto para ser retirado!',
    color: orderType === 'delivery' ? 'text-orange-500' : 'text-purple-500',
    bgColor: orderType === 'delivery' ? 'bg-orange-100' : 'bg-purple-100'
  },
  pronto_para_retirada: { // ESTE É O STATUS PARA RETIRADA
    icon: CheckCircle, // Ícone de check para indicar que está pronto
    title: 'Pronto para Retirada',
    description: 'Seu pedido está pronto para ser retirado!',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100'
  },
  entregue: {
    icon: CheckCircle,
    title: orderType === 'delivery' ? 'Entregue' : 'Retirado',
    description: orderType === 'delivery' ? 'Pedido entregue com sucesso!' : 'Pedido retirado com sucesso!',
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  }
});

export function OrderTracking() {
  const { state, dispatch } = useOrder();

  console.log('DEBUG: OrderTracking renderizado. currentOrder:', state.currentOrder); // Adicione esta linha
  console.log('DEBUG: OrderTracking renderizado. showTracking:', state.showTracking); // Adicione esta linha

  if (!state.showTracking || !state.currentOrder) {
     console.log('DEBUG: OrderTracking não visível ou sem currentOrder.'); // Adicione esta linha
    return null;
  }

  const statusConfig = getStatusConfig(state.currentOrder.type);
  console.log('DEBUG: currentOrder.status na OrderTracking:', state.currentOrder.status); // Adicione esta linha

  const getStatusIndex = (status: string) => {
    const statuses = ['pendente', 'recebido', 'producao', 'entrega', 'pronto_para_retirada', 'entregue'];
    return statuses.indexOf(status);
  };

  const currentStatusIndex = getStatusIndex(state.currentOrder.status);

  // Callback para atualizar status quando receber atualização em tempo real
  const handleStatusChange = (newStatus: string) => {
    if (state.currentOrder && newStatus !== state.currentOrder.status) {
      // Atualizar o pedido atual com o novo status
      const updatedOrder = { ...state.currentOrder, status: newStatus as any };
      dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });
    }
  };

const filteredTimelineStatuses = Object.keys(statusConfig).filter(statusKey => {
                 // Sempre mostre pendente, recebido, producao
          if (['pendente', 'recebido', 'producao'].includes(statusKey)) {
            return true;
              }
          // Mostre 'entrega' APENAS para pedidos de entrega
          if (statusKey === 'entrega' && state.currentOrder?.type === 'delivery') {
            return true;
          }
          // Mostre 'pronto_para_retirada' APENAS para pedidos de retirada
          if (statusKey === 'pronto_para_retirada' && state.currentOrder?.type === 'pickup') {
            return true;
          }
          // O status 'entregue' é o final e deve ser sempre mostrado
          if (statusKey === 'entregue') {
            return true;
          }
          return false;
        });
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Componente de Status em Tempo Real */}
      <RealtimeOrderStatus 
        orderId={state.currentOrder.id} 
        onStatusChange={handleStatusChange}
      />
      
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={() => dispatch({ type: 'HIDE_TRACKING' })}
      />
      
      <div className="absolute inset-x-0 bottom-0 top-16 bg-white rounded-t-2xl shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Acompanhar Pedido</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{state.currentOrder.id}</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'HIDE_TRACKING' })}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-gray-700 dark:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Order Info */}
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-orange-800 dark:text-red-200">Informações do Pedido</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-red-700 dark:text-red-100">
                  <strong>Cliente:</strong> {state.currentOrder.customerName}
                </p>
                <p className="text-red-700 dark:text-red-100">
                  <strong>Total:</strong> R$ {state.currentOrder.total.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-red-700 dark:text-red-100">
                  <strong>Pagamento:</strong> {state.currentOrder.paymentMethod.toUpperCase()}
                </p>
                <p className="text-red-700 dark:text-red-100">
                  <strong>Previsão:</strong> {state.currentOrder.estimatedDelivery.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-red-700 dark:text-red-100">
                  <strong>Tipo:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    state.currentOrder.type === 'delivery' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {state.currentOrder.type === 'delivery' ? '🚚 Entrega' : '🏪 Retirada'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Status do Pedido</h3>
            
            <div className="relative">
               
              {filteredTimelineStatuses.map((statusKey, index) => { // <-- MODIFIQUE ESTA LINHA
                const config = statusConfig[statusKey as keyof typeof statusConfig]; // <-- ADICIONE ESTA LINHA
                const Icon = config.icon;
                const isCompleted = getStatusIndex(statusKey) <= currentStatusIndex;
                const isCurrent = getStatusIndex(statusKey) === currentStatusIndex;
                
                return (
                  <div key={status} className="relative flex items-center space-x-4 pb-8">
                    {/* Timeline Line */}
                    {index < filteredTimelineStatuses.length - 1 && ( // <-- ALTERE AQUI: de Object.keys(statusConfig).length para filteredTimelineStatuses.length
                      <div className={`absolute left-6 top-12 w-0.5 h-16 ${
                        isCompleted ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                    
                    {/* Status Icon */}
                    <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                      isCompleted ? config.bgColor : 'bg-gray-100 dark:bg-gray-700'
                    } ${isCurrent ? 'ring-4 ring-red-200 animate-pulse' : ''}`}>
                      <Icon size={20} className={isCompleted ? config.color : 'text-gray-400 dark:text-gray-500'} />
                    </div>
                    
                    {/* Status Info */}
                    <div className="flex-1">
                      <h4 className={`font-medium ${isCompleted ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                        {config.title}
                      </h4>
                      <p className={`text-sm ${isCompleted ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                        {config.description}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-red-600 mt-1">
                          Status atual - Aguardando atualização
                        </p>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    {isCompleted && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {state.orderHistory[index]?.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Itens do Pedido</h3>
            <div className="space-y-2">
              {state.currentOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{item.productName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Quantidade: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-red-600 dark:text-gray-100">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700">
            <h3 className="font-semibold text-gray-800 mb-2 dark:text-gray-100">Precisa de Ajuda?</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center space-x-2">
                <Phone size={16} />
                <span>(73) 9 8819-9938</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={16} />
                <span>Rua Barão do Rio Branco, 101 - Maracás-Ba</span>
              </div>
              <div className="bg-blue-50 p-2 rounded mt-2 dark:bg-blue-900">
                <p className="text-xs text-blue-700 dark:text-blue-100">
                  💡 Seu pedido é atualizado manualmente pelo nosso time. 
                  O status será alterado conforme o andamento real da produção.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {(state.currentOrder.status === 'entregue' || state.currentOrder.status === 'pronto_para_retirada') && (
              <button
                onClick={() => {
                  dispatch({ type: 'CLEAR_ORDER' });
                  dispatch({ type: 'HIDE_TRACKING' });
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                ✅ Pedido Concluído
              </button>
            )}

            
            {state.currentOrder.status !== 'entregue' && state.currentOrder.status !== 'pronto_para_retirada' && (
            <button
              onClick={() => dispatch({ type: 'HIDE_TRACKING' })}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
            >
              Fechar
            </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}