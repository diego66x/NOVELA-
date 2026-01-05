import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzvoqzollizfwjfokdws.supabase.co';
// Usando a chave fornecida. Nota: Em produção, use variáveis de ambiente.
const supabaseKey = 'sb_publishable_Jj1IoKC6pS79dP98zG3QAA_uhccfG6R';

export const supabase = createClient(supabaseUrl, supabaseKey);