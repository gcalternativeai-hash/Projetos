// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';
import { CartItem } from '../contexts/CartContext'; // Adicione esta importação

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis do Supabase não configuradas. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para realtime
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T = any> {
  eventType: RealtimeEvent;
  new: T;
  old: T;
  errors: any;
}

// Tipos para TypeScript (Interface PedidoSupabase unificada)
export interface PedidoSupabase {
  id?: string;
  nome: string;
  telefone: string;
  itens: string;
  adicionais?: string;
  bebidas?: string;
  valor_total: number;
  status?: 'pendente' | 'recebido' | 'producao' | 'entrega' | 'pronto_para_retirada' | 'entregue';
  data_pedido?: string;
  payment_method?: string;
  valor_pago?: number;
  delivery_fee?: number;
  updated_at?: string;
  endereco?: string;
  type?: 'delivery' | 'pickup'; // 'delivery' para entrega, 'pickup' para retirada
}

// Interface para produtos no Supabase
export interface ProdutoSupabase {
  id?: string;
  nome: string;
  preco: number;
  descricao: string;
  categoria: string;
  imagem: string;
  disponivel: boolean;
  ingredientes?: string[];
  ordem: number;
  created_at?: string;
  updated_at?: string;
}


// ==================== PRODUTOS ====================

// Buscar todos os produtos ordenados
export async function buscarProdutosOrdenados(): Promise<{ success: boolean; data?: ProdutoSupabase[]; message?: string }> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return {
        success: false,
        message: 'Erro ao carregar produtos'
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return {
      success: false,
      message: 'Erro ao carregar produtos'
    };
  }
}

// Criar produto
export async function criarProduto(produto: Omit<ProdutoSupabase, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: ProdutoSupabase; message: string }> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .insert([produto])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar produto:', error);
      return {
        success: false,
        message: 'Erro ao criar produto'
      };
    }

    return {
      success: true,
      data: data,
      message: 'Produto criado com sucesso'
    };

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return {
      success: false,
      message: 'Erro ao criar produto'
    };
  }
}

// Atualizar produto
export async function atualizarProduto(id: string, produto: Partial<ProdutoSupabase>): Promise<{ success: boolean; data?: ProdutoSupabase; message: string }> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .update(produto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar produto:', error);
      return {
        success: false,
        message: 'Erro ao atualizar produto'
      };
    }

    return {
      success: true,
      data: data,
      message: 'Produto atualizado com sucesso'
    };

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return {
      success: false,
      message: 'Erro ao atualizar produto'
    };
  }
}

// Deletar produto
export async function deletarProduto(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar produto:', error);
      return {
        success: false,
        message: 'Erro ao deletar produto'
      };
    }

    return {
      success: true,
      message: 'Produto deletado com sucesso'
    };

  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    return {
      success: false,
      message: 'Erro ao deletar produto'
    };
  }
}

// Função para atualizar ordem dos produtos
export async function atualizarOrdemProdutos(produto1: { id: string; ordem: number }, produto2: { id: string; ordem: number }): Promise<{ success: boolean; message: string }> {
  try {
    // Validar que os IDs são UUIDs válidos
    if (!produto1.id || !produto2.id) {
      return {
        success: false,
        message: 'IDs dos produtos são obrigatórios'
      };
    }

    // Atualizar primeiro produto usando UUID
    const { error: error1 } = await supabase
      .from('produtos')
      .update({ ordem: produto1.ordem })
      .eq('id', produto1.id);

    if (error1) {
      console.error('Erro ao atualizar produto 1:', error1);
      return {
        success: false,
        message: `Erro ao atualizar produto ${produto1.id}: ${error1.message}`
      };
    }

    // Atualizar segundo produto usando UUID
    const { error: error2 } = await supabase
      .from('produtos')
      .update({ ordem: produto2.ordem })
      .eq('id', produto2.id);

    if (error2) {
      console.error('Erro ao atualizar produto 2:', error2);
      return {
        success: false,
        message: `Erro ao atualizar produto ${produto2.id}: ${error2.message}`
      };
    }

    return {
      success: true,
      message: 'Ordem dos produtos atualizada com sucesso'
    };

  } catch (error) {
    console.error('Erro ao atualizar ordem:', error);
    return {
      success: false,
      message: `Erro inesperado ao atualizar ordem: ${error}`
    };
  }
}

