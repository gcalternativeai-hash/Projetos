import React from 'react';
import { CreditCard } from 'lucide-react';
import { OrderNotificationManager } from './OrderNotificationManager';
import { useRealtimeAdminOrders } from '../hooks/useRealtimeAdminOrders';

/**
 * Painel específico para o PDV (Ponto de Venda)
 * Mostra informações de pagamento e entrega
 */
export function PDVPanel() {
  const { orders, loading } = useRealtimeAdminOrders();
  
  // Filtrar pedidos relevantes para PDV
  const pdvOrders = orders.filter(order => 
    ['recebido', 'producao', 'entrega'].includes(order.status)
  );

  return (
    <div className="min-h-screen bg-green-50">
      {/* Sistema de Notificações para PDV */}
      <OrderNotificationManager sector="pdv" />
      
      <header className="bg-green-600 text-white p-4">
        <div className="flex items-center space-x-3">
          <CreditCard size={32} />
          <div>
            <h1 className="text-2xl font-bold">Painel do PDV</h1>
            <p className="text-green-100">
              {pdvOrders.length} pedidos ativos
            </p>
          </div>
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando pedidos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pdvOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{order.id}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'recebido' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'producao' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {order.status === 'recebido' ? 'Novo' :
                     order.status === 'producao' ? 'Preparando' : 'Saindo'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p><strong>Cliente:</strong> {order.customerName}</p>
                  <p><strong>Telefone:</strong> {order.phone}</p>
                  <p><strong>Endereço:</strong> {order.address}</p>
                  <p><strong>Pagamento:</strong> {order.paymentMethod.toUpperCase()}</p>
                  <p><strong>Total:</strong> R$ {order.total.toFixed(2)}</p>
                  <p><strong>Horário:</strong> {order.createdAt.toLocaleTimeString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}