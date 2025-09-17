// src/contexts/AdminContext.tsx
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Product } from '../data/products';
import { Toast } from '../components/Toast'; // Importe o Toast se for usado em algum lugar (embora agora seja gerenciado pelo AdminPanel)
import { atualizarConfigWhatsApp } from '../lib/whatsapp';
import { useRealtimeProducts } from '../hooks/useRealtimeProducts';
import { 
  OperatingDay, 
  TimePeriod,
  buscarCategorias, // Importar nova função
  salvarCategorias, // Importar nova função
  CategorySettingsSupabase, // Importar nova interface
  supabase, // Importar supabase para realtime
  RealtimePayload // Importar RealtimePayload
} from '../lib/supabase'; // Certifique-se de importar as novas interfaces
import { 
  criarProduto, 
  atualizarProduto, 
  deletarProduto,
  ProdutoSupabase,
  buscarConfiguracoes,
  salvarConfiguracoes
} from '../lib/supabase';

// Chave para persistência da sessão admin
const ADMIN_SESSION_KEY = 'admin_session_active';

// Funções auxiliares para persistência de sessão do admin no localStorage
const saveAdminSession = (isAuthenticated: boolean) => {
  try {
    if (isAuthenticated) {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
        isAuthenticated: true,
        timestamp: new Date().toISOString()
      }));
    } else {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
    return true;
  } catch (error) {
    console.error('Erro ao salvar sessão admin:', error);
    return false;
  }
};

