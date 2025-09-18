import React, { useEffect, useState } from 'react';
import { Bell, X, Package, Eye } from 'lucide-react';
import { useRealtimeAdminOrders } from '../hooks/useRealtimeAdminOrders';
import { OrderData } from '../types/order';

interface AdminOrderNotificationsProps {
  onOrderSelect?: (order: OrderData) => void;
}

/**
 * Componente de notificações para administradores
 * Mostra novos pedidos e atualizações em tempo real
 */
export function AdminOrderNotifications({ onOrderSelect }: AdminOrderNotificationsProps) {
  const { orders, newOrderCount, markNewOrdersAsViewed } = useRealtimeAdminOrders();
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);

  // Atualizar pedidos recentes (últimos 5)
  useEffect(() => {
    const recent = orders
      .filter(order => {
        const orderTime = new Date(order.createdAt).getTime();
        const now = new Date().getTime();
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        return orderTime > fiveMinutesAgo;
      })
      .slice(0, 5);
    
    setRecentOrders(recent);
  }, [orders]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      markNewOrdersAsViewed();
    }
  };

  const handleOrderClick = (order: OrderData) => {
    if (onOrderSelect) {
      onOrderSelect(order);
    }
    setShowNotifications(false);
  };

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <button
        onClick={handleNotificationClick}
        className="relative p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
        title="Notificações de Pedidos"
      >
        <Bell size={20} />
        {newOrderCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-500 text-yellow-900 text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
            {newOrderCount > 9 ? '9+' : newOrderCount}
          </span>
        )}
      </button>

      {/* Painel de Notificações */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Pedidos Recentes</h3>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentOrders.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Package size={32} className="mx-auto mb-2 text-gray-300" />
                <p>Nenhum pedido recente</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        {order.id}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'recebido' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'producao' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'entrega' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>{order.customerName}</strong>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>R$ {order.total.toFixed(2)}</span>
                      <span>{order.createdAt.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                    </div>
                    
                    <div className="mt-2 flex items-center text-xs text-blue-600">
                      <Eye size={12} className="mr-1" />
                      <span>Clique para ver detalhes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {recentOrders.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setShowNotifications(false);
                  markNewOrdersAsViewed();
                }}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Ver todos os pedidos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}