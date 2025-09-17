// src/hooks/useOrderNotifications.ts

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, PedidoSupabase } from '../lib/supabase';
import { OrderData } from '../types/order';
import React from 'react';

// Configurações das notificações - ajustadas para suas especificações
const NOTIFICATION_CONFIG = {
  repeatInterval: 5000, // 5 segundos
  maxRepeats: 4, // 3 tentativas
  soundEnabled: true,
  visualEnabled: true,
  soundFile: '/sounds/notificacao_umami.mp3' // Caminho para seu arquivo de som personalizado
};

// Chave para armazenar a preferência de notificação no localStorage
const NOTIFICATION_ENABLED_STORAGE_KEY = 'notification_enabled';

interface NotificationState {
  id: string;
  order: OrderData;
  repeatCount: number;
  isActive: boolean;
  intervalId?: NodeJS.Timeout;
}

/**
 * Hook para gerenciar notificações de novos pedidos - APENAS PARA ADMIN
 * Notifica 3 vezes com intervalos de 5 segundos até o status mudar
 */
export function useOrderNotifications() {
  // Inicializa isEnabled lendo do localStorage, ou com true se não houver nada salvo
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(NOTIFICATION_ENABLED_STORAGE_KEY);
      return saved === 'true'; // Converte a string 'true' para boolean true, caso contrário false
    }
    return true; // Padrão se não estiver no ambiente do navegador
  });

  // ADICIONE ESTA LINHA:
  const [activeNotifications, setActiveNotifications] = useState<NotificationState[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);


  const triggerAudioUnlock = React.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0; // Temporariamente silencioso
      audioRef.current.play().then(() => {
        audioRef.current!.pause();
        audioRef.current!.currentTime = 0;
        audioRef.current!.volume = 0.8; // Restaurar volume original
        console.log('🔊 Áudio desbloqueado com sucesso.');
      }).catch(error => {
        console.warn('Erro ao tentar desbloquear áudio:', error);
      });
    }
  }, []);


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

    return {
      id: pedido.id!,
      customerName: pedido.nome,
      phone: pedido.telefone,
      address: pedido.endereco || 'Endereço não informado',
      paymentMethod: 'pix' as const,
      observations: pedido.adicionais || '',
      items,
      subtotal: pedido.valor_total,
      deliveryFee: 0,
      total: pedido.valor_total,
      status: (pedido.status || 'pendente') as OrderData['status'],
      createdAt: pedido.data_pedido ? new Date(pedido.data_pedido) : new Date(),
      estimatedDelivery: pedido.data_pedido ? new Date(new Date(pedido.data_pedido).getTime() + 45 * 60 * 1000) : new Date(),
      type: (pedido.type || 'delivery') as 'delivery' | 'pickup' // Adicione 'type' aqui se ainda não estiver
    };
  }, []);

  // Inicializar áudio personalizado
  useEffect(() => {
    if (NOTIFICATION_CONFIG.soundEnabled) {
      try {
        const audio = new Audio(NOTIFICATION_CONFIG.soundFile);
        audio.preload = 'auto';
        audio.volume = 0.8; // Volume alto para garantir que seja ouvido
        audioRef.current = audio;

        console.log('🔊 Áudio personalizado carregado:', NOTIFICATION_CONFIG.soundFile);
      } catch (error) {
        console.warn('⚠️ Erro ao carregar áudio personalizado:', error);
        // Fallback para beep sintético se o arquivo não existir
        audioRef.current = null;
      }
    }
  }, []);

  // Persistir o estado isEnabled no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFICATION_ENABLED_STORAGE_KEY, String(isEnabled));
    }
  }, [isEnabled]);

  // Tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (!NOTIFICATION_CONFIG.soundEnabled) return;

    try {
      if (audioRef.current) {
        // Resetar o áudio para o início caso já esteja tocando
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          console.warn('Erro ao tocar áudio personalizado:', error);
        });
      } else {
        // Fallback: criar beep sintético
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
      }
    } catch (error) {
      console.warn('Não foi possível tocar o som de notificação:', error);
    }
  }, []);

  // Mostrar notificação do navegador
  const showBrowserNotification = useCallback((order: OrderData) => {
    if (!NOTIFICATION_CONFIG.visualEnabled) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🍥 NOVO PEDIDO RECEBIDO!', {
        body: `Cliente: ${order.customerName}\nTotal: R$ ${order.total.toFixed(2)}\nPedido: ${order.id}`,
        icon: '/favicon.ico',
        tag: `order-${order.id}`,
        requireInteraction: true, // Mantém a notificação até interação
        silent: false // Permite som da notificação do sistema
      });

      // Auto-fechar após 10 segundos se não houver interação
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  }, []);

  // Criar nova notificação
  const createNotification = useCallback((order: OrderData) => {
    console.log('🔔 Criando notificação para pedido:', order.id);

    // Verificar se já existe notificação para este pedido
    // Use a função de atualização para acessar o estado mais recente
    setActiveNotifications(current => { // <--- Início do callback de setActiveNotifications
      const existingNotification = current.find(n => n.id === order.id);
      if (existingNotification) {
        console.log('⚠️ Notificação já existe para pedido:', order.id);
        return current; // Retorna o estado atual sem modificação
      }

      // Tocar som imediatamente
      playNotificationSound();

      // Mostrar notificação visual
      showBrowserNotification(order);

      // Criar estado da notificação
      const notification: NotificationState = {
        id: order.id,
        order,
        repeatCount: 0,
        isActive: true
      };

      // Configurar repetição automática
      const intervalId = setInterval(() => {
        setActiveNotifications(currentRepeat => { // <--- Início do callback interno de setActiveNotifications
          const existing = currentRepeat.find(n => n.id === order.id);
          if (!existing || !existing.isActive) {
            clearInterval(intervalId);
            return currentRepeat;
          }

          // Verificar se atingiu o máximo de repetições
          if (existing.repeatCount >= NOTIFICATION_CONFIG.maxRepeats - 1) {
            console.log('🔕 Máximo de repetições atingido para pedido:', order.id);
            clearInterval(intervalId);
            return currentRepeat.map(n =>
              n.id === order.id ? { ...n, isActive: false } : n
            );
          }

          // Tocar som e mostrar notificação novamente
          playNotificationSound();
          showBrowserNotification(order);

          console.log(`🔔 Repetindo notificação ${existing.repeatCount + 1}/${NOTIFICATION_CONFIG.maxRepeats} para pedido:`, order.id);

          return currentRepeat.map(n =>
            n.id === order.id
              ? { ...n, repeatCount: n.repeatCount + 1 }
              : n
          );
        }); // <--- Fim do callback interno de setActiveNotifications
      }, NOTIFICATION_CONFIG.repeatInterval);

      notification.intervalId = intervalId;

      // Adicionar à lista de notificações ativas
      return [...current, notification]; // Adiciona a nova notificação
    }); // <--- Fim do callback de setActiveNotifications
  }, [playNotificationSound, showBrowserNotification]); // <--- Dependências do useCallback

  // Marcar pedido como visualizado (para notificação)
  const markAsViewed = useCallback((orderId: string) => {
    console.log('👁️ Marcando pedido como visualizado:', orderId);

    setActiveNotifications(current => {
      const notification = current.find(n => n.id === orderId);
      if (notification?.intervalId) {
        clearInterval(notification.intervalId);
      }

      return current.map(n =>
        n.id === orderId
          ? { ...n, isActive: false }
          : n
      );
    });
  }, []);

  // Parar todas as notificações
  const stopAllNotifications = useCallback(() => {
    console.log('🔕 Parando todas as notificações');

    setActiveNotifications(current => {
      current.forEach(notification => {
        if (notification.intervalId) {
          clearInterval(notification.intervalId);
        }
      });
      return []; // Limpa todas as notificações
    });
  }, []);

  // Configurar listener para novos pedidos - APENAS PARA ADMIN
  useEffect(() => {
    if (!isEnabled) return;

    console.log('🎧 Configurando listener para novos pedidos (ADMIN)...');

    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📱 Permissão para notificações:', permission);
      });
    }

    // Configurar subscription para novos pedidos
    const channel = supabase
      .channel('admin-new-orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('🆕 Novo pedido detectado (ADMIN):', payload);

          if (payload.new) {
            const newOrder = convertSupabaseToOrder(payload.new as PedidoSupabase);
            createNotification(newOrder);
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
          console.log('🔄 Pedido atualizado (ADMIN):', payload);

          if (payload.new) {
            const updatedOrder = convertSupabaseToOrder(payload.new as PedidoSupabase);

            // Se o status mudou de 'pendente' para qualquer outro, parar notificação
            if (updatedOrder.status !== 'pendente') {
              console.log('✅ Status alterado, parando notificação para pedido:', updatedOrder.id);
              markAsViewed(updatedOrder.id);
            }
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🧹 Limpando listener de notificações (ADMIN)');
      supabase.removeChannel(channel);
      // Não chame stopAllNotifications aqui, pois ele limpa o estado
      // e pode causar re-renderizações indesejadas se o componente
      // for montado/desmontado rapidamente.
    };
  }, [isEnabled, convertSupabaseToOrder, createNotification, markAsViewed]);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      activeNotifications.forEach(notification => {
        if (notification.intervalId) {
          clearInterval(notification.intervalId);
        }
      });
    };
  }, [activeNotifications]); // activeNotifications precisa estar aqui para limpar intervalos

  return {
    activeNotifications: activeNotifications.filter(n => n.isActive),
    isEnabled,
    setIsEnabled,
    markAsViewed,
    stopAllNotifications,
    config: NOTIFICATION_CONFIG, // <--- LINHA CORRIGIDA
    triggerAudioUnlock
  };
}
