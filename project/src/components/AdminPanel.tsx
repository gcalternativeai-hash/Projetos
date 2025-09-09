// src/components/AdminPanel.tsx
import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, Package, Settings, Download, Upload, Save, AlertTriangle, Trash2 } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext'; // Importe useAdmin
import { ProductManager } from './ProductManager';
import { CategoryManager } from './CategoryManager';
import { OrderManager } from './OrderManager';
import { Toast } from './Toast'; // Importe o componente Toast
import { AdminOrderNotifications } from './AdminOrderNotifications'; // Importe o componente de notificações
import { OrderNotificationManager } from './OrderNotificationManager'; // Importe o gerenciador de notificações
import { OrderData } from '../types/order'; // Importe a interface OrderData
import { useOrderNotifications } from '../hooks/useOrderNotifications'; // Importe o hook de notificações
import { AdminSettings } from './AdminSettings'; // <--- ESTA LINHA FOI ADICIONADA/CORRIGIDA

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  // Desestrutura todas as funções e estados necessários do useAdmin
  const { 
    state, 
    dispatch, 
    exportData, 
    importData, 
    saveSettingsToSupabase, 
    loadSettingsFromSupabase,
    saveCategoriesToSupabase, // Adicionado
    clearLocalData // Agora assíncrona
  } = useAdmin();
  
  const { activeNotifications } = useOrderNotifications(); // Ativar notificações no painel admin
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'settings'>('orders');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges]);

  // Carregar configurações do Supabase ao montar o AdminPanel
  useEffect(() => {
    if (state.isAuthenticated) {
      loadSettingsFromSupabase().then(result => {
        if (result) { // result é um boolean agora
          setToast({ message: 'Configurações carregadas do Supabase ✓', type: 'success' });
        }
      });
    }
  }, [state.isAuthenticated]);

  const handleClose = () => {
    if (state.hasUnsavedChanges) {
      const confirm = window.confirm('Você tem alterações não salvas. Deseja sair mesmo assim?');
      if (!confirm) return;
    }
    onClose();
  };

  const handleLogout = () => {
    const confirm = window.confirm('Tem certeza que deseja sair do painel admin?');
    if (confirm) {
      dispatch({ type: 'LOGOUT' });
      onClose();
    }
  };

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emporio-pastel-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setToast({ message: 'Dados exportados com sucesso!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Erro ao exportar dados', type: 'error' });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = e.target?.result as string;
            if (importData(jsonData)) {
              setToast({ message: 'Dados importados com sucesso!', type: 'success' });
            } else {
              setToast({ message: 'Formato de arquivo inválido', type: 'error' });
            }
          } catch (error) {
            setToast({ message: 'Erro ao importar dados', type: 'error' });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSave = async () => {
    setToast(null); // Limpa qualquer toast anterior
    let success = true;
    let errorMessage = '';

    try {
      const settingsSaved = await saveSettingsToSupabase(state.settings);
      if (!settingsSaved) {
        success = false;
        errorMessage += 'Erro ao salvar configurações. ';
      }
    } catch (e: any) {
      success = false;
      errorMessage += `Erro inesperado ao salvar configurações: ${e.message || 'Erro desconhecido'}. `;
      console.error("Erro durante o salvamento de configurações:", e);
    }

    try {
      const categoriesSaved = await saveCategoriesToSupabase(state.categories);
      if (!categoriesSaved) {
        success = false;
        errorMessage += 'Erro ao salvar categorias. ';
      }
    } catch (e: any) {
      success = false;
      errorMessage += `Erro inesperado ao salvar categorias: ${e.message || 'Erro desconhecido'}. `;
      console.error("Erro durante o salvamento de categorias:", e);
    }

    if (success) {
      dispatch({ type: 'MARK_SAVED' }); // Marca como salvo
      setToast({ message: 'Todos os dados salvos com sucesso!', type: 'success' });
    } else {
      setToast({ message: errorMessage || 'Erro ao salvar alguns dados', type: 'error' });
    }
  };

  const handleClearLocalData = async () => { // Agora assíncrona
    const confirm = window.confirm(
      'Tem certeza que deseja limpar todos os dados salvos localmente?\n\n' +
      'Esta ação irá:\n' +
      '• Apagar todos os produtos personalizados\n' + // Produtos são do Supabase, então isso é enganoso
      '• Resetar categorias para o padrão\n' +
      '• Restaurar configurações originais\n\n' +
      'Esta ação não pode ser desfeita!'
    );
    
    if (confirm) {
      const success = await clearLocalData(); // Aguardar a chamada assíncrona
      if (success) {
        setToast({ message: 'Dados locais limpos com sucesso!', type: 'success' });
      } else {
        setToast({ message: 'Erro ao limpar dados locais', type: 'error' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sistema de Notificações */}
      <OrderNotificationManager sector="admin" />
      
      {/* Admin Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield size={24} />
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
              {state.hasUnsavedChanges && (
                <div className="flex items-center space-x-1 bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs">
                  <AlertTriangle size={12} />
                  <span>Não salvo</span>
                </div>
              )}
              {/* Indicador de sessão persistente */}
              <div className="flex items-center space-x-1 bg-green-500 text-green-900 px-2 py-1 rounded-full text-xs">
                <span>🔐</span>
                <span>Sessão Ativa</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Notificações de Pedidos em Tempo Real */}
              <AdminOrderNotifications 
                onOrderSelect={(order) => {
                  setSelectedOrder(order);
                  setActiveTab('orders');
                }}
              />
              
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm flex items-center space-x-1 transition-colors"
              >
                <Save size={16} />
                <span>Salvar</span>
              </button>
              
              <button
                onClick={handleExport}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm flex items-center space-x-1 transition-colors"
              >
                <Download size={16} />
                <span>Exportar</span>
              </button>
              
              <button
                onClick={handleImport}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-sm flex items-center space-x-1 transition-colors"
              >
                <Upload size={16} />
                <span>Importar</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg text-sm flex items-center space-x-1 transition-colors"
                title="Sair do painel admin"
              >
                <ArrowLeft size={16} />
                <span>Sair</span>
              </button>
              
              <button
                onClick={handleClose}
                className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm flex items-center space-x-1 transition-colors"
                title="Minimizar painel (manter sessão)"
              >
                <span>↙️</span>
                <span>Minimizar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'orders', label: 'Pedidos', icon: Package },
              { id: 'products', label: 'Gerenciar Produtos', icon: Package },
              { id: 'categories', label: 'Categorias', icon: Settings },
              { id: 'settings', label: 'Configurações', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-red-600'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'orders' && <OrderManager selectedOrder={selectedOrder} />}
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'settings' && <AdminSettings />} {/* <--- ESTA LINHA USA O COMPONENTE */}
      </main>

      {/* Clear Local Data Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={handleClearLocalData}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors shadow-lg"
          title="Limpar todos os dados salvos localmente"
        >
          <Trash2 size={16} />
          <span>Limpar Dados Locais</span>
        </button>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
