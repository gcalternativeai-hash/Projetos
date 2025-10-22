import { CheckCircle } from 'lucide-react';
import { Service } from '../types';
import { useEffect } from "react";

interface ConfirmationPageProps {
  onNavigate: (page: string) => void;
  bookingDetails: {
    service: Service;
    date: string;
    time: string;
    customerName: string;
    customerWhatsapp: string;
  };
}

export function ConfirmationPage({ onNavigate, bookingDetails }: ConfirmationPageProps) {
  // Recupera dados do localStorage se o estado tiver se perdido
  useEffect(() => {
    if (!bookingDetails) {
      const savedData = localStorage.getItem('bookingConfirmation');
      if (savedData) {
        JSON.parse(savedData);
      }
    }

    // Limpa dados antigos depois que a página é carregada
    return () => {
      localStorage.removeItem('bookingConfirmation');
    };
  }, []);

  if (!bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Carregando dados da confirmação...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Agendamento Concluído!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Seu pedido foi confirmado com sucesso! 🎉
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg text-left">
          <p><strong>Serviço:</strong> {bookingDetails.service.name}</p>
          <p><strong>Data:</strong> {bookingDetails.date}</p>
          <p><strong>Hora:</strong> {bookingDetails.time}</p>
          <p><strong>Nome:</strong> {bookingDetails.customerName}</p>
          <p><strong>WhatsApp:</strong> {bookingDetails.customerWhatsapp}</p>
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-gray-700 dark:text-gray-300 text-lg">
            Deseja fazer outro agendamento?
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              Novo Agendamento
            </button>

            <button
              onClick={() => window.open(`https://wa.me/${bookingDetails.customerWhatsapp}`, '_blank')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Abrir no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
