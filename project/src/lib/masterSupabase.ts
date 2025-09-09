// src/lib/masterSupabase.ts
import { createClient } from '@supabase/supabase-js';

// Use as variáveis de ambiente da sua Supabase MESTRA
const masterSupabaseUrl = import.meta.env.VITE_MASTER_SUPABASE_URL as string;
const masterSupabaseAnonKey = import.meta.env.VITE_MASTER_SUPABASE_ANON_KEY as string;

if (!masterSupabaseUrl || !masterSupabaseAnonKey) {
  throw new Error('Variáveis da Supabase Mestra não configuradas. Configure VITE_MASTER_SUPABASE_URL e VITE_MASTER_SUPABASE_ANON_KEY');
}

const masterSupabase = createClient(masterSupabaseUrl, masterSupabaseAnonKey);

export interface TenantConfig {
  id: string;
  path_identifier: string; // Alterado de subdomain para path_identifier
  supabase_url: string;
  supabase_anon_key: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  store_name: string;
  // Adicione outras configurações de branding aqui se expandir a tabela tenants
}

export async function getTenantConfig(pathIdentifier: string): Promise<TenantConfig | null> {
  try {
    console.log(`Buscando configuração para o inquilino: ${pathIdentifier}`);
    const { data, error } = await masterSupabase
      .from('tenants')
      .select('*')
      .eq('path_identifier', pathIdentifier)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erro ao buscar configuração do inquilino:', error);
      return null;
    }

    if (!data) {
      console.warn(`Configuração para o inquilino '${pathIdentifier}' não encontrada.`);
      return null;
    }

    console.log('Configuração do inquilino encontrada:', data);
    return data as TenantConfig;
  } catch (error) {
    console.error('Erro inesperado ao buscar configuração do inquilino:', error);
    return null;
  }
}

