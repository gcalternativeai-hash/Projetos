import React from 'react';
import { X, Plus, Minus, ShoppingBag, AlertTriangle, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useOrder } from '../contexts/OrderContext';
import { useAdmin } from '../contexts/AdminContext';
import { isStoreOpen } from '../utils/storeStatus';

export function Cart() {
  const { state, dispatch, totalItems, totalPrice, deliveryFee, finalTotal } = useCart();
  const { dispatch: orderDispatch, state: orderState } = useOrder();
  const { state: adminState } = useAdmin();
  const storeOpen = isStoreOpen(adminState.settings.operatingHours);

  if (!state.isOpen) return null;

  
  // Mova esta linha para cá, antes do return principal
  const hasActiveOrder = orderState.currentOrder &&
                         orderState.currentOrder.status !== 'entregue' &&
                         orderState.currentOrder.status !== 'pronto_para_retirada';

  const isCheckoutDisabled = hasActiveOrder || totalItems === 0 || !storeOpen;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={() => dispatch({ type: 'CLOSE_CART' })}
      />
      
      {/* Cart Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out dark:bg-gray-900">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-red-50 dark:bg-red-900 dark:border-red-700">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2 dark:text-gray-100">
              <ShoppingBag size={20} className="text-red-500" />
              <span>Meu Pedido ({totalItems})</span>
            </h2>
            <button
              onClick={() => dispatch({ type: 'CLOSE_CART' })}
              className="p-2 hover:bg-orange-100 rounded-full transition-colors dark:hover:bg-red-800 dark:text-gray-300"
            >
              <X size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Warning Notice */}
          <div className="p-4 bg-amber-50 border-l-4 border-amber-400 dark:bg-amber-900 dark:border-amber-700">
            <div className="flex items-start space-x-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium dark:text-amber-200">
                  ⚠️ Aviso importante!
                </p>
                <p className="text-xs text-amber-700 mt-1 dark:text-amber-100">
                  Os dados do pedido não serão salvos se a página for recarregada.
                </p>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {state.items.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 dark:bg-gray-700">
                  <ShoppingBag size={32} className="text-gray-300 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 text-lg font-medium dark:text-gray-300">Seu carrinho está vazio</p>
                <p className="text-gray-400 text-sm mt-2 dark:text-gray-400">
                  Adicione alguns de nossos lanches deliciosos para começar!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 truncate dark:text-gray-100">{item.product.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">R$ {item.product.price.toFixed(2)} cada</p>
                      <p className="text-sm text-red-600 font-medium dark:text-red-400">
                        Subtotal: R$ {(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => dispatch({
                          type: 'UPDATE_QUANTITY',
                          payload: { id: item.product.id, quantity: item.quantity - 1 }
                        })}
                        className="p-1 hover:bg-red-100 text-red-500 rounded-full transition-colors dark:hover:bg-red-900 dark:text-red-400"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium bg-white px-2 py-1 rounded dark:bg-gray-600 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => dispatch({
                          type: 'UPDATE_QUANTITY',
                          payload: { id: item.product.id, quantity: item.quantity + 1 }
                        })}
                        className="p-1 hover:bg-green-100 text-green-500 rounded-full transition-colors dark:hover:bg-green-900 dark:text-green-400"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.product.id })}
                      className="p-1 hover:bg-red-100 text-red-500 rounded-full transition-colors dark:hover:bg-red-900 dark:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {state.items.length > 0 && (
            <div className="border-t p-4 space-y-3 bg-gray-50 dark:border-gray-700 dark:bg-black">
              <div className="flex justify-between text-sm dark:text-gray-200">
                <span>Subtotal ({totalItems} itens):</span>
                <span className="font-medium">R$ {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm dark:text-gray-200">
                <span>Taxa de entrega:</span>
                <span className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-600 dark:text-gray-300'}`}>
                  {deliveryFee === 0 ? 'Grátis!' : `R$ ${deliveryFee.toFixed(2)}`}
                </span>
              </div>
               {/*
              {deliveryFee === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-xs text-green-700 text-center">
                    🎉 Parabéns! Você ganhou frete grátis por ter 5+ itens!
                  </p>
                </div>
              )}
              {totalItems < 5 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-xs text-blue-700 text-center">
                    💡 Adicione mais {5 - totalItems} iten(s) e ganhe frete grátis!
                  </p>
                </div>
              )}
              */}
              <div className="flex justify-between font-bold text-lg border-t pt-3 dark:text-gray-100 dark:border-gray-700">
                <span>Total:</span>
                <span className="text-red-600">R$ {finalTotal.toFixed(2)}</span>
              </div>

{hasActiveOrder && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 dark:bg-red-900 dark:border-red-700">
            <p className="text-xs text-red-700 text-center dark:text-red-100">
              ⚠️ Você já tem um pedido ativo. Acompanhe-o ou aguarde a entrega antes de fazer um novo.
            </p>
          </div>
        )}

               {!storeOpen && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 dark:bg-red-900 dark:border-red-700">
                  <p className="text-xs text-red-700 text-center font-medium dark:text-red-100">
                    🚫 Loja Fechada. Pedidos não podem ser finalizados no momento.
                  </p>
                </div>
              )}
              
              <button 
                onClick={() => {
                  dispatch({ type: 'CLOSE_CART' });
                  orderDispatch({ type: 'SHOW_ORDER_FORM' });
                }}
                 disabled={isCheckoutDisabled}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
              >
                🛒 Finalizar Pedido
              </button>
              <button 
                onClick={() => dispatch({ type: 'CLEAR_CART' })}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors text-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
              >
                Limpar Carrinho
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}