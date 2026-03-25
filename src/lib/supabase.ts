import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzacilobhbsmfnayidak.supabase.co';
const supabaseAnonKey = 'sb_publishable_97vrmdc0NhTavrWB22ox_Q_LCECj6cV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
