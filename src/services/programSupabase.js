import { supabase } from '../lib/supabaseClient'

export async function getPrograms() {
  if (!supabase) {
    console.error('[programSupabase] Supabase client not initialized')
    return []
  }
  
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('id, name, description')
      .order('id', { ascending: true })
    
    if (error) {
      console.error('[programSupabase] Error fetching programs:', error)
      throw new Error(`Programs fetch failed: ${error.message}`)
    }
    
    console.log('[programSupabase] Programs fetched successfully:', data?.length || 0)
    return Array.isArray(data) ? data.map((p) => ({ id: p.id, name: p.name, description: p.description })) : []
  } catch (err) {
    console.error('[programSupabase] Exception in getPrograms:', err)
    throw err
  }
}

export async function createProgram({ name, description }) {
  if (!supabase) {
    console.error('[programSupabase] Supabase client not initialized')
    throw new Error('Supabase not configured')
  }
  
  try {
    const payload = { name, description: description || '' }
    console.log('[programSupabase] Creating program with payload:', payload)
    
    const { data, error } = await supabase
      .from('programs')
      .insert(payload)
      .select('id, name, description')
      .single()
    
    if (error) {
      console.error('[programSupabase] Error creating program:', error)
      throw new Error(`Program create failed: ${error.message}`)
    }
    
    console.log('[programSupabase] Program created successfully:', data)
    return { id: data.id, name: data.name, description: data.description }
  } catch (err) {
    console.error('[programSupabase] Exception in createProgram:', err)
    throw err
  }
}
