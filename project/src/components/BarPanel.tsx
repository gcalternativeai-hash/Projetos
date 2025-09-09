import React from 'react';
import { Coffee } from 'lucide-react';
import { OrderNotificationManager } from './OrderNotificationManager';
import { useRealtimeAdminOrders } from '../hooks/useRealtimeAdminOrders';

/**
 * Painel específico para o bar
 * Mostra pedidos com bebidas
 */
export function BarPanel() {
  const { orders, loading } = useRealtimeAdminOrders();
  
  // Filtrar pedidos com bebidas
  const barOrders = orders.filter(order => 
    order.items.some(item => 
      item.productName.toLowerCase().includes('bebida') ||
      item.productName.toLowerCase().includes('suco') ||
      item.productName.toLowerCase().includes('refrigerante') ||
      item.productName.toLowerCase().includes('água')
    ) && ['recebido', 'producao'].includes(order.status)
  );

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Sistema de Notificações para Bar */}
      <OrderNotificationManager sector="bar" />
      
      <header className="bg-blue-600 text-white p-4">
        <div className="flex items-center space-x-3">
          <Coffee size={32} />
          <div>
            <h1 className="text-2xl font-bold">Painel do Bar</h1>
            <p className="text-blue-100">
              {barOrders.length} pedidos com bebidas
            </p>
          </div>
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando pedidos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{order.id}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'recebido' 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'recebido' ? 'Novo' : 'Preparando'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p><strong>Cliente:</strong> {order.customerName}</p>
                  <p><strong>Horário:</strong> {order.createdAt.toLocaleTimeString('pt-BR')}</p>
                  
                  <div className="mt-3">
                    <strong>Bebidas:</strong>
                    <ul className="mt-1 space-y-1">
                      {order.items
                        .filter(item => 
                          item.productName.toLowerCase().includes('bebida') ||
                          item.productName.toLowerCase().includes('suco') ||
                          item.productName.toLowerCase().includes('refrigerante') ||
                          item.productName.toLowerCase().includes('água')
                        )
                        .map((item, index) => (
                          <li key={index} className="text-gray-700">
                            {item.quantity}x {item.productName}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}