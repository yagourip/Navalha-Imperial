import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types/index.ts';

const STORAGE_KEY = 'navalha_imperial_supabase_config';

// Retrieve configuration from localStorage or Vite environment variables
export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
        isConnected: Boolean(parsed.isConnected),
        lastTestedAt: parsed.lastTestedAt,
      };
    }
  } catch (err) {
    console.warn('Could not read Supabase config from localStorage', err);
  }

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: false,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string, isConnected = false): void {
  try {
    const config: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      isConnected,
      lastTestedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Re-initialize client
    supabaseClientInstance = null;
  } catch (err) {
    console.error('Failed to save Supabase config', err);
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    supabaseClientInstance = null;
  } catch (err) {
    console.error('Failed to clear Supabase config', err);
  }
}

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  // Basic URL validation
  if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
    return null;
  }

  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      return null;
    }
  }

  return supabaseClientInstance;
}

// Test connection to Supabase
export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string }> {
  const testUrl = (url || getStoredSupabaseConfig().url).trim();
  const testKey = (anonKey || getStoredSupabaseConfig().anonKey).trim();

  if (!testUrl || !testKey) {
    return { success: false, message: 'URL do projeto e Chave Anon são obrigatórios.' };
  }

  if (!testUrl.startsWith('https://')) {
    return { success: false, message: 'A URL do Supabase deve começar com https:// (ex: https://xyz.supabase.co)' };
  }

  try {
    const testClient = createClient(testUrl, testKey);
    // Try querying the appointments table
    const { error } = await testClient.from('appointments').select('id').limit(1);

    if (error) {
      // If error is code 42P01 (relation does not exist), client connected to Supabase successfully, but table needs to be created!
      if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('relation "appointments"')) {
        return {
          success: true,
          message: 'Conectado ao Supabase com sucesso! Observação: A tabela "appointments" ainda não foi criada. Use a aba "Script SQL" para criá-la.',
        };
      }
      return {
        success: false,
        message: `Falha na consulta ao Supabase: ${error.message} (${error.code || 'erro'})`,
      };
    }

    return {
      success: true,
      message: 'Conexão com o Supabase estabelecida com sucesso! Tabela "appointments" pronta para receber agendamentos.',
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao conectar com Supabase.';
    return {
      success: false,
      message: `Erro de conexão: ${errorMessage}`,
    };
  }
}

// Complete SQL Schema that user can copy & paste into their Supabase SQL editor
export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- TABELA DE AGENDAMENTOS DA BARBEARIA (NAVALHA IMPERIAL)
-- Cole e execute este script no "SQL Editor" do Supabase
-- ========================================================

-- 1. Criar a tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    barber_id TEXT NOT NULL,
    barber_name TEXT NOT NULL,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_duration INTEGER NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    notes TEXT,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acesso permitindo leitura e inserção de agendamentos
CREATE POLICY "Permitir leitura de agendamentos"
ON public.appointments FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir inserção de novos agendamentos"
ON public.appointments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Permitir atualização de status de agendamentos"
ON public.appointments FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Pronto! Sua tabela está configurada para receber agendamentos em tempo real.
`;
