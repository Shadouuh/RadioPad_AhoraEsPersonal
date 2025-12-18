import { createClient } from '@supabase/supabase-js'

const url = "https://etskiourpuuzzyqtptas.supabase.co"
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2tpb3VycHV1enp5cXRwdGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjU1NzEsImV4cCI6MjA4MTU0MTU3MX0.rAfpiI0nraoB1GYOks2xVWHxs36N-T9tKaH7CDp5h7k"

export const supabase = url && anonKey ? createClient(url, anonKey) : null

