import React from 'react';
import { X, Printer, Check } from 'lucide-react';
import { OrderData } from '../types/order';
import { printComanda } from '../utils/printComanda';
import { useAdmin } from '../contexts/AdminContext'; // <--- ADICIONE ESTA LINHA

interface PrintConfirmationModalProps {
  order: OrderData;
  isOpen: boolean;
  onConfirm: (shouldPrint: boolean) => void;
  onCancel: () => void;
}

export function PrintConfirmationModal({ 
  order, 
  isOpen, 
  onConfirm, 
  onCancel 
}: PrintConfirmationModalProps) {
  const { state: adminState } = useAdmin(); // <--- ADICIONE ESTA LINHA
  if (!isOpen) return null;

  const handlePrintAndFinish = () => {
    // Chama nova função de impressão no clique do usuário
    printComanda(order, {
      storeName: adminState.settings.storeName,
      storeAddress: adminState.settings.storeAddress,
      storePhone: adminState.settings.storePhone
    });
    // Aguarda delay para garantir que a impressão foi iniciada
    setTimeout(() => {
      onConfirm(true);
    }, 500);
  };

  const handleFinishOnly = () => {
    onConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <Printer size={20} className="text-blue-500" />
              <span>Finalizar Pedido</span>
            </h3>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Printer size={24} className="text-yellow-600" />
              </div>
              
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Deseja imprimir antes de finalizar?
              </h4>
              
              <p className="text-gray-600 text-sm mb-4">
                O pedido <strong>{order.id}</strong> será marcado como <strong>Entregue</strong>.
                <br />
                Após finalizar, não será mais possível imprimir a comanda.
              </p>

              <div className="bg-blue-50 p-3 rounded-lg text-left">
                <p className="text-sm text-blue-800">
                  <strong>Cliente:</strong> {order.customerName}
                  <br />
                  <strong>Total:</strong> R$ {order.total.toFixed(2)}
                  <br />
                  <strong>Itens:</strong> {order.items.length} produto(s)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={handlePrintAndFinish}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium"
              >
                <Printer size={18} />
                <span>Sim, imprimir e finalizar</span>
              </button>
              
              <button
                onClick={handleFinishOnly}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium"
              >
                <Check size={18} />
                <span>Não, apenas finalizar</span>
              </button>
              
              <button
                onClick={onCancel}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}