import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { OrderData, OrderStatus } from '../types/order';

const ORDERS_STORAGE_KEY = 'emporio-pastel-pedidos';
const CURRENT_ORDER_STORAGE_KEY = 'emporio-pastel-pedido-atual';

// Helper functions for localStorage
const saveOrdersToStorage = (orders: OrderData[]) => {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error('Erro ao salvar pedidos:', error);
    return false;
  }
};

const loadOrdersFromStorage = (): OrderData[] => {
  try {
    const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (saved) {
      const orders = JSON.parse(saved);
      // Convert date strings back to Date objects
      return orders.map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        estimatedDelivery: new Date(order.estimatedDelivery)
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    return [];
  }
};

const saveCurrentOrderToStorage = (order: OrderData | null) => {
  try {
    if (order) {
      localStorage.setItem(CURRENT_ORDER_STORAGE_KEY, JSON.stringify({
        ...order,
        createdAt: order.createdAt.toISOString(),
        estimatedDelivery: order.estimatedDelivery.toISOString()
      }));
    } else {
      localStorage.removeItem(CURRENT_ORDER_STORAGE_KEY);
    }
    return true;
  } catch (error) {
    console.error('Erro ao salvar pedido atual:', error);
    return false;
  }
};

const loadCurrentOrderFromStorage = (): OrderData | null => {
  try {
    const saved = localStorage.getItem(CURRENT_ORDER_STORAGE_KEY);
    if (saved) {
      const order = JSON.parse(saved);
      return {
        ...order,
        createdAt: new Date(order.createdAt),
        estimatedDelivery: new Date(order.estimatedDelivery)
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao carregar pedido atual:', error);
    return null;
  }
};

interface OrderState {
  currentOrder: OrderData | null;
  orderHistory: OrderStatus[];
  isLoading: boolean;
  showOrderForm: boolean;
  showTracking: boolean;
}

type OrderAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SHOW_ORDER_FORM' }
  | { type: 'HIDE_ORDER_FORM' }
  | { type: 'SHOW_TRACKING' }
  | { type: 'HIDE_TRACKING' }
  | { type: 'CREATE_ORDER'; payload: OrderData }
  | { type: 'UPDATE_ORDER_STATUS'; payload: OrderStatus }
  | { type: 'CLEAR_ORDER' }
  | { type: 'UPDATE_ORDER'; payload: OrderData }
  | { type: 'RESTORE_CURRENT_ORDER'; payload: OrderData | null };

const initialState: OrderState = {
  currentOrder: null,
  orderHistory: [],
  isLoading: false,
  showOrderForm: false,
  showTracking: false
};

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SHOW_ORDER_FORM':
      return { ...state, showOrderForm: true, showTracking: false };

    case 'HIDE_ORDER_FORM':
      return { ...state, showOrderForm: false };

    case 'SHOW_TRACKING':
      return { ...state, showTracking: true, showOrderForm: false };

    case 'HIDE_TRACKING':
      return { ...state, showTracking: false };

    case 'CREATE_ORDER':
      saveCurrentOrderToStorage(action.payload);
      return {
        ...state,
        currentOrder: action.payload,
        orderHistory: [{
          status: 'recebido',
          timestamp: new Date(),
          description: 'Pedido recebido e confirmado'
        }],
        showOrderForm: false,
        showTracking: true
      };

    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orderHistory: [...state.orderHistory, action.payload],
        currentOrder: state.currentOrder ? {
          ...state.currentOrder,
          status: action.payload.status
        } : null
      };

    case 'UPDATE_ORDER':
     // Atualiza o pedido atual se for o mesmo ID
      if (state.currentOrder?.id === action.payload.id) {
        // Sempre salve o pedido atualizado no localStorage
        saveCurrentOrderToStorage(action.payload);
        return {
          ...state,
          currentOrder: action.payload // Atualiza o pedido no estado
        };
      }
      // Se o currentOrder.id não corresponder, retorna o estado inalterado
      return state;

    case 'CLEAR_ORDER':
      saveCurrentOrderToStorage(null);
      return {
        ...state,
        currentOrder: null,
        orderHistory: [],
        showTracking: false
      };

    case 'RESTORE_CURRENT_ORDER':
      return {
        ...state,
        currentOrder: action.payload
      };

    default: // Este é o caso padrão do switch, e ele deve estar DENTRO do switch
      return state;
  }
}

interface OrderContextType {
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  // Load orders from localStorage on mount
  React.useEffect(() => {
    const savedCurrentOrder = loadCurrentOrderFromStorage();
    if (savedCurrentOrder) {
      dispatch({ type: 'RESTORE_CURRENT_ORDER', payload: savedCurrentOrder });
    }
  }, []);

  return (
    <OrderContext.Provider value={{ state, dispatch }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}