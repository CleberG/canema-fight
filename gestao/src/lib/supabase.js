import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Sem as variáveis de ambiente o app roda em modo demonstração, só com dados fictícios em memória.
export const supabase = url && chave ? createClient(url, chave) : null;

export const EVENTO_ID = import.meta.env.VITE_EVENTO_ID || 'c3a1f000-0000-4000-8000-000000000001';