const loadAdminSession = () => {
  try {
    const saved = localStorage.getItem(ADMIN_SESSION_KEY);
    if (saved) {
      const session = JSON.parse(saved);
      return session.isAuthenticated === true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao carregar sessão admin:', error);
    return false;
  }
};

// Interface para as configurações do admin
export interface AdminSettings {
  deliveryFee: number;
  freeDeliveryMinItems: number;
  preparationTime: number;
  storeAddress: string;
  storeName: string;
  storePhone: string;
  whatsappNumber: string;
  operatingHours: OperatingDay[]; // Adicionado operatingHours aqui
}

// Interface para o estado do admin
interface AdminState {
  isAuthenticated: boolean;
  products: Product[];
  categories: string[];
  settings: AdminSettings;
  changeHistory: Array<{
    id: string;
    timestamp: Date;
    action: string;
    data: any;
  }>;
  hasUnsavedChanges: boolean;
  loading: boolean;
  error: string | null;
  settingsLoading: boolean;
}

// Configurações padrão da loja
const defaultSettings: AdminSettings = {
  deliveryFee: 3,
  freeDeliveryMinItems: 5,
  preparationTime: 30,
  storeAddress: 'Rua Barão do Rio Branco N°101',
  storeName: 'Umami',
  storePhone: '(73) 9 8819-9938',
  whatsappNumber: '+55 73 9198-9629',
  operatingHours: [
    { day: 'sunday', open: false, periods: [] },
    { day: 'monday', open: false, periods: [] },
    { day: 'tuesday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
    { day: 'wednesday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
    { day: 'thursday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
    { day: 'friday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
    { day: 'saturday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
  ]
};

const defaultCategories = ['Todos', 'Salgados', 'Doces', 'Gourmet', 'Vegano', 'Bebidas', 'Promoção', 'Combos'];

// Estado inicial do admin
const initialState: AdminState = {
  isAuthenticated: false,
  products: [],
  loading: false,
  error: null,
  categories: defaultCategories, // Usar categorias padrão inicialmente
  settings: defaultSettings,
  changeHistory: [],
  hasUnsavedChanges: false,
  settingsLoading: false
};

// Tipos de ações para o reducer do admin
type AdminAction =
  | { type: 'AUTHENTICATE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'REORDER_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CATEGORIES'; payload: string[] }
  | { type: 'ADD_CATEGORY'; payload: string }
  | { type: 'UPDATE_CATEGORY'; payload: { oldName: string; newName: string } }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AdminSettings> }
  | { type: 'ADD_TO_HISTORY'; payload: { action: string; data: any } }
  | { type: 'MARK_SAVED' }
  | { type: 'IMPORT_DATA'; payload: { products: Product[]; categories: string[]; settings: AdminSettings } }
  | { type: 'CLEAR_LOCAL_DATA' } // Não precisa de payload, reseta para padrão
  | { type: 'SET_REALTIME_PRODUCTS'; payload: Product[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESTORE_SESSION' }
  | { type: 'LOAD_SETTINGS_FROM_SUPABASE'; payload: AdminSettings }
  | { type: 'LOAD_CATEGORIES_FROM_SUPABASE'; payload: string[] } // Nova ação
  | { type: 'SET_SETTINGS_LOADING'; payload: boolean };

// Reducer para gerenciar o estado do admin
function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'AUTHENTICATE':
      saveAdminSession(true);
      return { ...state, isAuthenticated: true };
    
    case 'RESTORE_SESSION':
      return { ...state, isAuthenticated: true };
    
    case 'LOAD_SETTINGS_FROM_SUPABASE':
      return { 
        ...state, 
        settings: action.payload,
        hasUnsavedChanges: false // Assume que as configurações carregadas estão salvas
      };

    case 'LOAD_CATEGORIES_FROM_SUPABASE': // Novo case
      return {
        ...state,
        categories: action.payload,
        hasUnsavedChanges: false // Assume que as categorias carregadas estão salvas
      };
    
    case 'LOGOUT':
      saveAdminSession(false);
      return { ...state, isAuthenticated: false };
    
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    
    case 'SET_REALTIME_PRODUCTS':
      return { 
        ...state, 
        products: action.payload,
        loading: false,
        error: null
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_SETTINGS_LOADING':
      return { ...state, settingsLoading: action.payload };
    
    case 'ADD_PRODUCT':
    case 'UPDATE_PRODUCT':
    case 'DELETE_PRODUCT':
    case 'REORDER_PRODUCTS':
      return { ...state, hasUnsavedChanges: true };
    
    case 'SET_CATEGORIES': // Usado para definir categorias, mas as ações abaixo são mais específicas
      return { ...state, categories: action.payload };
    
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
        hasUnsavedChanges: true
      };
    
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat => 
          cat === action.payload.oldName ? action.payload.newName : cat
        ),
        products: state.products.map(product => 
          product.category === action.payload.oldName 
            ? { ...product, category: action.payload.newName }
            : product
        ),
        hasUnsavedChanges: true
      };
    
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(cat => cat !== action.payload),
        hasUnsavedChanges: true
      };
    
    case 'UPDATE_SETTINGS':
      if (action.payload.whatsappNumber && action.payload.whatsappNumber !== state.settings.whatsappNumber) {
        atualizarConfigWhatsApp(action.payload.whatsappNumber);
      }
      
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
        hasUnsavedChanges: true
      };
    
    case 'ADD_TO_HISTORY':
      const newHistory = [
        {
          id: Date.now().toString(),
          timestamp: new Date(),
          action: action.payload.action,
          data: action.payload.data
        },
        ...state.changeHistory
      ].slice(0, 10);
      
      return { ...state, changeHistory: newHistory };
    
    case 'MARK_SAVED':
      return { ...state, hasUnsavedChanges: false };
    
    case 'IMPORT_DATA':
      return {
        ...state,
        products: action.payload.products,
        categories: action.payload.categories,
        settings: action.payload.settings,
        hasUnsavedChanges: true
      };
    
    case 'CLEAR_LOCAL_DATA': // Reseta o estado para os valores padrão
      return {
        ...state,
        products: [], // Produtos são carregados do Supabase
        categories: defaultCategories,
        settings: defaultSettings,
        hasUnsavedChanges: false
      };
    
    default:
      return state;
  }
}

// Interface para o contexto do admin
interface AdminContextType {
  state: AdminState;
  dispatch: React.Dispatch<AdminAction>;
  // Funções para produtos (conectadas ao Supabase)
  createProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  // Funções para configurações (conectadas ao Supabase)
  loadSettingsFromSupabase: () => Promise<boolean>;
  saveSettingsToSupabase: (settingsToSave: AdminSettings) => Promise<boolean>;
  // Novas funções para categorias (conectadas ao Supabase)
  loadCategoriesFromSupabase: () => Promise<boolean>;
  saveCategoriesToSupabase: (categoriesToSave: string[]) => Promise<boolean>;
  // Função para limpar dados (agora assíncrona e salva no Supabase)
  clearLocalData: () => Promise<boolean>;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

// Criação do contexto
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Provedor do contexto do admin
export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const { products: realtimeProducts, loading, error } = useRealtimeProducts();

  // Verificar sessão salva ao inicializar
  useEffect(() => {
    const savedSession = loadAdminSession();
    if (savedSession) {
      console.log('🔐 Sessão admin restaurada do localStorage');
      dispatch({ type: 'RESTORE_SESSION' });
    }
    
    // Carregar configurações e categorias do Supabase ao inicializar
    loadSettingsFromSupabase();
    loadCategoriesFromSupabase(); // Carregar categorias do Supabase
  }, []);

  // Sincronizar produtos do realtime com o estado
  useEffect(() => {
    if (realtimeProducts.length > 0) {
      dispatch({ type: 'SET_REALTIME_PRODUCTS', payload: realtimeProducts });
    }
  }, [realtimeProducts]);

  // Sincronizar loading e error states
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, [loading]);

  useEffect(() => {
    if (error) {
      dispatch({ type: 'SET_ERROR', payload: error });
    }
  }, [error]);

  // Real-time listener para categorias
  useEffect(() => {
    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: `setting_key=eq.categories_list`
        },
        (payload: RealtimePayload<CategorySettingsSupabase>) => {
          console.log('🔄 [Realtime] Categorias atualizadas:', payload);
          if (payload.new && Array.isArray(payload.new.settings_data)) {
            dispatch({ type: 'LOAD_CATEGORIES_FROM_SUPABASE', payload: payload.new.settings_data as string[] });
          }
        }
      )
      .subscribe();

    console.log('✅ [Realtime] Canal "categories-changes" inscrito para app_settings (categories_list).');

    return () => {
      console.log('🧹 [Realtime] Limpando canal "categories-changes".');
      supabase.removeChannel(channel);
    };
  }, []);


  // Converter Product para ProdutoSupabase
  const convertProductToSupabase = (product: Omit<Product, 'id'>): Omit<ProdutoSupabase, 'id' | 'created_at' | 'updated_at'> => ({
    nome: product.name,
    preco: product.price,
    descricao: product.description,
    categoria: product.category,
    imagem: product.image,
    disponivel: product.available,
    ingredientes: product.ingredients || [],
    ordem: product.ordem || Math.max(...state.products.map(p => p.ordem || 0), 0) + 1
  });

  // Funções para produtos conectadas ao Supabase
  const createProduct = async (product: Omit<Product, 'id'>): Promise<boolean> => {
    try {
      const produtoSupabase = convertProductToSupabase(product);
      const result = await criarProduto(produtoSupabase);
      
      if (result.success) {
        dispatch({
          type: 'ADD_TO_HISTORY',
          payload: { action: 'Produto criado', data: result.data }
        });
        return true;
      } else {
        console.error('Erro ao criar produto:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      return false;
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>): Promise<boolean> => {
    try {
      const produtoSupabase: Partial<ProdutoSupabase> = {};
      
      if (product.name !== undefined) produtoSupabase.nome = product.name;
      if (product.price !== undefined) produtoSupabase.preco = product.price;
      if (product.description !== undefined) produtoSupabase.descricao = product.description;
      if (product.category !== undefined) produtoSupabase.categoria = product.category;
      if (product.image !== undefined) produtoSupabase.imagem = product.image;
      if (product.available !== undefined) produtoSupabase.disponivel = product.available;
      if (product.ingredients !== undefined) produtoSupabase.ingredientes = product.ingredients;
      if (product.ordem !== undefined) produtoSupabase.ordem = product.ordem;

      const result = await atualizarProduto(id, produtoSupabase);
      
      if (result.success) {
        dispatch({
          type: 'ADD_TO_HISTORY',
          payload: { action: 'Produto atualizado', data: result.data }
        });
        return true;
      } else {
        console.error('Erro ao atualizar produto:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return false;
    }
  };

  const deleteProductById = async (id: string): Promise<boolean> => {
    try {
      const result = await deletarProduto(id);
      
      if (result.success) {
        dispatch({
          type: 'ADD_TO_HISTORY',
          payload: { action: 'Produto deletado', data: { id } }
        });
        return true;
      } else {
        console.error('Erro ao deletar produto:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return false;
    }
  };

  // Carregar configurações do Supabase
  const loadSettingsFromSupabase = async (): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_SETTINGS_LOADING', payload: true });
      console.log('AdminContext: Carregando configurações do Supabase...');
      const result = await buscarConfiguracoes();
      
      if (result.success && result.data) {
        dispatch({ 
          type: 'LOAD_SETTINGS_FROM_SUPABASE', 
          payload: result.data 
        });
        console.log('✅ Configurações carregadas do Supabase:', result.data);
        return true;
      } else {
        console.warn('⚠️ Erro ao carregar configurações do Supabase:', result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar configurações:', error);
      return false;
    } finally {
      dispatch({ type: 'SET_SETTINGS_LOADING', payload: false });
    }
  };

  // Salvar configurações no Supabase
  const saveSettingsToSupabase = async (settingsToSave: AdminSettings): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_SETTINGS_LOADING', payload: true });
      console.log('AdminContext: Salvando configurações para Supabase:', settingsToSave);
      const result = await salvarConfiguracoes(settingsToSave);
      
      if (result.success) {
        console.log('✅ Configurações salvas no Supabase');
        return true;
      } else {
        console.error('❌ Erro ao salvar configurações no Supabase:', result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar configurações:', error);
      return false;
    } finally {
      dispatch({ type: 'SET_SETTINGS_LOADING', payload: false });
    }
  };

  // Novas funções para categorias
  const loadCategoriesFromSupabase = async (): Promise<boolean> => {
    try {
      const result = await buscarCategorias();
      if (result.success && result.data) {
        dispatch({ type: 'LOAD_CATEGORIES_FROM_SUPABASE', payload: result.data });
        console.log('✅ Categorias carregadas do Supabase:', result.data);
        return true;
      } else {
        console.warn('⚠️ Erro ao carregar categorias do Supabase:', result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar categorias:', error);
      return false;
    }
  };

  const saveCategoriesToSupabase = async (categoriesToSave: string[]): Promise<boolean> => {
    try {
      const result = await salvarCategorias(categoriesToSave);
      if (result.success) {
        console.log('✅ Categorias salvas no Supabase');
        // Após salvar, recarregar para garantir que o estado local esteja sincronizado
        loadCategoriesFromSupabase(); 
        return true;
      } else {
        console.error('❌ Erro ao salvar categorias no Supabase:', result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar categorias:', error);
      return false;
    }
  };

  // Função para limpar dados (agora assíncrona e salva no Supabase)
  const clearLocalData = async (): Promise<boolean> => {
    try {
      const categoriesResult = await salvarCategorias(defaultCategories);
      const settingsResult = await salvarConfiguracoes(defaultSettings);

      if (categoriesResult.success && settingsResult.success) {
        dispatch({ type: 'CLEAR_LOCAL_DATA' }); // Esta ação reseta o estado para o inicial
        console.log('✅ Dados locais (categorias e configurações) resetados e salvos no Supabase.');
        return true;
      } else {
        console.error('❌ Erro ao resetar dados locais:', categoriesResult.message, settingsResult.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao resetar dados locais:', error);
      return false;
    }
  };

  // Função para exportar dados (exporta o estado atual, que é sincronizado com Supabase)
  const exportData = () => {
    const exportData = {
      products: state.products,
      categories: state.categories,
      settings: state.settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  };

  // Função para importar dados (atualiza o estado, que precisará ser salvo no Supabase)
  const importData = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.products && data.categories && data.settings) {
        dispatch({
          type: 'IMPORT_DATA',
          payload: {
            products: data.products,
            categories: data.categories,
            settings: data.settings
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <>
      <AdminContext.Provider value={{
        state,
        dispatch,
        createProduct,
        updateProduct,
        deleteProduct: deleteProductById,
        loadSettingsFromSupabase,
        saveSettingsToSupabase,
        loadCategoriesFromSupabase, // Adicionado
        saveCategoriesToSupabase,   // Adicionado
        clearLocalData, // Agora assíncrona
        exportData,
        importData,
      }}>
        {children}
      </AdminContext.Provider>
    </>
  );
}

// Hook personalizado para usar o contexto do admin
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
