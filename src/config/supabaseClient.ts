import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://izahiljeeinvabxzptlx.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6YWhpbGplZWludmFieHpwdGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzU5NzYsImV4cCI6MjAzNTg1MTk3Nn0.Bh4kl2JCPlDLbah_Y9I8ZCFerQPRGIK8zS3Dsur5NKY';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
