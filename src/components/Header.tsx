import React from 'react';
import { ShoppingCart, Menu, Phone, MapPin, Clock, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useOrder } from '../contexts/OrderContext';
import { useAdmin } from '../contexts/AdminContext'; // Adicione esta linha
import { ThemeToggle } from './ThemeToggle';
import { isStoreOpen, getNextOpeningTime } from '../utils/storeStatus';

export function Header() {
  const { totalItems, dispatch } = useCart();
  const { state: orderState, dispatch: orderDispatch } = useOrder();
   const { state: adminState } = useAdmin(); // <--- ADICIONE OU VERIFIQUE ESTA LINHA

  const storeOpen = isStoreOpen(adminState.settings.operatingHours);
  const nextOpening = getNextOpeningTime(adminState.settings.operatingHours);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg dark:bg-gray-900 dark:shadow-none">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/images/OnzyLogo.png"
              alt="Sua Logo"
              className="h 20 sm:h-10 w-auto"
            />
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#cardapio" className="text-gray-700 hover:text-red-500 transition-colors dark:text-gray-300 dark:hover:text-red-400">
              Cardápio
            </a>
            {orderState.currentOrder && (
              <button
                onClick={() => orderDispatch({ type: 'SHOW_TRACKING' })}
                className="text-gray-700 hover:text-red-500 transition-colors flex items-center space-x-1 dark:text-gray-300 dark:hover:text-red-400"
              >
                <Package size={16} />
                <span>Acompanhar</span>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-1">
                  {orderState.currentOrder.id}
                </span>
              </button>
            )}
            <a href="#contato" className="text-gray-700 hover:text-red-500 transition-colors dark:text-gray-300 dark:hover:text-red-400">
              Contato
            </a>
            <a href="#horario" className="text-gray-700 hover:text-red-500 transition-colors dark:text-gray-300 dark:hover:text-red-400">
              Horário
            </a>
          </nav>

          {/* Cart Button */}
          <div className="flex items-center space-x-2">
            {orderState.currentOrder && (
              <button
                onClick={() => orderDispatch({ type: 'SHOW_TRACKING' })}
                className="md:hidden bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm rounded-full flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                title={`Acompanhar pedido ${orderState.currentOrder.id}`}
              >
                <Package size={20} />
                <span>Acompanhar</span> {/* Adicionado para mobile */}
              </button>
            )}
            
            <ThemeToggle />
            
          <button
            onClick={() => dispatch({ type: 'TOGGLE_CART' })}
            className="relative bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base rounded-full flex items-center space-x-2 transition-all duration-200 hover:scale-105"
          >
            <ShoppingCart size={20} />
            <span className="hidden sm:inline">Meu Pedido</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
                {totalItems}
              </span>
            )}
          </button>

            
          </div>
        </div>

        {/* Info Bar */}
        <div className="mt-2 flex flex-col sm:flex-row items-center justify-center sm:space-x-4 space-y-0.5 sm:space-y-0 text-xs sm:text-sm text-gray-600 text-center dark:text-gray-400">
          <div className="flex items-center justify-center space-x-2">
    <a 
      href={`tel:${adminState.settings.storePhone.replace(/\D/g, '')}`}
      className="flex items-center space-x-0.5 hover:text-red-500 transition-colors dark:hover:text-red-400"
    >
      <Phone size={16} />
      <span>{adminState.settings.storePhone}</span>
    </a>
    <a 
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adminState.settings.storeAddress)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center space-x-0.5 hover:text-red-500 transition-colors dark:hover:text-red-400"
    >
      <MapPin size={16} />
      <span>{adminState.settings.storeAddress}</span>
    </a>
  </div>
          <div className="mt-2 text-center">
          {storeOpen ? (
            <p className="text-green-600 font-semibold text-sm dark:text-green-400">
              🎉 Estamos Abertos! Faça seu pedido!
            </p>
          ) : (
            <p className="text-red-600 font-semibold text-sm dark:text-red-400">
              Loja Fechada. {nextOpening ? `Abre ${nextOpening}.` : 'Verifique os horários de funcionamento.'}
            </p>
          )}
        </div>
          
          <div className="flex items-center space-x-1 hover:text-red-500 transition-colors dark:hover:text-red-400">
            <Clock size={16} />
            <span>Terç-Dom: 18h às 00h</span>
          </div>
        </div>
      </div>
    </header>
  );
}
