import React, { useState } from 'react';
import { Save, RotateCcw, Clock, MapPin, Phone, Store, X, Plus } from 'lucide-react';
import { useAdmin, AdminSettings as AdminContextSettings } from '../contexts/AdminContext';
import { OperatingDay, TimePeriod } from '../lib/supabase';

// Define a default structure for operatingHours to ensure consistency
const defaultOperatingHours: OperatingDay[] = [
  { day: 'sunday', open: false, periods: [] },
  { day: 'monday', open: false, periods: [] },
  { day: 'tuesday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
  { day: 'wednesday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
  { day: 'thursday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
  { day: 'friday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
  { day: 'saturday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
];

export function AdminSettings() {
  const { state, dispatch, saveSettingsToSupabase } = useAdmin();
  
  // Initialize local settings state, ensuring operatingHours is always present
  const [settings, setSettings] = useState<AdminContextSettings>(() => {
    // Merge current admin state settings with defaults for operatingHours
    return {
      ...state.settings,
      operatingHours: state.settings.operatingHours || defaultOperatingHours
    };
  });
  const [hasChanges, setHasChanges] = useState(false);

  const dayNamesMap: { [key: string]: string } = {
    sunday: 'Domingo',
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleOperatingDayChange = (day: OperatingDay['day'], field: 'open' | 'periods', value: any) => {
    setSettings(prev => {
      const updatedOperatingHours = prev.operatingHours.map(oh => {
        if (oh.day === day) {
          if (field === 'open') {
            return { ...oh, open: value };
          } else if (field === 'periods') {
            return { ...oh, periods: value };
          }
        }
        return oh;
      });
      return { ...prev, operatingHours: updatedOperatingHours };
    });
    setHasChanges(true);
  };

  const handlePeriodChange = (day: OperatingDay['day'], periodIndex: number, field: 'from' | 'to', value: string) => {
    setSettings(prev => {
      const updatedOperatingHours = prev.operatingHours.map(oh => {
        if (oh.day === day) {
          const updatedPeriods = oh.periods.map((period, idx) => {
            if (idx === periodIndex) {
              return { ...period, [field]: value };
            }
            return period;
          });
          return { ...oh, periods: updatedPeriods };
        }
        return oh;
      });
      return { ...prev, operatingHours: updatedOperatingHours };
    });
    setHasChanges(true);
  };

  const addPeriod = (day: OperatingDay['day']) => {
    setSettings(prev => {
      const updatedOperatingHours = prev.operatingHours.map(oh => {
        if (oh.day === day) {
          return { ...oh, periods: [...oh.periods, { from: '09:00', to: '18:00' }] };
        }
        return oh;
      });
      return { ...prev, operatingHours: updatedOperatingHours };
    });
    setHasChanges(true);
  };

  const removePeriod = (day: OperatingDay['day'], periodIndex: number) => {
    setSettings(prev => {
      const updatedOperatingHours = prev.operatingHours.map(oh => {
        if (oh.day === day) {
          return { ...oh, periods: oh.periods.filter((_, idx) => idx !== periodIndex) };
        }
        return oh;
      });
      return { ...prev, operatingHours: updatedOperatingHours };
    });
    setHasChanges(true);
  };

  // Add a useEffect to update local settings if adminState.settings changes (e.g., after initial load)
  React.useEffect(() => {
    setSettings(prevSettings => ({
      ...state.settings,
      operatingHours: state.settings.operatingHours || defaultOperatingHours
    }));
    setHasChanges(false); // Reset hasChanges when external state updates
  }, [state.settings]); // Depend on the admin context's settings state

  const handleSave = () => {
    // Primeiro atualiza o estado local do AdminContext
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    
    // Depois salva no Supabase, passando as configurações mais recentes diretamente
    saveSettingsToSupabase(settings).then(success => { // <--- ALTERADO AQUI
      if (success) {
        dispatch({
          type: 'ADD_TO_HISTORY',
          payload: { action: 'Configurações salvas no Supabase', data: settings }
        });
        setHasChanges(false);
      }
    });
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja reverter todas as alterações?')) {
      setSettings(state.settings);
      setHasChanges(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h2>
        {hasChanges && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              disabled={state.settingsLoading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <RotateCcw size={18} />
              <span>Reverter</span>
            </button>
            <button
              onClick={handleSave}
              disabled={state.settingsLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              {state.settingsLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Salvar no Supabase</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Store size={20} className="text-red-500" />
            <span>Informações da Loja</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Loja
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Nome da sua loja"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-1" />
                Telefone
              </label>
              <input
                type="tel"
                value={settings.storePhone}
                onChange={(e) => handleInputChange('storePhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="(73) 9 8819-9938"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 WhatsApp para Pedidos
              </label>
              <input
                type="tel"
                value={settings.whatsappNumber}
                onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="+55 73 9198-9629"
              />
              <p className="text-xs text-gray-500 mt-1">
                Número que receberá os pedidos automaticamente
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Endereço
              </label>
              <textarea
                value={settings.storeAddress}
                onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
                placeholder="Endereço completo da loja"
              />
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Clock size={20} className="text-red-500" />
            <span>Configurações de Entrega</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Entrega (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.deliveryFee}
                onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Taxa cobrada para entregas (quando não há frete grátis)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frete Grátis a partir de (itens)
              </label>
              <input
                type="number"
                min="1"
                value={settings.freeDeliveryMinItems}
                onChange={(e) => handleInputChange('freeDeliveryMinItems', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Número mínimo de itens para frete grátis
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo de Preparo (minutos)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.preparationTime}
                onChange={(e) => handleInputChange('preparationTime', parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tempo estimado para preparar os pedidos
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Clock size={20} className="text-red-500" />
            <span>Horários de Funcionamento</span>
          </h3>
          <div className="space-y-4">
            {settings.operatingHours.map((daySchedule: OperatingDay) => (
              <div key={daySchedule.day} className="border p-3 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center space-x-2 text-gray-700 font-medium">
                    <input
                      type="checkbox"
                      checked={daySchedule.open}
                      onChange={(e) => handleOperatingDayChange(daySchedule.day, 'open', e.target.checked)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span>{dayNamesMap[daySchedule.day]}</span>
                  </label>
                </div>
                {daySchedule.open && (
                  <div className="space-y-2 mt-2">
                    {daySchedule.periods.map((period, periodIndex) => (
                      <div key={periodIndex} className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={period.from}
                          onChange={(e) => handlePeriodChange(daySchedule.day, periodIndex, 'from', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={period.to}
                          onChange={(e) => handlePeriodChange(daySchedule.day, periodIndex, 'to', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <button
                          type="button"
                          onClick={() => removePeriod(daySchedule.day, periodIndex)}
                          className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                          title="Remover período"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addPeriod(daySchedule.day)}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 rounded-lg text-sm flex items-center justify-center space-x-1 transition-colors mt-2"
                    >
                      <Plus size={16} />
                      <span>Adicionar Período</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      {/* Preview Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview das Configurações</h3>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Informações da Loja</h4>
              {state.settingsLoading && (
                <div className="flex items-center space-x-2 text-sm text-blue-600 mb-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span>Carregando do Supabase...</span>
                </div>
              )}
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Nome:</strong> {settings.storeName}</p>
                <p><strong>Telefone:</strong> {settings.storePhone}</p>
                <p><strong>WhatsApp:</strong> {settings.whatsappNumber}</p>
                <p><strong>Endereço:</strong> {settings.storeAddress}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Configurações de Entrega</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Taxa de entrega:</strong> R$ {settings.deliveryFee.toFixed(2)}</p>
                <p><strong>Frete grátis:</strong> {settings.freeDeliveryMinItems}+ itens</p>
                <p><strong>Tempo de preparo:</strong> {settings.preparationTime} minutos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
              <h4 className="font-medium text-gray-800 mb-2">Horários de Funcionamento</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {settings.operatingHours.map((daySchedule: OperatingDay) => (
                  <p key={daySchedule.day}>
                    <strong>{dayNamesMap[daySchedule.day]}:</strong>{' '}
                    {daySchedule.open
                      ? daySchedule.periods.length > 0
                        ? daySchedule.periods.map(p => `${p.from}-${p.to}`).join(', ')
                        : 'Aberto (sem horários definidos)'
                      : 'Fechado'}
                  </p>
                ))}
              </div>
            </div>

      {/* Change History */}
      {state.changeHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Histórico de Alterações</h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {state.changeHistory.slice(0, 5).map((change) => (
              <div key={change.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="text-sm font-medium text-gray-800">{change.action}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {change.timestamp.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {state.changeHistory.length > 5 && (
            <p className="text-xs text-gray-500 mt-2">
              E mais {state.changeHistory.length - 5} alterações...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
