import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Service, BusinessSettings, Appointment } from '../types';
import {
  formatDate,
  formatDateForDB,
  generateTimeSlots,
  isDateUnavailable,
  isTimeSlotAvailable,
} from '../utils/dateUtils';
import { generateWhatsAppLink } from '../utils/whatsappUtils';

interface BookingPageProps {
  onNavigate: (page: string, data?: any) => void;
  serviceId: string;
}

export function BookingPage({ onNavigate, serviceId }: BookingPageProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [servicesRes, settingsRes, appointmentsRes] = await Promise.all([
        supabase.from('services').select('*').eq('active', true).order('price'),
        supabase.from('business_settings').select('*').limit(1).single(),
        supabase.from('appointments').select('*').gte('appointment_date', formatDateForDB(new Date())),
      ]);

      if (servicesRes.data) setServices(servicesRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (services.length > 0 && serviceId) {
      const service = services.find((s) => s.id === serviceId);
      if (service) setSelectedService(service);
    }
  }, [services, serviceId]);

  function getDaysInMonth(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Preenche com dias do mês anterior para alinhar o calendário
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, -firstDay.getDay() + i + 1));
    }

    // Dias do mês atual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }

  function getAvailableTimeSlots(): string[] {
    if (!settings || !selectedService || !selectedDate) return [];

    const slots = generateTimeSlots(
      settings.work_start_time.slice(0, 5),
      settings.work_end_time.slice(0, 5),
      settings.slot_interval_minutes,
      selectedService.duration_minutes
    );

    return slots.filter((slot) => isTimeSlotAvailable(selectedDate, slot, appointments));
  }

  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime || !customerName || !customerWhatsapp) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('appointments').insert([
        {
          service_id: selectedService.id,
          customer_name: customerName,
          customer_whatsapp: customerWhatsapp,
          appointment_date: formatDateForDB(selectedDate),
          appointment_time: selectedTime,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      const whatsappLink = generateWhatsAppLink(
        settings?.whatsapp_number || '',
        customerName,
        formatDate(selectedDate),
        selectedTime
      );

      const confirmationData = {
        serviceName: selectedService.name,
        date: formatDate(selectedDate),
        time: selectedTime,
        price: selectedService.price,
        whatsappLink,
        customerName,
      };

      onNavigate('confirmation', confirmationData);
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      alert('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!serviceId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        <p>Nenhum serviço selecionado. Volte e escolha um serviço primeiro.</p>
      </div>
    );
  }

  if (loading || !selectedService) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-300">
        Carregando...
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);
  const timeSlots = getAvailableTimeSlots();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => onNavigate('services')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Agendar: {selectedService.name}
          </h1>

          {/* Etapa 1 - Escolher Data */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 text-center">
                Escolha uma data
              </h2>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const disabled = isDateUnavailable(day);
                  return (
                    <button
                      key={index}
                      onClick={() => !disabled && setSelectedDate(day)}
                      disabled={disabled}
                      className={`p-2 rounded-lg text-center transition-colors ${
                        selectedDate && day.toDateString() === selectedDate.toDateString()
                          ? 'bg-blue-600 text-white'
                          : disabled
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <button
                  onClick={() => setStep(2)}
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Continuar
                </button>
              )}
            </div>
          )}

          {/* Etapa 2 - Escolher Hora */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 text-center">
                Escolha o horário
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {timeSlots.length > 0 ? (
                  timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`px-4 py-2 rounded-lg border ${
                        selectedTime === slot
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900'
                      }`}
                    >
                      <Clock className="inline-block w-4 h-4 mr-1" />
                      {slot}
                    </button>
                  ))
                ) : (
                  <p className="col-span-3 text-center text-gray-500 dark:text-gray-400">
                    Nenhum horário disponível.
                  </p>
                )}
              </div>

              {selectedTime && (
                <button
                  onClick={() => setStep(3)}
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Continuar
                </button>
              )}
            </div>
          )}

          {/* Etapa 3 - Dados do Cliente */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-4">
                Seus dados
              </h2>

              <input
                type="text"
                placeholder="Seu nome"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200"
              />

              <input
                type="text"
                placeholder="WhatsApp"
                value={customerWhatsapp}
                onChange={(e) => setCustomerWhatsapp(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200"
              />

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Confirmar Agendamento</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