// ==================== PEDIDOS ====================

// ==================== CONFIGURAÇÕES DA LOJA ====================

export interface TimePeriod {
  from: string; // Ex: "09:00"
  to: string;   // Ex: "18:00"
}

export interface OperatingDay {
  day: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  open: boolean; // Indica se a loja abre neste dia
  periods: TimePeriod[]; // Períodos de funcionamento (pode ter múltiplos, ex: almoço e jantar)
}

// Interface para configurações da loja no Supabase
export interface AppSettingsSupabase {
  id?: string;
  setting_key: string;
  settings_data: {
    deliveryFee: number;
    freeDeliveryMinItems: number;
    preparationTime: number;
    storeAddress: string;
    storeName: string;
    storePhone: string;
    whatsappNumber: string;
    operatingHours: OperatingDay[];
  };
  updated_at?: string;
}

// Interface para configurações de categoria no Supabase
export interface CategorySettingsSupabase {
  id?: string;
  setting_key: string; // Will be 'categories_list'
  settings_data: string[]; // Array of category names
  updated_at?: string;
}

// Buscar configurações da loja
export async function buscarConfiguracoes(): Promise<{ success: boolean; data?: AppSettingsSupabase['settings_data']; message?: string }> {
  try {
    console.log('buscarConfiguracoes: Buscando configurações...');
    const { data, error } = await supabase
      .from('app_settings')
      .select('settings_data')
      .eq('setting_key', 'store_config')
      .limit(1);

    console.log('buscarConfiguracoes: Resultado da busca:', data, error);

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      return {
        success: false,
        message: 'Erro ao carregar configurações'
      };
    }

    // Se não encontrar configurações (data é um array vazio), retorna configurações padrão
    if (!data || data.length === 0) {
      console.log('Nenhuma configuração encontrada, usando padrões');
      return {
        success: true,
        data: {
          deliveryFee: 3,
          freeDeliveryMinItems: 5,
          preparationTime: 30,
          storeAddress: 'Rua dos delivery, 123 - São Paulo',
          storeName: 'Seu Delivery', // Valor padrão
          storePhone: '(11) 99999-9999', // Valor padrão
          whatsappNumber: '+55 73 9198-9629', // Valor padrão
          operatingHours: [ // Valores padrão para operatingHours
            { day: 'sunday', open: false, periods: [] },
            { day: 'monday', open: false, periods: [] },
            { day: 'tuesday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
            { day: 'wednesday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
            { day: 'thursday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
            { day: 'friday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
            { day: 'saturday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
          ]
        }
      };
    }

    // Se os dados forem encontrados, mescle-os com os valores padrão para garantir que todos os campos estejam presentes
    // Isso é crucial para compatibilidade com registros mais antigos do Supabase
    const mergedSettings = {
      deliveryFee: data[0].settings_data.deliveryFee || 3, // Acessa o primeiro elemento do array
      freeDeliveryMinItems: data[0].settings_data.freeDeliveryMinItems || 5,
      preparationTime: data[0].settings_data.preparationTime || 30,
      storeAddress: data[0].settings_data.storeAddress || 'Rua dos Pastéis, 123 - São Paulo',
      storeName: data[0].settings_data.storeName || 'Empório do Pastel',
      storePhone: data[0].settings_data.storePhone || '(11) 99999-9999',
      whatsappNumber: data[0].settings_data.whatsappNumber || '+55 73 9198-9629',
      operatingHours: data[0].settings_data.operatingHours || [ // Garante que operatingHours seja sempre um array
        { day: 'sunday', open: false, periods: [] },
        { day: 'monday', open: false, periods: [] },
        { day: 'tuesday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
        { day: 'wednesday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
        { day: 'thursday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
        { day: 'friday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
        { day: 'saturday', open: true, periods: [{ from: '18:00', to: '00:00' }] },
      ]
    };

    return {
      success: true,
      data: mergedSettings
    };

  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    console.error('Detalhes do erro:', error); // Log detalhado
    return {
      success: false,
      message: 'Erro ao carregar configurações'
    };
  }
}

// Salvar configurações da loja
export async function salvarConfiguracoes(configuracoes: AppSettingsSupabase['settings_data']): Promise<{ success: boolean; message: string }> {
  try {
    // Primeiro, tenta buscar o registro existente
    const { data: existingRecord, error: selectError } = await supabase
      .from('app_settings')
      .select('id')
      .eq('setting_key', 'store_config')
      .limit(1)
      .single(); // Use single() aqui para verificar a existência

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erro ao verificar configurações existentes:', selectError);
      return { success: false, message: 'Erro ao verificar configurações existentes' };
    }

    if (existingRecord) {
      // Se o registro existe, atualize-o
      const { error: updateError } = await supabase
        .from('app_settings')
        .update({
          settings_data: configuracoes,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'store_config');

      if (updateError) {
        console.error('Erro ao atualizar configurações:', updateError);
        return { success: false, message: 'Erro ao atualizar configurações' };
      }
    } else {
      // Se o registro não existe, insira um novo
      const { error: insertError } = await supabase
        .from('app_settings')
        .insert([{
          setting_key: 'store_config',
          settings_data: configuracoes
        }]);

      if (insertError) {
        console.error('Erro ao inserir configurações:', insertError);
        return { success: false, message: 'Erro ao inserir configurações' };
      }
    }

    return { success: true, message: 'Configurações salvas com sucesso no Supabase' };

  } catch (error) {
    console.error('Erro inesperado ao salvar configurações:', error);
    return { success: false, message: 'Erro inesperado ao salvar configurações' };
  }
}

// Buscar categorias
export async function buscarCategorias(): Promise<{ success: boolean; data?: string[]; message?: string }> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('settings_data')
      .eq('setting_key', 'categories_list')
      .limit(1);

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return { success: false, message: 'Erro ao carregar categorias' };
    }

    // Se não encontrar categorias (data é um array vazio), retorna categorias padrão
    if (!data || data.length === 0) {
      console.log('Nenhuma configuração de categoria encontrada, usando padrões');
      return { success: true, data: ['Todos', 'Salgados', 'Doces', 'Gourmet', 'Vegano', 'Bebidas', 'Promoção', 'Combos'] };
    }

    // Ensure data[0].settings_data is an array of strings
    if (data[0] && Array.isArray(data[0].settings_data)) {
      return { success: true, data: data[0].settings_data as string[] };
    } else {
      console.warn('Formato de dados de categoria inválido no Supabase. Usando padrões.');
      return { success: true, data: ['Todos', 'Salgados', 'Doces', 'Gourmet', 'Vegano', 'Bebidas', 'Promoção', 'Combos'] };
    }

  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return { success: false, message: 'Erro inesperado ao buscar categorias' };
  }
}

// Salvar categorias
export async function salvarCategorias(categories: string[]): Promise<{ success: boolean; message: string }> {
  try {
    // Primeiro, tenta buscar o registro existente
    const { data: existingRecord, error: selectError } = await supabase
      .from('app_settings')
      .select('id')
      .eq('setting_key', 'categories_list')
      .limit(1)
      .single(); // Use single() aqui para verificar a existência

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erro ao verificar categorias existentes:', selectError);
      return { success: false, message: 'Erro ao verificar categorias existentes' };
    }

    if (existingRecord) {
      // Se o registro existe, atualize-o
      const { error: updateError } = await supabase
        .from('app_settings')
        .update({
          settings_data: categories,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'categories_list');

      if (updateError) {
        console.error('Erro ao atualizar categorias:', updateError);
        return { success: false, message: 'Erro ao atualizar categorias' };
      }
    } else {
      // Se o registro não existe, insira um novo
      const { error: insertError } = await supabase
        .from('app_settings')
        .insert([{
          setting_key: 'categories_list',
          settings_data: categories
        }]);

      if (insertError) {
        console.error('Erro ao inserir categorias:', insertError);
        return { success: false, message: 'Erro ao inserir categorias' };
      }
    }

    return { success: true, message: 'Categorias salvas com sucesso no Supabase' };

  } catch (error) {
    console.error('Erro ao salvar categorias:', error);
    return { success: false, message: 'Erro inesperado ao salvar categorias' };
  }
}

// Buscar todos os pedidos
export async function buscarTodosPedidos(): Promise<{ success: boolean; data?: PedidoSupabase[]; message?: string }> {
  try {
    console.log('buscarTodosPedidos: Buscando todos os pedidos...');
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('data_pedido', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      return {
        success: false,
        message: 'Erro ao carregar pedidos'
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return {
      success: false,
      message: 'Erro ao carregar pedidos'
    };
  }
}

// Salvar pedido no Supabase
export async function salvarPedidoSupabase(pedido: Omit<PedidoSupabase, 'id' | 'data_pedido' | 'updated_at'>): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Validar dados obrigatórios
    if (!pedido.nome || !pedido.telefone || !pedido.items || pedido.items.length === 0 || pedido.valor_total === undefined) {
      return {
        success: false,
        message: 'Dados obrigatórios não preenchidos'
      };
    }

    // Preparar dados para inserção
    const dadosPedido = {
      nome: pedido.nome.trim(),
      telefone: pedido.telefone.trim(),
      endereco: pedido.endereco?.trim() || '',
      itens: JSON.stringify(pedido.items), // Converte o array de itens para string JSON
      adicionais: pedido.adicionais || '',
      bebidas: pedido.bebidas || '',
      valor_total: Number(pedido.valor_total),
      status: 'pendente',
      type: pedido.type,
      payment_method: String(pedido.payment_method || 'pix'),
      valor_pago: pedido.payment_method === 'dinheiro' ? pedido.valor_pago : null,
      delivery_fee: pedido.delivery_fee || 0,
    };

    console.log('DEBUG - salvarPedidoSupabase: Dados sendo preparados para inserção:', dadosPedido);

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('pedidos')
      .insert([dadosPedido])
      .select()
      .single();

    if (error) {
      console.error('Erro do Supabase:', error);
      return {
        success: false,
        message: 'Erro ao salvar pedido, tente novamente'
      };
    }

    return {
      success: true,
      message: 'Pedido salvo com sucesso',
      data: data
    };

  } catch (error) {
    console.error('Erro ao salvar pedido:', error);
    return {
      success: false,
      message: 'Erro ao salvar pedido, tente novamente'
    };
  }
}

// Atualizar pedido
export async function atualizarPedido(id: string, pedido: Partial<PedidoSupabase>): Promise<{ success: boolean; data?: PedidoSupabase; message: string }> {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update(pedido)
      .eq('id', id)
      .select()
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`Pedido com ID ${id} não encontrado para atualização.`);
        return {
          success: false,
          message: 'Pedido não encontrado para atualização.'
        };
      }
      console.error('Erro ao atualizar pedido:', error);
      return {
        success: false,
        message: 'Erro ao atualizar pedido'
      };
    }

    return {
      success: true,
      data: data,
      message: 'Pedido atualizado com sucesso'
    };

  } catch (error) {
    console.error('Erro inesperado ao atualizar pedido:', error);
    return {
      success: false,
      message: 'Erro inesperado ao atualizar pedido'
    };
  }
}

// Deletar pedido
export async function deletarPedido(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar pedido:', error);
      return {
        success: false,
        message: 'Erro ao deletar pedido'
      };
    }

    return {
      success: true,
      message: 'Pedido deletado com sucesso'
    };

  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    return {
      success: false,
      message: 'Erro ao deletar pedido'
    };
  }
}
