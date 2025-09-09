import React, { useState } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Eye, X, Settings } from 'lucide-react';
import { useOrderNotifications } from '../hooks/useOrderNotifications';

interface OrderNotificationManagerProps {
  sector?: 'cozinha' | 'bar' | 'pdv' | 'admin';
}

/**
 * Componente para gerenciar notificações de pedidos
 * Usado em setores como cozinha, bar, PDV
 */
export function OrderNotificationManager({ sector = 'admin' }: OrderNotificationManagerProps) {
  const {
    activeNotifications,
    isEnabled,
    setIsEnabled,
    markAsViewed,
    stopAllNotifications,
    config,
    triggerAudioUnlock
  } = useOrderNotifications();

  const [showSettings, setShowSettings] = useState(false);

  const handleToggleNotifications = () => {
    setIsEnabled(!isEnabled);
    // Se as notificações estão sendo ativadas (ou seja, isEnabled era false antes de setIsEnabled)
    if (!isEnabled) {
      triggerAudioUnlock(); // Tenta desbloquear o áudio
    }
  };

  const getSectorTitle = () => {
    const titles = {
      cozinha: '👨‍🍳 Cozinha',
      bar: '🍹 Bar',
      pdv: '💰 PDV',
      admin: '👨‍💼 Admin'
    };
    return titles[sector];
  };

  const getSectorColor = () => {
    const colors = {
      cozinha: 'bg-orange-500',
      bar: 'bg-blue-500',
      pdv: 'bg-green-500',
      admin: 'bg-red-500'
    };
    return colors[sector];
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Botão Principal */}
      <div className="flex items-center space-x-2 mb-2">
        <button
          //onClick={() => setIsEnabled(!isEnabled)}
          onClick={handleToggleNotifications}
          className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
            isEnabled 
              ? `${getSectorColor()} hover:opacity-80 text-white` 
              : 'bg-gray-400 hover:bg-gray-500 text-white'
          }`}
          title={`${isEnabled ? 'Desativar' : 'Ativar'} notificações`}
        >
          {isEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          {activeNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-yellow-900 text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
              {activeNotifications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg transition-colors"
          title="Configurações"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Painel de Configurações */}
      {showSettings && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 mb-2 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
              <span>{getSectorTitle()}</span>
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isEnabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isEnabled ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Repetições:</span>
              <span className="text-gray-800">{config.maxRepeats}x</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Intervalo:</span>
              <span className="text-gray-800">{config.repeatInterval / 1000}s</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Som:</span>
              <span className="flex items-center space-x-1">
                {config.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span className="text-gray-800">
                  {config.soundEnabled ? 'Ativo' : 'Inativo'}
                </span>
              </span>
            </div>

            {activeNotifications.length > 0 && (
              <button
                onClick={stopAllNotifications}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm transition-colors"
              >
                Parar Todas as Notificações
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista de Notificações Ativas */}
      {activeNotifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 bg-yellow-50">
            <h3 className="font-semibold text-yellow-800 flex items-center space-x-2">
              <Bell size={16} />
              <span>Novos Pedidos ({activeNotifications.length})</span>
            </h3>
          </div>

          <div className="divide-y divide-gray-100">
            {activeNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 hover:bg-gray-50 transition-colors animate-pulse"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 text-sm">
                    {notification.order.id}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                      {notification.repeatCount + 1}/{config.maxRepeats}
                    </span>
                    <button
                      onClick={() => markAsViewed(notification.id)}
                      className="p-1 hover:bg-blue-100 text-blue-600 rounded-full transition-colors"
                      title="Marcar como visualizado"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Cliente:</strong> {notification.order.customerName}</p>
                  <p><strong>Total:</strong> R$ {notification.order.total.toFixed(2)}</p>
                  <p><strong>Horário:</strong> {notification.order.createdAt.toLocaleTimeString('pt-BR')}</p>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  🔔 Repetindo a cada {config.repeatInterval / 1000}s
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}