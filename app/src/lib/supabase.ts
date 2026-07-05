import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddrezpdjiiugdmadthjb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkcmV6cGRqaWl1Z2RtYWR0aGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NDk5NjksImV4cCI6MjA5ODQyNTk2OX0.Jfole8s9dwdGhx45PdJqBKaLiBpNa_nnfrMKLJpw1P8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
