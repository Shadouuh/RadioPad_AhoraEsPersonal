import { supabase } from '../lib/supabaseClient'

export async function loginWithPassword({ username, password }) {
  if (!supabase) {
    return null
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: username,
    password,
  })
  if (error) {
    return null
  }
  return data?.user || null
}
