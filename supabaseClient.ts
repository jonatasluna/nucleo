import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ATENÇÃO: Substitua pelos dados do seu projeto
const supabaseUrl = 'https://uhnjsibsiohkwisyemsm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVobmpzaWJzaW9oa3dpc3llbXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDQ3MjcsImV4cCI6MjA3ODcyMDcyN30.PEqR4KvbBaFS9iY9fEKvO0Mzgtt-VoZIPATB33bENqg';

// Esta variável irá armazenar a instância do cliente Supabase
let supabase: SupabaseClient | null = null;

// Só inicializa o cliente se a URL e a Chave não forem os placeholders
if (supabaseUrl !== 'https://uhnjsibsiohkwisyemsm.supabase.co' && supabaseUrl && supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVobmpzaWJzaW9oa3dpc3llbXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDQ3MjcsImV4cCI6MjA3ODcyMDcyN30.PEqR4KvbBaFS9iY9fEKvO0Mzgtt-VoZIPATB33bENqg' && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    // Exibe um aviso proeminente no console para o desenvolvedor
    console.warn(`****************************************************************\nATENÇÃO: Credenciais do Supabase não configuradas.\nEdite o arquivo 'supabaseClient.ts' com os dados do seu projeto.\n****************************************************************`);
}

// Exporta o cliente (que pode ser nulo se não configurado)
export { supabase };
