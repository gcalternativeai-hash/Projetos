import React from 'react';
import { ChefHat } from 'lucide-react';
import { OrderNotificationManager } from './OrderNotificationManager';
import { useRealtimeAdminOrders } from '../hooks/useRealtimeAdminOrders';

/**
 * Painel específico para a cozinha
 * Mostra apenas pedidos relevantes para preparo
 */
export function KitchenPanel() {
  const { orders, loading } = useRealtimeAdminOrders();
  
  // Filtrar pedidos relevantes para a cozinha
  const kitchenOrders = orders.filter(order => 
    ['recebido', 'producao'].includes(order.status)
  );

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Sistema de Notificações para Cozinha */}
      <OrderNotificationManager sector="cozinha" />
      
      <header className="bg-orange-600 text-white p-4">
        <div className="flex items-center space-x-3">
          <ChefHat size={32} />
          <div>
            <h1 className="text-2xl font-bold">Painel da Cozinha</h1>
            <p className="text-orange-100">
              {kitchenOrders.length} pedidos para preparo
            </p>
          </div>
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando pedidos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kitchenOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{order.id}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'recebido' 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'recebido' ? 'Novo' : 'Em Preparo'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p><strong>Cliente:</strong> {order.customerName}</p>
                  <p><strong>Horário:</strong> {order.createdAt.toLocaleTimeString('pt-BR')}</p>
                  
                  <div className="mt-3">
                    <strong>Itens:</strong>
                    <ul className="mt-1 space-y-1">
                      {order.items.map((item, index) => (
                        <li key={index} className="text-gray-700">
                          {item.quantity}x {item.productName}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {order.observations && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded">
                      <strong>Observações:</strong>
                      <p className="text-gray-700">{order.observations}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}