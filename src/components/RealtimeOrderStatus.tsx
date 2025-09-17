import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Bell } from 'lucide-react';
import { useRealtimeOrderTracking } from '../hooks/useRealtimeOrderTracking';

interface RealtimeOrderStatusProps {
  orderId?: string;
  onStatusChange?: (newStatus: string) => void;
}

/**
 * Componente para mostrar status de conexão em tempo real
 * e últimas atualizações do pedido
 */
export function RealtimeOrderStatus({ orderId, onStatusChange }: RealtimeOrderStatusProps) {
  // Mova esta verificação para o início do componente
  if (!orderId) return null; 

  const { order, loading, error, lastUpdate } = useRealtimeOrderTracking(orderId);
  const [isConnected, setIsConnected] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  // Monitorar mudanças de status
  useEffect(() => {
    if (order && onStatusChange) {
      onStatusChange(order.status);
    }
  }, [order?.status, onStatusChange]);

  // Mostrar notificação quando houver atualização
  useEffect(() => {
    if (lastUpdate) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  // Monitorar status da conexão
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50">
      {/* Status da Conexão */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg text-sm ${
        isConnected && !error 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {isConnected && !error ? (
          <>
            <Wifi size={16} />
            <span>Conectado</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>Desconectado</span>
          </>
        )}
      </div>

      {/* Notificação de Atualização */}
      {showNotification && lastUpdate && (
        <div className="mt-2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center space-x-2 animate-pulse">
          <Bell size={16} />
          <span>Pedido atualizado!</span>
        </div>
      )}

      {/* Indicador de Loading */}
      {loading && (
        <div className="mt-2 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg shadow-lg text-sm flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
          <span>Sincronizando...</span>
        </div>
      )}

      {/* Última Atualização */}
      {lastUpdate && !loading && (
        <div className="mt-2 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg shadow-lg text-xs">
          Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
        </div>
      )}
    </div>
  );
}
